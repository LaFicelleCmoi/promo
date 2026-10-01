"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

export type DeleteState = { error?: string } | undefined;

/**
 * Suppression définitive du compte (droit à l'effacement) : la wishlist et l'historique d'alertes sont effacés
 * en cascade ; les promos proposées sont conservées mais deviennent anonymes.
 */
export async function deleteAccount(_prev: DeleteState, formData: FormData): Promise<DeleteState> {
  if (
    String(formData.get("confirm") ?? "")
      .trim()
      .toUpperCase() !== "SUPPRIMER"
  ) {
    return { error: "Tape SUPPRIMER pour confirmer." };
  }

  const supabase = await createClient();
  const { data } = await supabase.auth.getUser();
  if (!data.user) redirect("/login?next=/compte");

  const admin = createAdminClient();
  // Photo d'avatar : effacée avec le compte.
  const { data: files } = await admin.storage.from("avatars").list(data.user.id);
  if (files?.length) await admin.storage.from("avatars").remove(files.map((f) => `${data.user.id}/${f.name}`));

  const { error } = await admin.auth.admin.deleteUser(data.user.id);
  if (error) return { error: "La suppression a échoué, réessaie dans un instant." };

  await supabase.auth.signOut();
  revalidatePath("/", "layout");
  redirect("/");
}
