"use client";

import dynamic from "next/dynamic";

// WebGL : chargé uniquement dans le navigateur, après le rendu de la page.
const Aurora = dynamic(() => import("@/components/reactbits/Aurora"), { ssr: false });

export function AuroraBackground() {
  return (
    <div
      aria-hidden
      className="pointer-events-none absolute top-0 left-1/2 -z-10 -mt-8 w-screen -translate-x-1/2 h-[460px] opacity-40 [mask-image:linear-gradient(to_bottom,black_35%,transparent)] sm:h-[560px]"
    >
      <Aurora amplitude={1.1} blend={0.6} speed={0.8} />
    </div>
  );
}
