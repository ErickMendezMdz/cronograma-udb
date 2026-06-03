"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  getSupabaseBrowserClient,
  getSupabaseConfigError,
} from "@/lib/supabaseClient";
import { isSalonOnlyEmail } from "@/lib/moduleAccess";
import { appModules, type AppModule } from "@/config/modules";
import { PortalShell } from "@/components/layout/PortalShell";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";

const moduleAccentClasses: Record<
  AppModule["accent"],
  {
    border: string;
    label: string;
    card: string;
    badge: AppModule["accent"];
  }
> = {
  blue: {
    border: "hover:border-blue-400/60",
    label: "text-blue-300",
    card: "bg-slate-900/85 hover:bg-slate-900",
    badge: "blue",
  },
  emerald: {
    border: "hover:border-emerald-400/60",
    label: "text-emerald-300",
    card: "bg-slate-900/85 hover:bg-slate-900",
    badge: "emerald",
  },
  green: {
    border: "hover:border-green-400/60",
    label: "text-green-300",
    card: "bg-slate-900/85 hover:bg-slate-900",
    badge: "green",
  },
  salon: {
    border: "hover:border-[#d6b48a]/70",
    label: "text-[#d8be9d]",
    card: "bg-[linear-gradient(145deg,rgba(31,25,22,0.94),rgba(14,14,15,0.94))]",
    badge: "salon",
  },
};

export default function ModulosPage() {
  const router = useRouter();
  const supabase = useMemo(() => getSupabaseBrowserClient(), []);
  const configError = useMemo(() => getSupabaseConfigError(), []);
  const [checking, setChecking] = useState(true);
  const [email, setEmail] = useState<string | null>(null);
  const [salonOnly, setSalonOnly] = useState(false);

  useEffect(() => {
    async function loadSession() {
      if (!supabase) {
        setChecking(false);
        return;
      }

      const { data } = await supabase.auth.getSession();
      const session = data.session;

      if (!session) {
        router.replace("/login");
        return;
      }

      const currentEmail = session.user.email ?? null;
      setEmail(currentEmail);
      setSalonOnly(isSalonOnlyEmail(currentEmail));
      setChecking(false);
    }

    loadSession();
  }, [router, supabase]);

  async function handleLogout() {
    if (!supabase) return;
    await supabase.auth.signOut();
    router.replace("/login");
  }

  if (checking) {
    return <div className="min-h-screen flex items-center justify-center text-slate-300">Cargando...</div>;
  }

  if (!supabase) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="w-full max-w-lg rounded-2xl border border-red-900 bg-slate-900/90 p-6 shadow-2xl shadow-black/30">
          <h1 className="text-xl font-semibold text-slate-100">Configuración incompleta</h1>
          <p className="mt-2 text-sm text-slate-300">
            {configError ?? "Falta configurar las variables públicas de Supabase."}
          </p>
        </div>
      </div>
    );
  }

  const visibleModules = salonOnly
    ? appModules.filter((moduleItem) => moduleItem.salonOnly)
    : appModules;

  return (
    <PortalShell
      email={email}
      salonOnly={salonOnly}
      actions={
        <Button onClick={handleLogout} variant="secondary">
          Salir
        </Button>
      }
    >
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {visibleModules.map((moduleItem) => {
          const accent = moduleAccentClasses[moduleItem.accent];

          return (
            <Link key={moduleItem.id} href={moduleItem.href} className="group">
              <Card
                className={[
                  "h-full p-6 transition group-hover:-translate-y-1",
                  accent.card,
                  moduleItem.accent === "salon"
                    ? "border-[#6f5641]"
                    : "border-slate-700",
                  accent.border,
                ].join(" ")}
              >
                <div className="flex h-full items-start justify-between gap-4">
                  <div>
                    {moduleItem.status ? (
                      <p
                        className={[
                          "text-xs font-semibold uppercase tracking-[0.22em]",
                          accent.label,
                        ].join(" ")}
                      >
                        {moduleItem.status}
                      </p>
                    ) : null}
                    <h2
                      className={[
                        "mt-3 text-2xl font-semibold",
                        moduleItem.accent === "salon" ? "text-[#f3e8d8]" : "",
                      ].join(" ")}
                    >
                      {moduleItem.name}
                    </h2>
                    <p
                      className={[
                        "mt-3 max-w-md text-sm leading-6",
                        moduleItem.accent === "salon"
                          ? "text-[#c2b19f]"
                          : "text-slate-400",
                      ].join(" ")}
                    >
                      {moduleItem.description}
                    </p>
                  </div>
                  <Badge tone={accent.badge} className="rounded-2xl px-3 py-2 text-sm">
                    Entrar
                  </Badge>
                </div>
              </Card>
            </Link>
          );
        })}
      </div>
    </PortalShell>
  );
}
