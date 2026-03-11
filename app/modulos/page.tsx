"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  getSupabaseBrowserClient,
  getSupabaseConfigError,
} from "@/lib/supabaseClient";

export default function ModulosPage() {
  const router = useRouter();
  const supabase = useMemo(() => getSupabaseBrowserClient(), []);
  const configError = useMemo(() => getSupabaseConfigError(), []);
  const [checking, setChecking] = useState(true);
  const [email, setEmail] = useState<string | null>(null);

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

      setEmail(session.user.email ?? null);
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

  return (
    <div className="min-h-screen bg-transparent p-4 text-slate-100">
      <div className="mx-auto max-w-6xl">
        <div className="rounded-2xl border border-slate-700/70 bg-slate-900/85 p-5 shadow-2xl shadow-black/20 backdrop-blur">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <p className="text-sm uppercase tracking-[0.24em] text-slate-400">Panel</p>
              <h1 className="mt-2 text-2xl font-semibold">Seleccioná un módulo</h1>
              <p className="mt-2 text-sm text-slate-400">
                {email ? `Sesión activa: ${email}` : "Elegí a dónde querés entrar."}
              </p>
            </div>

            <button
              onClick={handleLogout}
              className="rounded-xl border border-slate-700 bg-slate-950/70 px-4 py-2 text-sm font-medium text-slate-200 hover:bg-slate-800"
            >
              Salir
            </button>
          </div>
        </div>

        <div className="mt-6 grid gap-4 md:grid-cols-2">
          <Link
            href="/cronograma"
            className="group rounded-3xl border border-slate-700 bg-slate-900/85 p-6 shadow-2xl shadow-black/20 transition hover:-translate-y-1 hover:border-blue-400/60 hover:bg-slate-900"
          >
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.22em] text-blue-300">
                  Disponible
                </p>
                <h2 className="mt-3 text-2xl font-semibold">Cronograma</h2>
                <p className="mt-3 max-w-md text-sm leading-6 text-slate-400">
                  Gestioná materias y actividades semanales desde el calendario que ya tenés construido.
                </p>
              </div>
              <div className="rounded-2xl bg-blue-500/15 px-3 py-2 text-sm font-semibold text-blue-200">
                Entrar
              </div>
            </div>
          </Link>

          <Link
            href="/dinero-tanque"
            className="group rounded-3xl border border-slate-700 bg-slate-900/85 p-6 shadow-2xl shadow-black/20 transition hover:-translate-y-1 hover:border-emerald-400/60 hover:bg-slate-900"
          >
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.22em] text-emerald-300">
                  Disponible
                </p>
                <h2 className="mt-3 text-2xl font-semibold">Dinero Tanque</h2>
                <p className="mt-3 max-w-md text-sm leading-6 text-slate-400">
                  Registrá compras, controlá gastos y mirá cuánto dinero tenés disponible para seguir construyendo.
                </p>
              </div>
              <div className="rounded-2xl bg-emerald-500/15 px-3 py-2 text-sm font-semibold text-emerald-200">
                Entrar
              </div>
            </div>
          </Link>
        </div>
      </div>
    </div>
  );
}
