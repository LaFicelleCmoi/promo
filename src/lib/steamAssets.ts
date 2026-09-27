const API = "https://api.steampowered.com/IStoreBrowseService/GetItems/v1/";
const CDN = "https://shared.akamai.steamstatic.com/store_item_assets/";

type Assets = { asset_url_format?: string; header?: string; main_capsule?: string };

/** Adresse d'une image à partir des « assets » renvoyés par l'API du store Steam. */
export function steamAssetUrl(assets: Assets | undefined, file?: string) {
  const name = file ?? assets?.header ?? assets?.main_capsule;
  if (!assets?.asset_url_format || !name) return null;
  return CDN + assets.asset_url_format.replace("${FILENAME}", name);
}

/**
 * Images d'en-tête exactes de jeux Steam. Les jeux récents rangent leurs images dans un dossier à empreinte :
 * l'adresse « apps/ID/header.jpg » n'existe pas pour eux, il faut passer par l'API.
 */
export async function steamHeaderImages(appIds: number[]): Promise<Map<number, string>> {
  const images = new Map<number, string>();
  for (let i = 0; i < appIds.length; i += 100) {
    const input = {
      ids: appIds.slice(i, i + 100).map((appid) => ({ appid })),
      context: { language: "french", country_code: "FR", steam_realm: 1 },
      data_request: { include_assets: true },
    };
    const res = await fetch(`${API}?input_json=${encodeURIComponent(JSON.stringify(input))}`, {
      next: { revalidate: 86_400 },
    });
    if (!res.ok) continue;
    const json = await res.json();
    for (const item of (json?.response?.store_items ?? []) as { appid: number; assets?: Assets }[]) {
      const url = steamAssetUrl(item.assets);
      if (url) images.set(item.appid, url);
    }
  }
  return images;
}
