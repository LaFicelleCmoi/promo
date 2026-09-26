import type { Metadata } from "next";
import { AuthForm } from "@/components/AuthForm";

export const metadata: Metadata = { title: "Connexion — Promo Tracker" };

export default async function LoginPage({ searchParams }: { searchParams: Promise<Record<string, string | undefined>> }) {
  const { next, error } = await searchParams;
  return (
    <AuthForm
      mode="login"
      next={next}
      initialError={error === "confirmation" ? "Lien de confirmation invalide ou expiré." : undefined}
    />
  );
}
