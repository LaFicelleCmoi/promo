export function formatPrice(value: number | null, currency: string) {
  if (value === null) return null;
  if (value === 0) return "Gratuit";
  return new Intl.NumberFormat("fr-FR", { style: "currency", currency }).format(value);
}

export function formatTimeLeft(endsAt: string | null) {
  if (!endsAt) return null;
  const ms = new Date(endsAt).getTime() - Date.now();
  if (ms <= 0) return "Terminée";
  const hours = Math.floor(ms / 3_600_000);
  if (hours < 24) return `Encore ${Math.max(hours, 1)} h`;
  const days = Math.floor(hours / 24);
  return `Encore ${days} j`;
}

export function computeDiscount(normal: number | null, sale: number) {
  if (!normal || normal <= 0 || sale >= normal) return 0;
  return Math.round((1 - sale / normal) * 100);
}
