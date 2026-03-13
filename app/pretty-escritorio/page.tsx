"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Cormorant_Garamond, Manrope } from "next/font/google";
import {
  getSupabaseBrowserClient,
  getSupabaseConfigError,
} from "@/lib/supabaseClient";

const displayFont = Cormorant_Garamond({
  subsets: ["latin"],
  weight: ["500", "600", "700"],
});

const uiFont = Manrope({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

const statCards = [
  {
    label: "Ingresos Totales",
    value: "$14,850",
    change: "+12%",
    note: "vs. Septiembre",
    tone: "text-[#f2d8b0]",
    glow: "shadow-[0_0_45px_rgba(233,195,146,0.12)]",
    ring: "border-[#816247]",
    chip: "bg-[#f0d3a7]/10 text-[#f4ddbd]",
  },
  {
    label: "Gastos Totales",
    value: "$6,120",
    change: "+5%",
    note: "vs. Septiembre",
    tone: "text-[#d79ba8]",
    glow: "shadow-[0_0_45px_rgba(198,124,142,0.12)]",
    ring: "border-[#784853]",
    chip: "bg-[#d18596]/10 text-[#e1b3bc]",
  },
  {
    label: "Beneficio Neto",
    value: "$8,730",
    change: "+15%",
    note: "vs. Septiembre",
    tone: "text-[#f0cf93]",
    glow: "shadow-[0_0_45px_rgba(223,182,111,0.12)]",
    ring: "border-[#8b6b43]",
    chip: "bg-[#dcb36f]/10 text-[#efd8ab]",
  },
  {
    label: "Deuda Clientes",
    value: "$3,950",
    change: "24",
    note: "clientes activos",
    tone: "text-[#ecc793]",
    glow: "shadow-[0_0_45px_rgba(211,166,104,0.12)]",
    ring: "border-[#7a5d3e]",
    chip: "bg-[#c99759]/10 text-[#efcfaa]",
  },
];

const trendIngresos = [24, 38, 64, 72, 58, 83, 61, 87, 93, 78, 101];
const trendGastos = [42, 49, 36, 35, 28, 45, 29, 41, 43, 42, 48];
const trendLabels = ["Dom", "Lun", "Mar", "Mie", "Jue", "Vie", "Sab", "Dom", "Lun", "Mar", "Hoy"];

const sources = [
  { label: "Servicios", value: "$10,400", width: "w-[84%]", color: "bg-[linear-gradient(90deg,#f0cf97,#d7a768)]" },
  { label: "Productos de venta", value: "$3,180", width: "w-[42%]", color: "bg-[linear-gradient(90deg,#cb8998,#9a6170)]" },
  { label: "Membresias", value: "$1,000", width: "w-[18%]", color: "bg-[linear-gradient(90deg,#c89d79,#936346)]" },
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

const sideMenu = [
  { label: "Escritorio", icon: "ES", active: true },
  { label: "Ingresos", icon: "IN", active: false },
  { label: "Gastos", icon: "GA", active: false },
  { label: "Caja", icon: "CJ", active: false },
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

function buildAreaPath(values: number[]) {
  const line = buildPath(values);
  return `${line} L 100 100 L 0 100 Z`;
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

function MiniIcon({ label }: { label: string }) {
  return (
    <div className="flex h-10 w-10 items-center justify-center rounded-2xl border border-[#6d5946] bg-[linear-gradient(180deg,rgba(255,255,255,0.08),rgba(255,255,255,0.02))] text-[11px] font-semibold tracking-[0.2em] text-[#ecd8bf]">
      {label}
    </div>
  );
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
    return (
      <div className={`min-h-screen flex items-center justify-center text-[#eadfd2] ${uiFont.className}`}>
        Cargando...
      </div>
    );
  }

  if (!supabase) {
    return (
      <div className={`min-h-screen flex items-center justify-center p-4 ${uiFont.className}`}>
        <div className="w-full max-w-lg rounded-[30px] border border-[#6d473f] bg-[#171211]/90 p-6 text-[#f2e8db] shadow-2xl shadow-black/30">
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
  const ingresosAreaPath = buildAreaPath(trendIngresos);
  const gastosAreaPath = buildAreaPath(trendGastos);
  const ingresosPoints = buildPoints(trendIngresos);
  const gastosPoints = buildPoints(trendGastos);

  return (
    <div className={`min-h-screen overflow-hidden bg-[#110e0d] px-3 py-4 text-[#f7eee4] sm:px-5 lg:px-8 ${uiFont.className}`}>
      <div className="pointer-events-none fixed inset-0 z-0 bg-[radial-gradient(circle_at_12%_22%,rgba(216,174,138,0.20),transparent_18%),radial-gradient(circle_at_88%_18%,rgba(195,143,107,0.18),transparent_20%),radial-gradient(circle_at_50%_100%,rgba(120,82,60,0.24),transparent_38%),linear-gradient(180deg,rgba(255,255,255,0.03),transparent_32%)]" />
      <div className="pointer-events-none fixed inset-y-0 left-0 w-[26vw] min-w-[200px] bg-[radial-gradient(circle_at_center,rgba(225,182,145,0.26),transparent_64%)] blur-3xl" />
      <div className="pointer-events-none fixed inset-y-0 right-0 w-[22vw] min-w-[180px] bg-[radial-gradient(circle_at_center,rgba(205,155,119,0.18),transparent_62%)] blur-3xl" />
      <div className="pointer-events-none fixed inset-x-0 top-0 h-36 bg-[linear-gradient(180deg,rgba(0,0,0,0.32),transparent)]" />

      <div className="relative z-10 mx-auto max-w-[1440px]">
        <div className="rounded-[34px] border border-[#6d5746] bg-[linear-gradient(180deg,rgba(16,20,20,0.96),rgba(12,15,16,0.98))] shadow-[0_40px_120px_rgba(0,0,0,0.5)] ring-1 ring-white/5 backdrop-blur">
          <div className="pointer-events-none absolute inset-0 rounded-[34px] bg-[linear-gradient(180deg,rgba(255,255,255,0.04),transparent_14%,transparent_86%,rgba(255,255,255,0.02))]" />

          <div className="grid min-h-[880px] lg:grid-cols-[258px_minmax(0,1fr)]">
            <aside className="relative border-b border-[#5a4638] p-4 lg:border-b-0 lg:border-r lg:p-5">
              <div className="flex items-center justify-between gap-4 lg:block">
                <div>
                  <p className={`${displayFont.className} text-[2.9rem] leading-none tracking-[0.18em] text-[#f6ebda]`}>
                    PRETTY
                  </p>
                  <p className="mt-1 text-[11px] uppercase tracking-[0.32em] text-[#c5b09c]">
                    Salon de belleza
                  </p>
                </div>

                <Link
                  href="/modulos"
                  className="rounded-full border border-[#705b48] px-3 py-1 text-xs font-medium text-[#ecd9c6] transition hover:bg-white/5"
                >
                  Modulos
                </Link>
              </div>

              <nav className="mt-6 flex gap-2 overflow-x-auto pb-1 lg:mt-10 lg:block lg:space-y-3 lg:overflow-visible">
                {sideMenu.map((item) => (
                  <div
                    key={item.label}
                    className={[
                      "flex min-w-fit items-center gap-3 rounded-[22px] border px-4 py-3 transition",
                      item.active
                        ? "border-[#9b7b5d] bg-[linear-gradient(180deg,rgba(247,225,191,0.16),rgba(255,255,255,0.03))] text-[#fff3e4] shadow-[0_0_30px_rgba(204,165,119,0.1)]"
                        : "border-[#4b3b2f] bg-transparent text-[#bda996] opacity-80 hover:border-[#6b5545] hover:opacity-100",
                    ].join(" ")}
                  >
                    <MiniIcon label={item.icon} />
                    <span className="text-sm font-medium">{item.label}</span>
                  </div>
                ))}
              </nav>

              <div className="mt-8 hidden rounded-[28px] border border-[#5c4737] bg-[linear-gradient(180deg,rgba(255,255,255,0.04),rgba(255,255,255,0.015))] p-5 lg:block">
                <p className="text-xs uppercase tracking-[0.26em] text-[#b89c82]">Moodboard</p>
                <div className="mt-4 grid grid-cols-3 gap-2">
                  <div className="h-16 rounded-2xl bg-[linear-gradient(180deg,#f0d6af,#ab7a55)]" />
                  <div className="h-16 rounded-2xl bg-[linear-gradient(180deg,#8d6371,#412c33)]" />
                  <div className="h-16 rounded-2xl bg-[linear-gradient(180deg,#2d3638,#111616)]" />
                </div>
                <p className="mt-4 text-sm leading-6 text-[#d7c8bb]">
                  Escritorio de referencia para el salon, con una direccion visual mas calida, elegante y editorial.
                </p>
              </div>
            </aside>

            <main className="p-4 sm:p-5 lg:p-6">
              <header className="flex flex-col gap-4 border-b border-[#4f3d30] pb-5 xl:flex-row xl:items-center xl:justify-between">
                <div>
                  <p className="text-[11px] uppercase tracking-[0.3em] text-[#bea58a]">
                    Pretty - Salon de belleza
                  </p>
                  <div className="mt-2 flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
                    <div>
                      <h1 className={`${displayFont.className} text-5xl font-semibold tracking-[0.04em] text-[#fff4e5] sm:text-6xl`}>
                        Escritorio
                      </h1>
                      <p className="mt-3 text-sm text-[#d0c0b4]">Balance financiero general del mes actual</p>
                    </div>
                    <div className="flex items-center gap-2 rounded-full border border-[#5c4537] bg-black/20 px-4 py-2 text-sm text-[#e0cfbc]">
                      <span className="inline-flex h-2 w-2 rounded-full bg-[#f0cc8f]" />
                      Este mes (Oct 2023)
                    </div>
                  </div>
                </div>

                <div className="flex flex-col gap-3 lg:min-w-[380px] xl:items-end">
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                    <div className="flex items-center gap-3 rounded-[22px] border border-[#564233] bg-black/20 px-4 py-3 text-sm text-[#d0beb0] shadow-[inset_0_1px_0_rgba(255,255,255,0.04)] sm:min-w-[210px]">
                      <span className="h-2.5 w-2.5 rounded-full bg-[#d7b68d]" />
                      Buscar clientes, pagos...
                    </div>
                    <div className="hidden h-12 w-12 items-center justify-center rounded-[20px] border border-[#564233] bg-black/20 text-[#e7d3be] shadow-[inset_0_1px_0_rgba(255,255,255,0.04)] sm:flex">
                      02
                    </div>
                  </div>

                  <div className="flex items-center justify-between gap-3 rounded-[24px] border border-[#564233] bg-[linear-gradient(180deg,rgba(255,255,255,0.045),rgba(255,255,255,0.02))] px-3 py-2">
                    <div className="flex items-center gap-3">
                      <div className="flex h-11 w-11 items-center justify-center rounded-full bg-[linear-gradient(180deg,#f0dfd0,#987968)] text-sm font-semibold text-[#241a14]">
                        EC
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-[#f6ebde]">Elena C.</p>
                        <p className="text-xs text-[#b7a595]">{email ?? "Administracion"}</p>
                      </div>
                    </div>
                    <button
                      onClick={handleLogout}
                      className="rounded-xl border border-[#644e3b] px-3 py-2 text-xs font-medium text-[#e9d7c6] transition hover:bg-white/5"
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
                    className={`rounded-[28px] border ${card.ring} bg-[linear-gradient(180deg,rgba(255,255,255,0.038),rgba(255,255,255,0.012))] p-5 ring-1 ring-white/4 ${card.glow}`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="text-sm text-[#d7c4b5]">{card.label}</p>
                        <p className={`mt-4 text-[2.6rem] font-semibold leading-none ${card.tone}`}>{card.value}</p>
                      </div>
                      <span className={`rounded-full px-3 py-1 text-xs font-semibold ${card.chip}`}>
                        {card.change}
                      </span>
                    </div>
                    <p className="mt-4 text-xs uppercase tracking-[0.24em] text-[#9f8a77]">{card.note}</p>
                  </article>
                ))}
              </section>

              <section className="mt-5 grid gap-4 xl:grid-cols-[1.6fr_0.95fr]">
                <div className="rounded-[32px] border border-[#5d4838] bg-[linear-gradient(180deg,rgba(255,255,255,0.035),rgba(255,255,255,0.012))] p-5 shadow-[inset_0_1px_0_rgba(255,255,255,0.03)]">
                  <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <h2 className={`${displayFont.className} text-[2.2rem] font-semibold text-[#fff2df]`}>
                        Ingresos vs. Gastos
                      </h2>
                      <p className="text-sm text-[#ccb8a6]">Comportamiento diario del mes</p>
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

                  <div className="mt-5 rounded-[26px] border border-[#4d3b30] bg-[linear-gradient(180deg,rgba(10,12,14,0.35),rgba(10,12,14,0.14))] p-4">
                    <div className="grid gap-4 lg:grid-cols-[54px_minmax(0,1fr)]">
                      <div className="hidden justify-between py-1 text-xs font-medium text-[#998472] lg:flex lg:flex-col">
                        <span>$20K</span>
                        <span>$15K</span>
                        <span>$10K</span>
                        <span>$5K</span>
                        <span>$0</span>
                      </div>

                      <div>
                        <svg viewBox="0 0 100 44" className="h-[240px] w-full">
                          <defs>
                            <linearGradient id="incomeFill" x1="0" x2="0" y1="0" y2="1">
                              <stop offset="0%" stopColor="#f1d29e" stopOpacity="0.28" />
                              <stop offset="100%" stopColor="#f1d29e" stopOpacity="0" />
                            </linearGradient>
                            <linearGradient id="expenseFill" x1="0" x2="0" y1="0" y2="1">
                              <stop offset="0%" stopColor="#b07a89" stopOpacity="0.18" />
                              <stop offset="100%" stopColor="#b07a89" stopOpacity="0" />
                            </linearGradient>
                          </defs>

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

                          <path d={ingresosAreaPath} fill="url(#incomeFill)" />
                          <path d={gastosAreaPath} fill="url(#expenseFill)" />
                          <path d={ingresosPath} fill="none" stroke="#f1d29e" strokeWidth="1.5" />
                          <path d={gastosPath} fill="none" stroke="#b07a89" strokeWidth="1.35" />

                          {ingresosPoints.map((point, index) => (
                            <circle
                              key={`i-${index}`}
                              cx={point.x}
                              cy={point.y}
                              r="1.25"
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
                              r="1.05"
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
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="rounded-[32px] border border-[#5d4838] bg-[linear-gradient(180deg,rgba(255,255,255,0.035),rgba(255,255,255,0.012))] p-5 shadow-[inset_0_1px_0_rgba(255,255,255,0.03)]">
                    <h2 className={`${displayFont.className} text-[2rem] font-semibold text-[#fff2df]`}>
                      Fuentes de ingreso
                    </h2>
                    <div className="mt-6 space-y-5">
                      {sources.map((source) => (
                        <div key={source.label}>
                          <div className="mb-2 flex items-center justify-between gap-3 text-sm text-[#e9dbc8]">
                            <span>{source.label}</span>
                            <span className="text-[#cfbaa4]">{source.value}</span>
                          </div>
                          <div className="h-11 rounded-2xl bg-[#1c1715] p-1 shadow-[inset_0_1px_8px_rgba(0,0,0,0.35)]">
                            <div className={`h-full rounded-xl ${source.width} ${source.color}`} />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="rounded-[32px] border border-[#6d563d] bg-[linear-gradient(180deg,rgba(244,211,169,0.10),rgba(255,255,255,0.02))] p-6 shadow-[0_0_40px_rgba(202,158,97,0.08)]">
                    <p className="text-xs uppercase tracking-[0.26em] text-[#c8aa88]">Resumen mensual</p>
                    <p className="mt-3 text-5xl font-semibold text-[#f5dfbd]">$8,730</p>
                    <div className="mt-4 flex items-center justify-between text-sm text-[#d8c3ad]">
                      <span>Meta mensual</span>
                      <span>$12,000</span>
                    </div>
                    <div className="mt-3 h-3 rounded-full bg-[#271d19] p-[2px]">
                      <div className="h-full w-[72%] rounded-full bg-[linear-gradient(90deg,#f0d19c,#b88054)]" />
                    </div>
                  </div>
                </div>
              </section>

              <section className="mt-5 rounded-[32px] border border-[#5d4838] bg-[linear-gradient(180deg,rgba(255,255,255,0.03),rgba(255,255,255,0.01))] p-5 shadow-[inset_0_1px_0_rgba(255,255,255,0.03)]">
                <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <h2 className={`${displayFont.className} text-[2rem] font-semibold text-[#fff2df]`}>
                      Transacciones Recientes
                    </h2>
                    <p className="text-sm text-[#cbb9aa]">Movimientos destacados de octubre 2023</p>
                  </div>
                  <div className="rounded-full border border-[#5b4638] px-4 py-2 text-xs uppercase tracking-[0.24em] text-[#cbb8a5]">
                    04 registros
                  </div>
                </div>

                <div className="mt-5 overflow-hidden rounded-[26px] border border-[#4d3b30]">
                  <div className="hidden grid-cols-[1fr_2fr_1fr_1fr_1fr_72px] gap-4 bg-[#181616] px-4 py-3 text-xs uppercase tracking-[0.24em] text-[#a89380] md:grid">
                    <span>Fecha</span>
                    <span>Cliente/Fuente</span>
                    <span>Tipo</span>
                    <span>Monto</span>
                    <span>Estado</span>
                    <span>Accion</span>
                  </div>

                  <div className="divide-y divide-[#44342a] bg-[linear-gradient(180deg,rgba(255,255,255,0.015),transparent)]">
                    {recentTransactions.map((transaction, index) => (
                      <div
                        key={`${transaction.client}-${index}`}
                        className="grid gap-3 px-4 py-4 transition hover:bg-white/[0.02] md:grid-cols-[1fr_2fr_1fr_1fr_1fr_72px] md:items-center"
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
