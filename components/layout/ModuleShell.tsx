import type { ReactNode } from "react";
import Link from "next/link";
import { Card } from "@/components/ui/Card";
import { PageHeader } from "@/components/ui/PageHeader";

type ModuleShellProps = {
  title: string;
  children: ReactNode;
  actions?: ReactNode;
  className?: string;
  contentClassName?: string;
};

export function ModuleShell({
  title,
  children,
  actions,
  className = "",
  contentClassName = "",
}: ModuleShellProps) {
  return (
    <main className={["min-h-screen bg-transparent p-4 text-slate-100", className].join(" ")}>
      <div className="mx-auto max-w-7xl">
        <Card className="p-5">
          <PageHeader
            title={title}
            actions={actions}
            eyebrow={
              <Link
                href="/modulos"
                className="rounded-full border border-slate-700 px-3 py-1 text-xs font-medium normal-case tracking-normal text-slate-300 hover:bg-slate-800"
              >
                Volver al portal
              </Link>
            }
          />
        </Card>

        <div className={["mt-6", contentClassName].join(" ")}>{children}</div>
      </div>
    </main>
  );
}
