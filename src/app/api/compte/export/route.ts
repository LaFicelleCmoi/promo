import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

/** Export de toutes les données du compte (droit à la portabilité, RGPD art. 20). */
export async function GET() {
  const supabase = await createClient();
  const { data: auth } = await supabase.auth.getUser();
  const user = auth.user;
  if (!user) return NextResponse.json({ error: "Non connecté" }, { status: 401 });

  const [{ data: wishlist }, { data: deals }] = await Promise.all([
    supabase.from("wishlist").select("title, platform, target_price, notify, created_at").order("created_at"),
    supabase
      .from("deals")
      .select("title, platform, store, url, sale_price, normal_price, currency, ends_at, created_at")
      .eq("created_by", user.id)
      .order("created_at"),
  ]);

  const subscriptions = Array.isArray(user.app_metadata?.push_subscriptions)
    ? user.app_metadata.push_subscriptions
    : [];
  const payload = {
    exporte_le: new Date().toISOString(),
    compte: {
      email: user.email,
      pseudo: user.user_metadata?.username ?? null,
      profil: user.user_metadata?.profile ?? null,
      cree_le: user.created_at,
      derniere_connexion: user.last_sign_in_at,
    },
    wishlist: wishlist ?? [],
    promos_proposees: deals ?? [],
    notifications: {
      appareils_abonnes: subscriptions.length,
      abonnements: subscriptions.map((s: { endpoint: string }) => ({ service: new URL(s.endpoint).host })),
    },
  };

  return new NextResponse(JSON.stringify(payload, null, 2), {
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Content-Disposition": `attachment; filename="promo-tracker-mes-donnees.json"`,
      "Cache-Control": "no-store",
    },
  });
}
