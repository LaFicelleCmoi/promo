"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

export type AuthState = { error?: string; message?: string } | undefined;

function safeNext(value: FormDataEntryValue | null) {
  const next = typeof value === "string" ? value : "";
  return next.startsWith("/") && !next.startsWith("//") ? next : "/";
}

export async function login(_prev: AuthState, formData: FormData): Promise<AuthState> {
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");
  if (!email || !password) return { error: "Email et mot de passe requis." };

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) {
    return {
      error:
        error.code === "email_not_confirmed"
          ? "Confirme ton adresse email avant de te connecter."
          : "Email ou mot de passe incorrect.",
    };
  }

  revalidatePath("/", "layout");
  redirect(safeNext(formData.get("next")));
}

export async function signup(_prev: AuthState, formData: FormData): Promise<AuthState> {
  const username = String(formData.get("username") ?? "").trim();
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");
  const confirm = String(formData.get("confirm") ?? "");

  if (username.length < 3 || username.length > 30) return { error: "Le pseudo doit faire entre 3 et 30 caractères." };
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return { error: "Adresse email invalide." };
  if (password.length < 8) return { error: "Le mot de passe doit faire au moins 8 caractères." };
  if (password !== confirm) return { error: "Les mots de passe ne correspondent pas." };

  const supabase = await createClient();

  // Par défaut, le compte est créé déjà confirmé : aucune dépendance à l'envoi d'emails,
  // l'inscription marche avec n'importe quelle adresse perso. REQUIRE_EMAIL_CONFIRMATION=true réactive la confirmation.
  if (process.env.REQUIRE_EMAIL_CONFIRMATION !== "true") {
    const admin = createAdminClient();
    const { error: createError } = await admin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { username },
    });

    if (createError) {
      if (createError.code === "email_exists" || createError.status === 422) {
        return { error: "Un compte existe déjà avec cet email. Connecte-toi." };
      }
      if (createError.code === "weak_password") return { error: "Mot de passe trop faible." };
      return { error: "Impossible de créer le compte pour le moment. Réessaie dans quelques minutes." };
    }

    const { error: loginError } = await supabase.auth.signInWithPassword({ email, password });
    if (loginError) return { error: "Compte créé, mais la connexion a échoué. Connecte-toi depuis la page Connexion." };

    revalidatePath("/", "layout");
    redirect("/");
  }

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: { username },
      emailRedirectTo: `${siteUrl}/auth/callback`,
    },
  });

  if (error) {
    return {
      error:
        error.code === "user_already_exists"
          ? "Un compte existe déjà avec cet email."
          : /confirmation email/i.test(error.message)
            ? "Impossible d'envoyer l'email de confirmation. Réessaie dans quelques minutes."
            : error.message,
    };
  }

  // Confirmation d'email désactivée dans Supabase : l'utilisateur est déjà connecté.
  if (data.session) {
    revalidatePath("/", "layout");
    redirect("/");
  }

  return { message: "Compte créé ! Clique sur le lien reçu par email pour l'activer." };
}

export async function logout() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  revalidatePath("/", "layout");
  redirect("/");
}
