"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Cormorant_Garamond } from "next/font/google";
import {
  getSupabaseBrowserClient,
  getSupabaseConfigError,
} from "@/lib/supabaseClient";

const displayFont = Cormorant_Garamond({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

const statCards = [
  {
    label: "Ingresos Totales",
    value: "$14,850",
    tone: "text-[#f5dfc0]",
    accent: "from-[#f1d6ab]/16 to-transparent",
  },
  {
    label: "Gastos Totales",
    value: "$6,120",
    tone: "text-[#df9aab]",
    accent: "from-[#c87c8e]/16 to-transparent",
  },
  {
    label: "Beneficio Neto",
    value: "$8,730",
    tone: "text-[#f4d49a]",
    accent: "from-[#dab375]/16 to-transparent",
  },
  {
    label: "Deuda Clientes",
    value: "$3,950",
    tone: "text-[#f0c996]",
    accent: "from-[#c89d68]/16 to-transparent",
  },
];

const trendIngresos = [24, 38, 64, 72, 58, 83, 61, 87, 93, 78, 101];
const trendGastos = [42, 49, 36, 35, 28, 45, 29, 41, 43, 42, 48];
const trendLabels = ["Dom", "Lun", "Mar", "Mie", "Jue", "Vie", "Sab", "Dom", "Lun", "Mar", "Hoy"];

const sources = [
  { label: "Servicios", value: "$10,400", width: "w-[84%]", color: "bg-[#f0cd98]" },
  { label: "Productos", value: "$3,180", width: "w-[42%]", color: "bg-[#c98796]" },
  { label: "Membresias", value: "$1,000", width: "w-[18%]", color: "bg-[#b38867]" },
];

const recentTransactions = [
  {
    date: "10 Oct 2023",
    client: "Sarah J. · Balayage & Corte",
    type: "Servicio",
    amount: "$245",
    status: "Pagado",
  },
  {
    date: "10 Oct 2023",
    client: "Andrea M. · Keratina Glow",
    type: "Servicio",
    amount: "$180",
    status: "Pagado",
  },
  {
    date: "09 Oct 2023",
    client: "Mariela S. · Kit de cuidado",
    type: "Producto",
    amount: "$72",
    status: "Pendiente",
  },
  {
    date: "09 Oct 2023",
    client: "Paola C. · Membresia Gold",
    type: "Membresia",
    amount: "$130",
    status: "Pagado",
  },
];

function buildPath(values: number[]) {
  const width = 100;
  const height = 100;
  const max = Math.max(...values);
  const min = Math.min(...values);
  const range = max - min || 1;

  return values
    .map((value, index) => {
      const x = (index / (values.length - 1)) * width;
      const y = height - ((value - min) / range) * height;
      return `${index === 0 ? "M" : "L"} ${x} ${y}`;
    })
    .join(" ");
}

function buildPoints(values: number[]) {
  const width = 100;
  const height = 100;
  const max = Math.max(...values);
  const min = Math.min(...values);
  const range = max - min || 1;

  return values.map((value, index) => {
    const x = (index / (values.length - 1)) * width;
    const y = height - ((value - min) / range) * height;
    return { x, y };
  });
}

export default function PrettyEscritorioPage() {
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
    return <div className="min-h-screen flex items-center justify-center text-[#e9ddd0]">Cargando...</div>;
  }

  if (!supabase) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="w-full max-w-lg rounded-3xl border border-[#6d473f] bg-[#171211]/90 p-6 text-[#f2e8db] shadow-2xl shadow-black/30">
          <h1 className="text-xl font-semibold">Configuracion incompleta</h1>
          <p className="mt-2 text-sm text-[#d1c3b7]">
            {configError ?? "Faltan las variables publicas de Supabase."}
          </p>
        </div>
      </div>
    );
  }

  const ingresosPath = buildPath(trendIngresos);
  const gastosPath = buildPath(trendGastos);
  const ingresosPoints = buildPoints(trendIngresos);
  const gastosPoints = buildPoints(trendGastos);

  return (
    <div className="min-h-screen overflow-hidden bg-[#120f0f] px-3 py-4 text-[#f7eee4] sm:px-5 lg:px-8">
      <div className="pointer-events-none fixed inset-0 z-0 bg-[radial-gradient(circle_at_left,rgba(203,160,126,0.18),transparent_28%),radial-gradient(circle_at_right,rgba(214,165,114,0.16),transparent_22%),linear-gradient(180deg,rgba(255,255,255,0.03),transparent_32%)]" />
      <div className="pointer-events-none fixed inset-y-0 left-0 w-[24vw] min-w-[180px] bg-[radial-gradient(circle_at_center,rgba(225,182,145,0.26),transparent_64%)] blur-3xl" />
      <div className="pointer-events-none fixed inset-y-0 right-0 w-[22vw] min-w-[160px] bg-[radial-gradient(circle_at_center,rgba(205,155,119,0.2),transparent_62%)] blur-3xl" />

      <div className="relative z-10 mx-auto max-w-[1380px]">
        <div className="rounded-[32px] border border-[#6d5746] bg-[linear-gradient(180deg,rgba(18,25,27,0.95),rgba(13,18,20,0.96))] shadow-[0_40px_120px_rgba(0,0,0,0.45)] backdrop-blur">
          <div className="grid min-h-[860px] lg:grid-cols-[244px_minmax(0,1fr)]">
            <aside className="border-b border-[#5a4638] p-4 lg:border-b-0 lg:border-r">
              <div className="flex items-center justify-between gap-4 lg:block">
                <div>
                  <p className={`${displayFont.className} text-4xl leading-none tracking-[0.14em] text-[#f4ead8]`}>
                    PRETTY
                  </p>
                  <p className="mt-1 text-[11px] uppercase tracking-[0.28em] text-[#c5b09c]">
                    Salon de belleza
                  </p>
                </div>

                <Link
                  href="/modulos"
                  className="rounded-full border border-[#705b48] px-3 py-1 text-xs font-medium text-[#ecd9c6] hover:bg-white/5"
                >
                  Modulos
                </Link>
              </div>

              <nav className="mt-6 flex gap-2 overflow-x-auto pb-1 lg:mt-10 lg:block lg:space-y-3 lg:overflow-visible">
                {[
                  { label: "Escritorio", active: true },
                  { label: "Ingresos", active: false },
                  { label: "Gastos", active: false },
                  { label: "Caja", active: false },
                ].map((item) => (
                  <div
                    key={item.label}
                    className={[
                      "min-w-fit rounded-2xl border px-4 py-3 text-sm transition",
                      item.active
                        ? "border-[#9b7b5d] bg-[linear-gradient(180deg,rgba(247,225,191,0.14),rgba(255,255,255,0.03))] text-[#fff3e4] shadow-[0_0_30px_rgba(204,165,119,0.09)]"
                        : "border-[#4b3b2f] bg-transparent text-[#bda996] opacity-80",
                    ].join(" ")}
                  >
                    {item.label}
                  </div>
                ))}
              </nav>

              <div className="mt-8 hidden rounded-[28px] border border-[#5c4737] bg-[linear-gradient(180deg,rgba(255,255,255,0.04),rgba(255,255,255,0.015))] p-4 lg:block">
                <p className="text-xs uppercase tracking-[0.26em] text-[#b89c82]">Vista</p>
                <p className="mt-3 text-sm leading-6 text-[#d7c8bb]">
                  Escritorio inspirado en la referencia del salon. Todavia sin base de datos, pero listo para seguir armando las otras secciones.
                </p>
              </div>
            </aside>

            <main className="p-4 sm:p-5 lg:p-6">
              <header className="flex flex-col gap-4 border-b border-[#4f3d30] pb-5 xl:flex-row xl:items-center xl:justify-between">
                <div>
                  <p className="text-[11px] uppercase tracking-[0.3em] text-[#bea58a]">
                    Pretty - Salon de belleza
                  </p>
                  <h1 className="mt-2 text-4xl font-semibold tracking-tight text-[#fff4e5]">
                    Escritorio
                  </h1>
                  <p className="mt-3 text-sm text-[#d0c0b4]">Rango de fecha: Este mes (Oct 2023)</p>
                </div>

                <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                  <div className="rounded-2xl border border-[#564233] bg-black/20 px-4 py-3 text-sm text-[#d0beb0]">
                    Buscar...
                  </div>
                  <div className="flex items-center gap-3 rounded-2xl border border-[#564233] bg-black/20 px-3 py-2">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[linear-gradient(180deg,#e8d8ca,#8f7161)] text-sm font-semibold text-[#241a14]">
                      EC
                    </div>
                    <div>
                      <p className="text-sm font-medium text-[#f6ebde]">Elena C.</p>
                      <p className="text-xs text-[#b7a595]">{email ?? "Administracion"}</p>
                    </div>
                    <button
                      onClick={handleLogout}
                      className="rounded-xl border border-[#644e3b] px-3 py-2 text-xs font-medium text-[#e9d7c6] hover:bg-white/5"
                    >
                      Salir
                    </button>
                  </div>
                </div>
              </header>

              <section className="mt-5 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                {statCards.map((card) => (
                  <article
                    key={card.label}
                    className="rounded-[28px] border border-[#5e4837] bg-[linear-gradient(180deg,rgba(255,255,255,0.035),rgba(255,255,255,0.01))] p-5"
                  >
                    <div className={`rounded-2xl bg-gradient-to-br ${card.accent} p-0`}>
                      <p className="text-sm text-[#d7c4b5]">{card.label}</p>
                      <p className={`mt-3 text-4xl font-semibold ${card.tone}`}>{card.value}</p>
                    </div>
                  </article>
                ))}
              </section>

              <section className="mt-5 grid gap-4 xl:grid-cols-[1.55fr_0.95fr]">
                <div className="rounded-[30px] border border-[#5d4838] bg-[linear-gradient(180deg,rgba(255,255,255,0.035),rgba(255,255,255,0.012))] p-5">
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <h2 className="text-[30px] font-semibold text-[#fff2df]">Ingresos vs. Gastos</h2>
                      <p className="text-sm text-[#ccb8a6]">Octubre 2023</p>
                    </div>
                    <div className="flex items-center gap-4 text-sm text-[#d9c7b8]">
                      <span className="flex items-center gap-2">
                        <span className="h-2.5 w-2.5 rounded-full bg-[#f1d29e]" />
                        Ingresos
                      </span>
                      <span className="flex items-center gap-2">
                        <span className="h-2.5 w-2.5 rounded-full bg-[#b07a89]" />
                        Gastos
                      </span>
                    </div>
                  </div>

                  <div className="mt-5 rounded-[24px] border border-[#4d3b30] bg-[linear-gradient(180deg,rgba(10,12,14,0.32),rgba(10,12,14,0.14))] p-4">
                    <svg viewBox="0 0 100 44" className="h-[220px] w-full">
                      {[0, 25, 50, 75, 100].map((mark) => (
                        <line
                          key={mark}
                          x1="0"
                          y1={mark / 2.27}
                          x2="100"
                          y2={mark / 2.27}
                          stroke="rgba(216,187,154,0.12)"
                          strokeWidth="0.4"
                        />
                      ))}

                      <path d={ingresosPath} fill="none" stroke="#f1d29e" strokeWidth="1.5" />
                      <path d={gastosPath} fill="none" stroke="#b07a89" strokeWidth="1.4" />

                      {ingresosPoints.map((point, index) => (
                        <circle
                          key={`i-${index}`}
                          cx={point.x}
                          cy={point.y}
                          r="1.3"
                          fill="#f1d29e"
                          stroke="#121515"
                          strokeWidth="0.4"
                        />
                      ))}

                      {gastosPoints.map((point, index) => (
                        <circle
                          key={`g-${index}`}
                          cx={point.x}
                          cy={point.y}
                          r="1.1"
                          fill="#b07a89"
                          stroke="#121515"
                          strokeWidth="0.35"
                        />
                      ))}
                    </svg>

                    <div className="mt-3 grid grid-cols-6 gap-2 text-[11px] uppercase tracking-[0.2em] text-[#a7917d] sm:grid-cols-11">
                      {trendLabels.map((label) => (
                        <span key={label} className="text-center">
                          {label}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="rounded-[30px] border border-[#5d4838] bg-[linear-gradient(180deg,rgba(255,255,255,0.035),rgba(255,255,255,0.012))] p-5">
                  <h2 className="text-[30px] font-semibold text-[#fff2df]">Principales Fuentes</h2>
                  <div className="mt-6 space-y-5">
                    {sources.map((source) => (
                      <div key={source.label}>
                        <div className="mb-2 flex items-center justify-between text-sm text-[#e9dbc8]">
                          <span>{source.label}</span>
                          <span className="text-[#cfbaa4]">{source.value}</span>
                        </div>
                        <div className="h-11 rounded-2xl bg-[#1c1715] p-1">
                          <div className={`h-full rounded-xl ${source.width} ${source.color}`} />
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="mt-8 rounded-[26px] border border-[#5a4637] bg-[linear-gradient(180deg,rgba(244,211,169,0.08),rgba(255,255,255,0.02))] p-5">
                    <p className="text-xs uppercase tracking-[0.26em] text-[#c8aa88]">Resumen</p>
                    <p className="mt-3 text-4xl font-semibold text-[#f5dfbd]">$8,730</p>
                    <p className="mt-2 text-sm text-[#ccb9a8]">Balance estimado del mes actual</p>
                  </div>
                </div>
              </section>

              <section className="mt-5 rounded-[30px] border border-[#5d4838] bg-[linear-gradient(180deg,rgba(255,255,255,0.03),rgba(255,255,255,0.01))] p-5">
                <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                  <h2 className="text-[30px] font-semibold text-[#fff2df]">Transacciones Recientes</h2>
                  <span className="text-sm text-[#cbb9aa]">Octubre 2023</span>
                </div>

                <div className="mt-5 overflow-hidden rounded-[24px] border border-[#4d3b30]">
                  <div className="hidden grid-cols-[1fr_2fr_1fr_1fr_1fr_72px] gap-4 bg-[#181616] px-4 py-3 text-xs uppercase tracking-[0.24em] text-[#a89380] md:grid">
                    <span>Fecha</span>
                    <span>Cliente/Fuente</span>
                    <span>Tipo</span>
                    <span>Monto</span>
                    <span>Estado</span>
                    <span>Accion</span>
                  </div>

                  <div className="divide-y divide-[#44342a]">
                    {recentTransactions.map((transaction, index) => (
                      <div
                        key={`${transaction.client}-${index}`}
                        className="grid gap-3 px-4 py-4 md:grid-cols-[1fr_2fr_1fr_1fr_1fr_72px] md:items-center"
                      >
                        <div>
                          <p className="text-xs uppercase tracking-[0.18em] text-[#8d7967] md:hidden">Fecha</p>
                          <p className="text-sm text-[#efe1d2]">{transaction.date}</p>
                        </div>
                        <div>
                          <p className="text-xs uppercase tracking-[0.18em] text-[#8d7967] md:hidden">Cliente/Fuente</p>
                          <p className="text-sm text-[#efe1d2]">{transaction.client}</p>
                        </div>
                        <div>
                          <p className="text-xs uppercase tracking-[0.18em] text-[#8d7967] md:hidden">Tipo</p>
                          <p className="text-sm text-[#d8c4b3]">{transaction.type}</p>
                        </div>
                        <div>
                          <p className="text-xs uppercase tracking-[0.18em] text-[#8d7967] md:hidden">Monto</p>
                          <p className="text-sm font-semibold text-[#f5ddb6]">{transaction.amount}</p>
                        </div>
                        <div>
                          <p className="text-xs uppercase tracking-[0.18em] text-[#8d7967] md:hidden">Estado</p>
                          <span
                            className={[
                              "inline-flex rounded-full px-3 py-1 text-xs font-medium",
                              transaction.status === "Pagado"
                                ? "bg-[#284632] text-[#9fd2ad]"
                                : "bg-[#5d3f2d] text-[#f2c690]",
                            ].join(" ")}
                          >
                            {transaction.status}
                          </span>
                        </div>
                        <div>
                          <p className="text-xs uppercase tracking-[0.18em] text-[#8d7967] md:hidden">Accion</p>
                          <span className="text-sm text-[#f3d9b0] underline decoration-[#8e6d4b] underline-offset-4">
                            Ver
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </section>
            </main>
          </div>
        </div>
      </div>
    </div>
  );
}
