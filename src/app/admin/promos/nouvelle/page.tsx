import Link from "next/link";
import { requireAdmin } from "@/lib/admin";
import { AdminDealForm } from "@/components/admin/AdminDealForm";
import { PageHeader } from "@/components/admin/ui";

export default async function AdminNewDealPage() {
  await requireAdmin();
  return (
    <>
      <Link href="/admin/promos" className="text-sm text-muted hover:text-white">
        ← Toutes les promos
      </Link>
      <PageHeader
        title="Ajouter une promo"
        description="Publiée immédiatement comme promo de la communauté, à ton nom. Elle reste jusqu'à sa date de fin."
      />
      <AdminDealForm />
    </>
  );
}
