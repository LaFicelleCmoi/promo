import { PLATFORM_LABELS, type Deal } from "@/lib/types";
import { formatPrice } from "@/lib/format";

export type AlertItem = { wishTitle: string; deal: Deal };

function escapeHtml(value: string) {
  return value.replace(/[&<>"']/g, (c) => `&#${c.charCodeAt(0)};`);
}

function dealRow({ deal }: AlertItem) {
  const sale = formatPrice(deal.sale_price, deal.currency);
  const normal =
    deal.normal_price && deal.normal_price > deal.sale_price ? formatPrice(deal.normal_price, deal.currency) : null;
  const image = deal.image_url
    ? `<img src="${escapeHtml(deal.image_url)}" alt="" width="120" style="display:block;border-radius:6px;" />`
    : "";

  return `
    <tr>
      <td style="padding:12px 0;border-bottom:1px solid #262d3d;vertical-align:top;width:132px;">${image}</td>
      <td style="padding:12px 0 12px 12px;border-bottom:1px solid #262d3d;vertical-align:top;">
        <a href="${escapeHtml(deal.url)}" style="color:#ffffff;font-weight:600;text-decoration:none;">${escapeHtml(deal.title)}</a>
        <div style="color:#8b93a7;font-size:12px;margin-top:4px;">
          ${PLATFORM_LABELS[deal.platform]} · ${escapeHtml(deal.store)}
        </div>
        <div style="margin-top:6px;">
          ${deal.discount > 0 ? `<span style="background:#22c55e;color:#000;font-weight:800;padding:1px 6px;border-radius:4px;font-size:12px;">-${deal.discount}%</span>` : ""}
          <strong style="color:#22c55e;margin-left:6px;">${sale}</strong>
          ${normal ? `<span style="color:#8b93a7;text-decoration:line-through;font-size:12px;margin-left:6px;">${normal}</span>` : ""}
        </div>
      </td>
    </tr>`;
}

export function dealAlertEmail(username: string, items: AlertItem[], siteUrl: string) {
  const count = items.length;
  const subject =
    count === 1
      ? `🎮 ${items[0].deal.title} est en promo !`
      : `🎮 ${count} jeux de ta wishlist sont en promo`;

  const html = `<!doctype html>
<html lang="fr">
  <body style="margin:0;background:#0b0d12;font-family:Inter,Arial,sans-serif;color:#e2e8f0;">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#0b0d12;padding:24px 12px;">
      <tr><td align="center">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;background:#141821;border:1px solid #262d3d;border-radius:12px;padding:24px;">
          <tr><td>
            <div style="font-size:20px;font-weight:900;"><span style="color:#7c5cff;">Promo</span>Tracker</div>
            <p style="margin:16px 0 4px;">Salut ${escapeHtml(username)} 👋</p>
            <p style="margin:0 0 8px;color:#8b93a7;">
              ${count === 1 ? "Un jeu" : `${count} promos`} de ta wishlist ${count === 1 ? "vient de passer en promo" : "viennent d'apparaître"} :
            </p>
            <table role="presentation" width="100%" cellpadding="0" cellspacing="0">${items.map(dealRow).join("")}</table>
            <p style="margin:20px 0 0;">
              <a href="${siteUrl}/wishlist" style="display:inline-block;background:#7c5cff;color:#fff;font-weight:600;padding:10px 16px;border-radius:8px;text-decoration:none;">Voir ma wishlist</a>
            </p>
            <p style="margin:20px 0 0;color:#8b93a7;font-size:11px;">
              Promo Tracker ne vend rien : aucun paiement ne se fait sur le site, l'achat a lieu sur la boutique officielle.
              Nous ne te demanderons jamais tes coordonnées bancaires.<br /><br />
              Tu reçois cet email car tu as activé les alertes sur ta wishlist Promo Tracker.
              Tu peux les désactiver depuis <a href="${siteUrl}/wishlist" style="color:#7c5cff;">ta wishlist</a>.
            </p>
          </td></tr>
        </table>
      </td></tr>
    </table>
  </body>
</html>`;

  const text = [
    `Salut ${username},`,
    "",
    "Promos correspondant à ta wishlist :",
    ...items.map(({ deal }) => `- ${deal.title} (${deal.store}) : ${formatPrice(deal.sale_price, deal.currency)} → ${deal.url}`),
    "",
    `Ta wishlist : ${siteUrl}/wishlist`,
    "",
    "Promo Tracker ne vend rien : aucun paiement sur le site, l'achat se fait sur la boutique officielle.",
  ].join("\n");

  return { subject, html, text };
}
