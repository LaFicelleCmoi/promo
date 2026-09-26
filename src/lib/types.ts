export const PLATFORMS = ["pc", "playstation", "xbox", "switch", "mobile", "other"] as const;
export type Platform = (typeof PLATFORMS)[number];

export const PLATFORM_LABELS: Record<Platform, string> = {
  pc: "PC",
  playstation: "PlayStation",
  xbox: "Xbox",
  switch: "Nintendo Switch",
  mobile: "Mobile",
  other: "Autre",
};

export type DealSource = "cheapshark" | "epic" | "nintendo" | "community";

export type Deal = {
  id: string;
  source: DealSource;
  external_id: string;
  title: string;
  platform: Platform;
  store: string;
  url: string;
  image_url: string | null;
  normal_price: number | null;
  sale_price: number;
  discount: number;
  currency: string;
  ends_at: string | null;
  created_by: string | null;
  created_at: string;
  last_seen_at: string;
};

/** Ligne prête à être upsertée par une source automatique. */
export type DealInput = Pick<
  Deal,
  | "source"
  | "external_id"
  | "title"
  | "platform"
  | "store"
  | "url"
  | "image_url"
  | "normal_price"
  | "sale_price"
  | "discount"
  | "currency"
  | "ends_at"
>;

export type WishlistItem = {
  id: string;
  user_id: string;
  title: string;
  platform: Platform | null;
  target_price: number | null;
  notify: boolean;
  created_at: string;
};

export function isPlatform(value: unknown): value is Platform {
  return typeof value === "string" && (PLATFORMS as readonly string[]).includes(value);
}
