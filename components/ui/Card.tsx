import type { HTMLAttributes, ReactNode } from "react";

type CardProps = HTMLAttributes<HTMLDivElement> & {
  children: ReactNode;
};

export function Card({ children, className = "", ...props }: CardProps) {
  return (
    <div
      className={[
        "rounded-2xl border border-slate-700/70 bg-slate-900/85 shadow-2xl shadow-black/20 backdrop-blur",
        className,
      ].join(" ")}
      {...props}
    >
      {children}
    </div>
  );
}
