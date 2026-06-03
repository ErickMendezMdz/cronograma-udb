import type { ReactNode } from "react";

type PageHeaderProps = {
  title: string;
  eyebrow?: ReactNode;
  description?: string;
  actions?: ReactNode;
  className?: string;
};

export function PageHeader({
  title,
  eyebrow,
  description,
  actions,
  className = "",
}: PageHeaderProps) {
  return (
    <header
      className={[
        "flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between",
        className,
      ].join(" ")}
    >
      <div className="min-w-0">
        {typeof eyebrow === "string" ? (
          <p className="text-sm uppercase tracking-[0.24em] text-slate-400">
            {eyebrow}
          </p>
        ) : eyebrow ? (
          <div className="text-sm uppercase tracking-[0.24em] text-slate-400">
            {eyebrow}
          </div>
        ) : null}
        <h1 className="mt-2 text-2xl font-semibold text-slate-100">{title}</h1>
        {description ? (
          <p className="mt-2 text-sm leading-6 text-slate-400">{description}</p>
        ) : null}
      </div>
      {actions ? <div className="shrink-0">{actions}</div> : null}
    </header>
  );
}
