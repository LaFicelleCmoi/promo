import type { Metadata } from "next";
import { requireAdmin } from "@/lib/admin";
import { parseProfile } from "@/lib/profile";
import { getFreshSettings } from "@/lib/settings";
import { Avatar } from "@/components/Avatar";
import { AdminNav } from "@/components/admin/AdminNav";

export const metadata: Metadata = {
  title: "Panel admin — Promo Tracker",
  robots: { index: false, follow: false },
};

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const user = await requireAdmin();
  const profile = parseProfile(user.user_metadata, user.email?.split("@")[0]);
  const settings = await getFreshSettings();

  return (
    <div className="lg:grid lg:grid-cols-[230px_minmax(0,1fr)] lg:gap-8">
      <aside className="mb-5 space-y-4 lg:sticky lg:top-24 lg:mb-0 lg:self-start">
        <div className="hidden items-center gap-3 rounded-xl border border-amber-400/30 bg-amber-400/5 p-3 lg:flex">
          <Avatar avatar={profile.avatar} name={profile.username} size={36} rounded="rounded-lg" />
          <div className="min-w-0">
            <p className="truncate text-sm font-bold text-white">{profile.username}</p>
            <p className="text-[11px] font-semibold tracking-wider text-amber-300 uppercase">Administrateur</p>
          </div>
        </div>
        <AdminNav />
        {settings.maintenance.enabled && (
          <p className="rounded-lg border border-amber-400/40 bg-amber-400/10 px-3 py-2 text-xs text-amber-200">
            🛠️ Mode maintenance actif : seuls les admins voient le site.
          </p>
        )}
      </aside>
      <div className="min-w-0 space-y-6">{children}</div>
    </div>
  );
}
