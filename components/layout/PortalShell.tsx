import type { ReactNode } from "react";
import { Card } from "@/components/ui/Card";
import { PageHeader } from "@/components/ui/PageHeader";

type PortalShellProps = {
  children: ReactNode;
  email?: string | null;
  salonOnly?: boolean;
  actions?: ReactNode;
};

export function PortalShell({
  children,
  email,
  salonOnly = false,
  actions,
}: PortalShellProps) {
  return (
    <main className="min-h-screen bg-transparent p-4 text-slate-100">
      <div className="mx-auto max-w-6xl">
        <Card className="p-5">
          <PageHeader
            eyebrow="Portal"
            title={salonOnly ? "Pretty Salon" : "Portal Personal"}
            description={
              email
                ? salonOnly
                  ? `Sesion activa: ${email}. Acceso asignado al salon.`
                  : `Sesion activa: ${email}. Selecciona un modulo para continuar.`
                : "Selecciona un modulo para continuar."
            }
            actions={actions}
          />
        </Card>

        <div className="mt-6">{children}</div>
      </div>
    </main>
  );
}
