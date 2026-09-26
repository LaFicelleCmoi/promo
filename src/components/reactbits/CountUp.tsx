"use client";

// Source : React Bits — CountUp (https://reactbits.dev). Format français et respect de « réduire les animations ».
import { useInView, useMotionValue, useReducedMotion, useSpring } from "motion/react";
import { useCallback, useEffect, useRef } from "react";

interface CountUpProps {
  to: number;
  from?: number;
  delay?: number;
  duration?: number;
  className?: string;
}

export default function CountUp({ to, from = 0, delay = 0, duration = 2, className = "" }: CountUpProps) {
  const ref = useRef<HTMLSpanElement>(null);
  const reduceMotion = useReducedMotion();
  const motionValue = useMotionValue(from);

  const damping = 20 + 40 * (1 / duration);
  const stiffness = 100 * (1 / duration);
  const springValue = useSpring(motionValue, { damping, stiffness });
  const isInView = useInView(ref, { once: true, margin: "0px" });

  const formatValue = useCallback(
    (latest: number) => new Intl.NumberFormat("fr-FR", { maximumFractionDigits: 0 }).format(latest),
    [],
  );

  useEffect(() => {
    if (ref.current) ref.current.textContent = formatValue(reduceMotion ? to : from);
  }, [from, to, reduceMotion, formatValue]);

  useEffect(() => {
    if (!isInView || reduceMotion) return;
    const timeoutId = setTimeout(() => motionValue.set(to), delay * 1000);
    return () => clearTimeout(timeoutId);
  }, [isInView, reduceMotion, motionValue, to, delay]);

  useEffect(() => {
    const unsubscribe = springValue.on("change", (latest: number) => {
      if (ref.current) ref.current.textContent = formatValue(latest);
    });
    return () => unsubscribe();
  }, [springValue, formatValue]);

  // Valeur finale rendue côté serveur : lisible sans JavaScript et par les moteurs de recherche.
  return (
    <span className={`tabular-nums ${className}`} ref={ref}>
      {formatValue(to)}
    </span>
  );
}
