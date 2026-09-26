import type { Metadata } from "next";
import { AuthForm } from "@/components/AuthForm";

export const metadata: Metadata = { title: "Inscription — Promo Tracker" };

export default function SignupPage() {
  return <AuthForm mode="signup" />;
}
