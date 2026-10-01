import type { Metadata } from "next";
import Link from "next/link";
import { AuthForm } from "@/components/AuthForm";
import { getSettings } from "@/lib/settings";

export const metadata: Metadata = { title: "Inscription — Promo Tracker" };

export default async function SignupPage() {
  const { signupsOpen } = await getSettings();
  if (signupsOpen) return <AuthForm mode="signup" />;

  return (
    <div className="mx-auto max-w-md py-10 text-center">
      <h1 className="text-2xl font-bold">Inscriptions fermées</h1>
      <p className="mt-2 text-muted">
        Les nouvelles inscriptions sont temporairement suspendues. Tu as déjà un compte ?
      </p>
      <Link href="/login" className="btn-primary mt-6 inline-flex py-2.5">
        Se connecter
      </Link>
    </div>
  );
}
