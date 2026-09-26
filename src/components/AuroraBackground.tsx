"use client";

import dynamic from "next/dynamic";

// WebGL : chargé uniquement dans le navigateur, après le rendu de la page.
const Aurora = dynamic(() => import("@/components/reactbits/Aurora"), { ssr: false });

export function AuroraBackground() {
  return (
    <div
      aria-hidden
      className="pointer-events-none absolute inset-x-0 -top-16 -z-10 h-[420px] opacity-45 [mask-image:linear-gradient(to_bottom,black_40%,transparent)] sm:h-[480px]"
    >
      <Aurora amplitude={1.1} blend={0.6} speed={0.8} />
    </div>
  );
}
