"use client";

// Source : React Bits — LineSidebar (https://reactbits.dev/components/line-sidebar).
// Adapté pour le sommaire des pages légales :
// - vrais liens d'ancre (clavier, lecteurs d'écran) et suivi de la section lue pendant le défilement ;
// - rail lumineux en dégradé qui se remplit au fil de la lecture, comète qui glisse jusqu'à la section active,
//   halos sur le trait et le titre actifs ;
// - effet de proximité au survol conservé ; animations coupées si « réduire les animations » est activé.

import { useCallback, useEffect, useRef, useState, type CSSProperties } from "react";

type Falloff = "linear" | "smooth" | "sharp";

export type LineSidebarItem = { id: string; label: string };

export interface LineSidebarProps {
  items: LineSidebarItem[];
  accentColor?: string;
  textColor?: string;
  markerColor?: string;
  showIndex?: boolean;
  proximityRadius?: number;
  maxShift?: number;
  falloff?: Falloff;
  markerLength?: number;
  itemGap?: number;
  fontSize?: number;
  smoothing?: number;
  className?: string;
  label?: string;
}

const FALLOFF_CURVES: Record<Falloff, (p: number) => number> = {
  linear: (p) => p,
  smooth: (p) => p * p * (3 - 2 * p),
  sharp: (p) => p * p * p,
};

const LineSidebar = ({
  items,
  accentColor = "#a78bfa",
  textColor = "#8b93a7",
  markerColor = "#3a4256",
  showIndex = true,
  proximityRadius = 90,
  maxShift = 14,
  falloff = "smooth",
  markerLength = 30,
  itemGap = 14,
  fontSize = 0.9,
  smoothing = 110,
  className = "",
  label = "Sommaire",
}: LineSidebarProps) => {
  const listRef = useRef<HTMLUListElement>(null);
  const itemRefs = useRef<(HTMLLIElement | null)[]>([]);
  const targetsRef = useRef<number[]>([]);
  const currentRef = useRef<number[]>([]);
  const rafRef = useRef<number | null>(null);
  const lastRef = useRef(0);
  const activeRef = useRef<number>(0);
  const smoothingRef = useRef(smoothing);
  const [activeIndex, setActiveIndex] = useState(0);
  const [indicator, setIndicator] = useState({ y: 0, ready: false });

  activeRef.current = activeIndex;
  smoothingRef.current = smoothing;

  // Boucle rAF unique : chaque entrée tend vers sa cible (proximité du pointeur ou section active)
  // avec un lissage exponentiel indépendant de la fréquence d'affichage.
  const runFrame = useCallback((now: number) => {
    const dt = Math.min((now - lastRef.current) / 1000, 0.05);
    lastRef.current = now;
    const tau = Math.max(smoothingRef.current, 1) / 1000;
    const k = 1 - Math.exp(-dt / tau);

    let moving = false;
    const els = itemRefs.current;
    for (let i = 0; i < els.length; i++) {
      const el = els[i];
      if (!el) continue;
      const target = Math.max(targetsRef.current[i] || 0, activeRef.current === i ? 1 : 0);
      const cur = currentRef.current[i] || 0;
      const next = cur + (target - cur) * k;
      const settled = Math.abs(target - next) < 0.0015;
      const value = settled ? target : next;
      currentRef.current[i] = value;
      el.style.setProperty("--effect", value.toFixed(4));
      if (!settled) moving = true;
    }
    rafRef.current = moving ? requestAnimationFrame(runFrame) : null;
  }, []);

  const startLoop = useCallback(() => {
    if (rafRef.current != null) cancelAnimationFrame(rafRef.current);
    lastRef.current = performance.now();
    rafRef.current = requestAnimationFrame(runFrame);
  }, [runFrame]);

  const handlePointerMove = useCallback(
    (e: React.PointerEvent<HTMLUListElement>) => {
      const list = listRef.current;
      if (!list) return;
      const pointerY = e.clientY - list.getBoundingClientRect().top;
      const ease = FALLOFF_CURVES[falloff] ?? FALLOFF_CURVES.linear;
      itemRefs.current.forEach((el, i) => {
        if (!el) return;
        const center = el.offsetTop + el.offsetHeight / 2;
        targetsRef.current[i] = ease(Math.max(0, 1 - Math.abs(pointerY - center) / proximityRadius));
      });
      startLoop();
    },
    [falloff, proximityRadius, startLoop],
  );

  const handlePointerLeave = useCallback(() => {
    targetsRef.current = targetsRef.current.map(() => 0);
    startLoop();
  }, [startLoop]);

  // Suivi de lecture : la section la plus haute visible dans le tiers supérieur de l'écran devient active.
  useEffect(() => {
    const sections = items.map((it) => document.getElementById(it.id)).filter((el): el is HTMLElement => !!el);
    if (sections.length === 0) return;

    const update = () => {
      const offset = window.innerHeight * 0.3;
      let current = 0;
      sections.forEach((s, i) => {
        if (s.getBoundingClientRect().top - offset <= 0) current = i;
      });
      // En bas de page, la dernière section est forcément celle qu'on lit.
      if (window.innerHeight + window.scrollY >= document.documentElement.scrollHeight - 4)
        current = sections.length - 1;
      setActiveIndex(current);
    };
    update();
    window.addEventListener("scroll", update, { passive: true });
    window.addEventListener("resize", update);
    return () => {
      window.removeEventListener("scroll", update);
      window.removeEventListener("resize", update);
    };
  }, [items]);

  // Position de la comète sur le rail.
  useEffect(() => {
    const el = itemRefs.current[activeIndex];
    if (el) setIndicator({ y: el.offsetTop + el.offsetHeight / 2, ready: true });
    startLoop();
  }, [activeIndex, startLoop]);

  useEffect(
    () => () => {
      if (rafRef.current != null) cancelAnimationFrame(rafRef.current);
    },
    [],
  );

  function go(e: React.MouseEvent<HTMLAnchorElement>, index: number, id: string) {
    const target = document.getElementById(id);
    if (!target) return;
    e.preventDefault();
    setActiveIndex(index);
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    target.scrollIntoView({ behavior: reduce ? "auto" : "smooth", block: "start" });
    history.replaceState(null, "", `#${id}`);
  }

  const progress = items.length > 1 ? activeIndex / (items.length - 1) : 1;

  return (
    <nav
      aria-label={label}
      className={`line-sidebar relative ${className}`}
      style={
        {
          "--accent-color": accentColor,
          "--text-color": textColor,
          "--marker-color": markerColor,
          "--marker-length": `${markerLength}px`,
          "--max-shift": `${maxShift}px`,
          "--item-gap": `${itemGap}px`,
          "--font-size": `${fontSize}rem`,
          paddingLeft: `${markerLength + 10}px`,
        } as CSSProperties
      }
    >
      <p className="mb-1 text-[11px] font-semibold tracking-[0.2em] text-muted uppercase">{label}</p>

      <div className="relative">
        {/* Rail de fond */}
        <span
          aria-hidden
          className="absolute top-4 bottom-4 w-px rounded-full bg-[#262d3d]"
          style={{ left: `-${markerLength + 10}px` }}
        />
        {/* Rail rempli selon la progression de lecture, en dégradé lumineux */}
        <span
          aria-hidden
          className="ls-fill absolute top-4 w-[2px] -translate-x-[0.5px] rounded-full"
          style={{
            left: `-${markerLength + 10}px`,
            height: indicator.ready ? Math.max(indicator.y - 16, 0) : 0,
            opacity: indicator.ready ? 1 : 0,
          }}
        />
        {/* Comète : point lumineux sur la section active */}
        <span
          aria-hidden
          className="ls-comet absolute h-3 w-3 -translate-x-1/2 -translate-y-1/2 rounded-full"
          style={
            {
              left: `-${markerLength + 10}px`,
              top: indicator.y,
              opacity: indicator.ready ? 1 : 0,
              "--progress": progress,
            } as CSSProperties
          }
        />

        <ul
          ref={listRef}
          onPointerMove={handlePointerMove}
          onPointerLeave={handlePointerLeave}
          className="m-0 flex list-none flex-col py-4 [gap:var(--item-gap)]"
        >
          {items.map((item, index) => {
            const active = activeIndex === index;
            return (
              <li
                key={item.id}
                ref={(el) => {
                  itemRefs.current[index] = el;
                }}
                className="relative"
              >
                {/* Trait qui relie le rail au titre */}
                <span
                  aria-hidden
                  className={`ls-marker absolute top-1/2 h-px origin-left ${active ? "ls-marker-active" : ""}`}
                  style={{ left: `-${markerLength + 10}px`, width: markerLength }}
                />
                <a
                  href={`#${item.id}`}
                  onClick={(e) => go(e, index, item.id)}
                  aria-current={active ? "location" : undefined}
                  className={`ls-link relative inline-flex items-baseline pr-[var(--max-shift)] leading-[1.25] outline-offset-4 ${active ? "ls-link-active" : ""}`}
                >
                  {showIndex && (
                    <span className="mr-2 font-mono text-[0.8em] [opacity:calc(0.5+var(--effect,0)*0.5)]">
                      {String(index + 1).padStart(2, "0")}
                    </span>
                  )}
                  <span>{item.label}</span>
                </a>
              </li>
            );
          })}
        </ul>
      </div>
    </nav>
  );
};

export default LineSidebar;
