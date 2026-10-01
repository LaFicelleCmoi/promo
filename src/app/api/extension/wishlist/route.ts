import { NextResponse, type NextRequest } from "next/server";
import { toggleWishlist } from "@/app/wishlist/actions";
import { EXTENSION_STORES, NO_STORE, cleanTitle } from "@/lib/extension";

export const dynamic = "force-dynamic";

/**
 * Extension Chrome : bouton « Suivre ce jeu » sur la page d'une boutique (ajoute ou retire de la wishlist).
 * POST /api/extension/wishlist  { "title": "ELDEN RING", "store": "steam" }
 */
export async function POST(request: NextRequest) {
  const body = (await request.json().catch(() => null)) as { title?: unknown; store?: unknown } | null;
  const title = cleanTitle(typeof body?.title === "string" ? body.title : "");
  const platform = EXTENSION_STORES[typeof body?.store === "string" ? body.store : ""] ?? "";
  if (title.length < 2) return NextResponse.json({ error: "Titre manquant" }, { status: 400, headers: NO_STORE });

  const result = await toggleWishlist(title, platform);
  if (result.error === "login") {
    return NextResponse.json({ error: "login" }, { status: 401, headers: NO_STORE });
  }
  if (result.error) return NextResponse.json(result, { status: 500, headers: NO_STORE });
  return NextResponse.json(result, { headers: NO_STORE });
}
