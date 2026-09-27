"use client";

import { useEffect, useId, useMemo, useRef, useState } from "react";

export type PricePoint = { date: string; price: number };

type Props = { points: PricePoint[]; currency: string };

const H = 240;
const PAD = { top: 20, right: 64, bottom: 28, left: 48 };

const fmtPrice = (value: number, currency: string) =>
  value === 0 ? "Gratuit" : new Intl.NumberFormat("fr-FR", { style: "currency", currency }).format(value);
const fmtDay = (iso: string) =>
  new Date(`${iso}T12:00:00Z`).toLocaleDateString("fr-FR", { day: "numeric", month: "short" });
const fmtFull = (iso: string) =>
  new Date(`${iso}T12:00:00Z`).toLocaleDateString("fr-FR", { weekday: "long", day: "numeric", month: "long" });

/** Graduations « rondes » pour l'axe des prix (ex. 0 / 10 / 20 / 30). */
function niceTicks(min: number, max: number, count = 4) {
  const span = Math.max(max - min, 1);
  const raw = span / count;
  const pow = 10 ** Math.floor(Math.log10(raw));
  const step = [1, 2, 2.5, 5, 10].map((m) => m * pow).find((s) => s >= raw) ?? raw;
  const lo = Math.max(0, Math.floor(min / step) * step);
  const hi = Math.ceil(max / step) * step;
  const ticks: number[] = [];
  for (let v = lo; v <= hi + step / 2; v += step) ticks.push(Math.round(v * 100) / 100);
  return ticks;
}

/** Historique des prix : une série en escalier (le prix tient jusqu'au relevé suivant). */
export function PriceHistoryChart({ points, currency }: Props) {
  const gradientId = useId();
  const svgRef = useRef<SVGSVGElement>(null);
  const [hover, setHover] = useState<number | null>(null);
  // Le repère suit la largeur réelle : les textes gardent leur taille sur mobile au lieu d'être réduits.
  const wrapRef = useRef<HTMLDivElement>(null);
  const [W, setW] = useState(640);
  useEffect(() => {
    const el = wrapRef.current;
    if (!el) return;
    const ro = new ResizeObserver(([entry]) => setW(Math.max(280, Math.round(entry.contentRect.width))));
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const chart = useMemo(() => {
    const prices = points.map((p) => p.price);
    const ticks = niceTicks(Math.min(...prices), Math.max(...prices));
    const yMin = ticks[0];
    const yMax = ticks[ticks.length - 1] === yMin ? yMin + 1 : ticks[ticks.length - 1];
    const times = points.map((p) => new Date(`${p.date}T12:00:00Z`).getTime());
    const t0 = times[0];
    const t1 = Math.max(times[times.length - 1], t0 + 86_400_000);

    const x = (t: number) => PAD.left + ((t - t0) / (t1 - t0)) * (W - PAD.left - PAD.right);
    const y = (v: number) => PAD.top + (1 - (v - yMin) / (yMax - yMin)) * (H - PAD.top - PAD.bottom);
    const xs = times.map(x);
    const ys = prices.map(y);

    let line = `M${xs[0]},${ys[0]}`;
    for (let i = 1; i < points.length; i++) line += ` H${xs[i]} V${ys[i]}`;
    const lastX = W - PAD.right;
    line += ` H${lastX}`;
    const area = `${line} V${y(yMin)} H${xs[0]} Z`;

    const xTickIdx =
      points.length <= 3 ? points.map((_, i) => i) : [0, Math.floor((points.length - 1) / 2), points.length - 1];

    return { ticks, xs, ys, y, line, area, lastX, xTickIdx };
  }, [points, W]);

  function onMove(e: React.PointerEvent<SVGSVGElement>) {
    const svg = svgRef.current;
    if (!svg) return;
    const rect = svg.getBoundingClientRect();
    const px = ((e.clientX - rect.left) / rect.width) * W;
    // Point actif = dernier relevé à gauche du curseur (lecture en escalier).
    let idx = 0;
    for (let i = 0; i < chart.xs.length; i++) if (chart.xs[i] <= px + 1) idx = i;
    setHover(idx);
  }

  const last = points.length - 1;
  const active = hover ?? last;
  const activeX = hover === null ? chart.lastX : chart.xs[active];
  const tooltipLeft = Math.min(Math.max((chart.xs[active] / W) * 100, 12), 80);

  return (
    <div ref={wrapRef} className="relative">
      <svg
        ref={svgRef}
        viewBox={`0 0 ${W} ${H}`}
        className="h-auto w-full touch-pan-y select-none"
        role="img"
        aria-label={`Historique du prix sur ${points.length} relevés, de ${fmtPrice(points[0].price, currency)} à ${fmtPrice(points[last].price, currency)}`}
        onPointerMove={onMove}
        onPointerDown={onMove}
        onPointerLeave={() => setHover(null)}
      >
        <defs>
          <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#7c5cff" stopOpacity="0.14" />
            <stop offset="100%" stopColor="#7c5cff" stopOpacity="0.02" />
          </linearGradient>
        </defs>

        {/* Grille horizontale discrète + graduations de prix */}
        {chart.ticks.map((t) => (
          <g key={t}>
            <line x1={PAD.left} x2={W - PAD.right} y1={chart.y(t)} y2={chart.y(t)} stroke="#262d3d" strokeWidth="1" />
            <text x={PAD.left - 8} y={chart.y(t)} dy="0.32em" textAnchor="end" fontSize="11" fill="#8b93a7">
              {new Intl.NumberFormat("fr-FR", { maximumFractionDigits: t % 1 ? 2 : 0 }).format(t)} €
            </text>
          </g>
        ))}

        {/* Dates */}
        {chart.xTickIdx.map((i) => (
          <text
            key={points[i].date}
            x={chart.xs[i]}
            y={H - 8}
            textAnchor={i === 0 ? "start" : i === last ? "end" : "middle"}
            fontSize="11"
            fill="#8b93a7"
          >
            {fmtDay(points[i].date)}
          </text>
        ))}

        <path d={chart.area} fill={`url(#${gradientId})`} />
        <path
          d={chart.line}
          fill="none"
          stroke="#7c5cff"
          strokeWidth="2"
          strokeLinejoin="round"
          strokeLinecap="round"
        />

        {/* Curseur de survol */}
        {hover !== null && (
          <line x1={activeX} x2={activeX} y1={PAD.top} y2={H - PAD.bottom} stroke="#8b93a7" strokeWidth="1" />
        )}

        {/* Point actif (ou dernier relevé) avec anneau couleur surface */}
        <circle cx={activeX} cy={chart.ys[active]} r="5" fill="#7c5cff" stroke="#141821" strokeWidth="2" />

        {/* Étiquette directe : prix actuel en bout de ligne */}
        {hover === null && (
          <text x={chart.lastX + 10} y={chart.ys[last]} dy="0.32em" fontSize="12" fontWeight="700" fill="#e2e8f0">
            {fmtPrice(points[last].price, currency)}
          </text>
        )}
      </svg>

      {hover !== null && (
        <div
          className="pointer-events-none absolute top-0 -translate-x-1/2 rounded-lg border border-border bg-bg/95 px-3 py-2 text-xs shadow-xl"
          style={{ left: `${tooltipLeft}%` }}
        >
          <p className="text-muted first-letter:uppercase">{fmtFull(points[active].date)}</p>
          <p className="mt-0.5 flex items-center gap-1.5 font-semibold text-white">
            <span aria-hidden className="inline-block h-2 w-2 rounded-full bg-accent" />
            {fmtPrice(points[active].price, currency)}
          </p>
        </div>
      )}

      <details className="mt-3 text-sm">
        <summary className="cursor-pointer text-xs text-muted hover:text-white">Voir les relevés en tableau</summary>
        <table className="mt-2 w-full text-left text-xs">
          <thead className="text-muted">
            <tr>
              <th className="py-1 font-medium">Date</th>
              <th className="py-1 text-right font-medium">Prix</th>
            </tr>
          </thead>
          <tbody>
            {[...points].reverse().map((p) => (
              <tr key={p.date} className="border-t border-border">
                <td className="py-1.5 text-slate-300 first-letter:uppercase">{fmtFull(p.date)}</td>
                <td className="py-1.5 text-right font-medium text-white tabular-nums">{fmtPrice(p.price, currency)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </details>
    </div>
  );
}
