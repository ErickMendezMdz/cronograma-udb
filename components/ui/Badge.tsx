import type { HTMLAttributes, ReactNode } from "react";

type BadgeTone = "slate" | "blue" | "emerald" | "green" | "salon";

const toneClasses: Record<BadgeTone, string> = {
  slate: "bg-slate-800 text-slate-300",
  blue: "bg-blue-500/15 text-blue-200",
  emerald: "bg-emerald-500/15 text-emerald-200",
  green: "bg-green-500/15 text-green-200",
  salon: "bg-[#d6b48a]/15 text-[#ecd3b2]",
};

type BadgeProps = HTMLAttributes<HTMLSpanElement> & {
  children: ReactNode;
  tone?: BadgeTone;
};

export function Badge({
  children,
  className = "",
  tone = "slate",
  ...props
}: BadgeProps) {
  return (
    <span
      className={[
        "inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold",
        toneClasses[tone],
        className,
      ].join(" ")}
      {...props}
    >
      {children}
    </span>
  );
}
