import type { Metadata } from "next";
import { AuthForm } from "@/components/AuthForm";

export const metadata: Metadata = { title: "Connexion — Promo Tracker" };

const ERRORS: Record<string, string> = {
  otp_expired: "Ce lien a expiré ou a déjà été utilisé. Si ton compte est confirmé, connecte-toi directement.",
  confirmation: "Lien de confirmation invalide ou expiré.",
};

export default async function LoginPage({ searchParams }: { searchParams: Promise<Record<string, string | undefined>> }) {
  const { next, error } = await searchParams;
  return (
    <AuthForm
      mode="login"
      next={next}
      initialError={error ? (ERRORS[error] ?? ERRORS.confirmation) : undefined}
    />
  );
}
