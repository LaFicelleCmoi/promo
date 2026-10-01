"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { parseProfile } from "@/lib/profile";

const BUCKET = "avatars";
const MAX_BYTES = 1024 * 1024; // 1 Mo : l'image est déjà recadrée et compressée dans le navigateur
const TYPES = ["image/webp", "image/png", "image/jpeg"];

async function currentUser() {
  const supabase = await createClient();
  const { data } = await supabase.auth.getUser();
  return { supabase, user: data.user };
}

/** Envoie la photo d'avatar dans le stockage et renvoie son adresse publique (enregistrée avec le profil). */
export async function uploadAvatar(formData: FormData): Promise<{ url?: string; error?: string }> {
  const { user } = await currentUser();
  if (!user) return { error: "Connecte-toi pour changer ton avatar." };

  const file = formData.get("file");
  if (!(file instanceof File)) return { error: "Aucune image reçue." };
  if (!TYPES.includes(file.type)) return { error: "Format accepté : JPG, PNG ou WebP." };
  if (file.size > MAX_BYTES) return { error: "Image trop lourde (1 Mo maximum)." };

  const admin = createAdminClient();
  const ext = file.type === "image/png" ? "png" : file.type === "image/jpeg" ? "jpg" : "webp";
  const path = `${user.id}/${Date.now()}.${ext}`;
  const { error } = await admin.storage
    .from(BUCKET)
    .upload(path, Buffer.from(await file.arrayBuffer()), { contentType: file.type, cacheControl: "31536000" });
  if (error) return { error: "L'envoi de l'image a échoué, réessaie." };

  // On ne garde que la nouvelle photo et celle actuellement enregistrée.
  const current = parseProfile(user.user_metadata).avatar;
  const keep = new Set([path.split("/")[1], current.type === "photo" ? current.url.split("/").pop() : ""]);
  const { data: files } = await admin.storage.from(BUCKET).list(user.id);
  const stale = (files ?? []).filter((f) => !keep.has(f.name)).map((f) => `${user.id}/${f.name}`);
  if (stale.length) await admin.storage.from(BUCKET).remove(stale);

  return { url: admin.storage.from(BUCKET).getPublicUrl(path).data.publicUrl };
}

/** Enregistre le profil : chaque champ est validé (valeurs autorisées uniquement). */
export async function saveProfile(input: unknown): Promise<{ ok: boolean; error?: string }> {
  const { supabase, user } = await currentUser();
  if (!user) return { ok: false, error: "Connecte-toi pour modifier ton profil." };

  const data = (input ?? {}) as { username?: unknown; profile?: Record<string, unknown> };
  const username = typeof data.username === "string" ? data.username.trim() : "";
  if (username.length < 3 || username.length > 30)
    return { ok: false, error: "Le pseudo doit faire entre 3 et 30 caractères." };

  const profile = parseProfile({ username, profile: data.profile });
  // Une photo doit venir du dossier de l'utilisateur dans notre stockage.
  const ownPrefix = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/${BUCKET}/${user.id}/`;
  if (profile.avatar.type === "photo" && !profile.avatar.url.startsWith(ownPrefix)) {
    return { ok: false, error: "Photo d'avatar invalide." };
  }

  const { username: _u, ...rest } = profile;
  const { error } = await supabase.auth.updateUser({ data: { username, profile: rest } });
  if (error) return { ok: false, error: "L'enregistrement a échoué, réessaie." };

  revalidatePath("/", "layout");
  return { ok: true };
}
