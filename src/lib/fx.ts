import "server-only";

/** Taux USD → EUR du jour (Banque centrale européenne via frankfurter.dev), mis en cache une journée. */
export async function getUsdToEur(): Promise<number | null> {
  try {
    const res = await fetch("https://api.frankfurter.dev/v1/latest?base=USD&symbols=EUR", {
      next: { revalidate: 86_400 },
    });
    if (!res.ok) return null;
    const json = await res.json();
    const rate = Number(json?.rates?.EUR);
    return Number.isFinite(rate) && rate > 0 ? rate : null;
  } catch {
    return null;
  }
}
