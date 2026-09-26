// Source : React Bits — StarBorder (https://reactbits.dev).
// Adapté : padding interne paramétrable (innerClassName) et keyframes déclarées dans globals.css (Tailwind v4).
import React from "react";

type StarBorderProps<T extends React.ElementType> = React.ComponentPropsWithoutRef<T> & {
  as?: T;
  className?: string;
  innerClassName?: string;
  children?: React.ReactNode;
  color?: string;
  speed?: React.CSSProperties["animationDuration"];
  thickness?: number;
};

const StarBorder = <T extends React.ElementType = "button">({
  as,
  className = "",
  innerClassName = "px-6 py-3 text-base",
  color = "#7c5cff",
  speed = "6s",
  thickness = 1,
  children,
  ...rest
}: StarBorderProps<T>) => {
  const Component = as || "button";

  return (
    <Component
      className={`relative inline-block overflow-hidden rounded-lg ${className}`}
      {...rest}
      style={{ padding: `${thickness}px 0`, ...(rest as { style?: React.CSSProperties }).style }}
    >
      <div
        aria-hidden
        className="animate-star-movement-bottom absolute right-[-250%] bottom-[-11px] z-0 h-[50%] w-[300%] rounded-full opacity-70"
        style={{ background: `radial-gradient(circle, ${color}, transparent 10%)`, animationDuration: speed }}
      />
      <div
        aria-hidden
        className="animate-star-movement-top absolute top-[-10px] left-[-250%] z-0 h-[50%] w-[300%] rounded-full opacity-70"
        style={{ background: `radial-gradient(circle, ${color}, transparent 10%)`, animationDuration: speed }}
      />
      <div
        className={`relative z-[1] rounded-lg border border-accent/40 bg-accent text-center font-semibold text-white transition hover:bg-accent-hover ${innerClassName}`}
      >
        {children}
      </div>
    </Component>
  );
};

export default StarBorder;
