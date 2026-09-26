"use client";

// Source : React Bits — GradientText (https://reactbits.dev).
// Adapté : rendu en <span> (utilisable dans un titre), pause si « réduire les animations » est activé.
import { type ReactNode, useRef } from "react";
import { motion, useAnimationFrame, useMotionValue, useReducedMotion, useTransform } from "motion/react";

interface GradientTextProps {
  children: ReactNode;
  className?: string;
  colors?: string[];
  animationSpeed?: number;
}

export default function GradientText({
  children,
  className = "",
  colors = ["#7c5cff", "#22c55e", "#b497cf"],
  animationSpeed = 8,
}: GradientTextProps) {
  const reduceMotion = useReducedMotion();
  const progress = useMotionValue(0);
  const elapsedRef = useRef(0);
  const lastTimeRef = useRef<number | null>(null);
  const duration = animationSpeed * 1000;

  useAnimationFrame((time) => {
    if (reduceMotion) return;
    if (lastTimeRef.current === null) {
      lastTimeRef.current = time;
      return;
    }
    elapsedRef.current += time - lastTimeRef.current;
    lastTimeRef.current = time;

    // Aller-retour du dégradé
    const cycle = elapsedRef.current % (duration * 2);
    progress.set(cycle < duration ? (cycle / duration) * 100 : 100 - ((cycle - duration) / duration) * 100);
  });

  const backgroundPosition = useTransform(progress, (p) => `${p}% 50%`);

  return (
    <motion.span
      className={`inline-block bg-clip-text text-transparent ${className}`}
      style={{
        backgroundImage: `linear-gradient(to right, ${[...colors, colors[0]].join(", ")})`,
        backgroundSize: "300% 100%",
        backgroundPosition,
        WebkitBackgroundClip: "text",
      }}
    >
      {children}
    </motion.span>
  );
}
