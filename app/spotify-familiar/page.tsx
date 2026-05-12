"use client";

import { type FormEvent, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  getSupabaseBrowserClient,
  getSupabaseConfigError,
} from "@/lib/supabaseClient";
import { isSalonOnlyEmail } from "@/lib/moduleAccess";

type SpotifyMember = {
  id: string;
  name: string;
  monthlyAmount: number;
  startMonth: string;
  active: boolean;
  displayOrder: number;
};

type SpotifyMemberRow = {
  id: string;
  name: string;
  monthly_amount: number | string;
  start_month: string;
  active: boolean;
  display_order: number | null;
};

type SpotifyPayment = {
  id: string;
  memberId: string;
  billingMonth: string;
  amount: number;
  paymentDate: string;
  paymentMethod: string;
  notes: string;
};

type SpotifyPaymentRow = {
  id: string;
  member_id: string;
  billing_month: string;
  amount: number | string;
  payment_date: string;
  payment_method: string | null;
  notes: string | null;
};

type PaymentDraft = {
  memberId: string;
  months: string;
  amountPerMonth: string;
  paymentDate: string;
  paymentMethod: string;
  notes: string;
};

const money = new Intl.NumberFormat("es-SV", {
  style: "currency",
  currency: "USD",
});

const paymentMethods = ["Cuenta Banco", "Efectivo"] as const;

const memberSelect =
  "id, name, monthly_amount, start_month, active, display_order";
const paymentSelect =
  "id, member_id, billing_month, amount, payment_date, payment_method, notes";

function pad(value: number) {
  return String(value).padStart(2, "0");
}

function toISODate(date: Date) {
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

function todayISO() {
  return toISODate(new Date());
}

function currentMonthISO() {
  return todayISO().slice(0, 7);
}

function addMonths(month: string, amount: number) {
  const [year, monthNumber] = month.split("-").map(Number);
  const date = new Date(year, monthNumber - 1 + amount, 1);
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}`;
}

function formatMonth(value: string) {
  return new Intl.DateTimeFormat("es-SV", {
    month: "short",
    year: "numeric",
  }).format(new Date(`${value}-01T00:00:00`));
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat("es-SV", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(new Date(`${value}T00:00:00`));
}

function normalizeMember(row: SpotifyMemberRow): SpotifyMember {
  return {
    id: row.id,
    name: row.name,
    monthlyAmount: Number(row.monthly_amount),
    startMonth: row.start_month,
    active: row.active,
    displayOrder: row.display_order ?? 0,
  };
}

function normalizePayment(row: SpotifyPaymentRow): SpotifyPayment {
  return {
    id: row.id,
    memberId: row.member_id,
    billingMonth: row.billing_month,
    amount: Number(row.amount),
    paymentDate: row.payment_date,
    paymentMethod: row.payment_method ?? "Cuenta Banco",
    notes: row.notes ?? "",
  };
}

function paymentKey(memberId: string, month: string) {
  return `${memberId}:${month}`;
}

function getPaidAmount(paymentsByMonth: Map<string, SpotifyPayment>, memberId: string, month: string) {
  return paymentsByMonth.get(paymentKey(memberId, month))?.amount ?? 0;
}

function getMonthStatus(
  member: SpotifyMember,
  month: string,
  paymentsByMonth: Map<string, SpotifyPayment>
) {
  if (month < member.startMonth || !member.active) return "inactive";

  const paid = getPaidAmount(paymentsByMonth, member.id, month);
  if (paid >= member.monthlyAmount) return "paid";
  if (paid > 0) return "partial";
  if (month > currentMonthISO()) return "future";
  return "pending";
}

function findFirstPaymentMonth(
  member: SpotifyMember,
  paymentsByMonth: Map<string, SpotifyPayment>
) {
  let month = member.startMonth;
  const limit = addMonths(currentMonthISO(), 36);

  while (month <= limit) {
    if (getPaidAmount(paymentsByMonth, member.id, month) < member.monthlyAmount) {
      return month;
    }
    month = addMonths(month, 1);
  }

  return addMonths(limit, 1);
}

function getMemberDebt(
  member: SpotifyMember,
  paymentsByMonth: Map<string, SpotifyPayment>,
  throughMonth = currentMonthISO()
) {
  let total = 0;
  const pendingMonths: string[] = [];
  let month = member.startMonth;

  while (month <= throughMonth) {
    const pending = Math.max(member.monthlyAmount - getPaidAmount(paymentsByMonth, member.id, month), 0);
    if (pending > 0) {
      total += pending;
      pendingMonths.push(month);
    }
    month = addMonths(month, 1);
  }

  return { total, pendingMonths };
}

function buildPaymentApplications(
  member: SpotifyMember,
  paymentsByMonth: Map<string, SpotifyPayment>,
  monthCount: number,
  amountPerMonth: number
) {
  const applications = new Map<string, number>();
  let remaining = Math.round(monthCount * amountPerMonth * 100) / 100;
  let month = findFirstPaymentMonth(member, paymentsByMonth);

  while (remaining > 0.001) {
    const existing = getPaidAmount(paymentsByMonth, member.id, month);
    const expected = member.monthlyAmount;
    const pending = Math.max(expected - existing, 0);
    const applied = Math.min(remaining, pending > 0 ? pending : amountPerMonth);

    applications.set(month, Math.round((existing + applied) * 100) / 100);
    remaining = Math.round((remaining - applied) * 100) / 100;
    month = addMonths(month, 1);
  }

  return applications;
}

export default function SpotifyFamiliarPage() {
  const router = useRouter();
  const supabase = useMemo(() => getSupabaseBrowserClient(), []);
  const configError = useMemo(() => getSupabaseConfigError(), []);

  const [checking, setChecking] = useState(true);
  const [loadingData, setLoadingData] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [savingPaymentFor, setSavingPaymentFor] = useState<string | null>(null);
  const [savingMember, setSavingMember] = useState(false);
  const [deletingPaymentId, setDeletingPaymentId] = useState<string | null>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const [email, setEmail] = useState<string | null>(null);
  const [members, setMembers] = useState<SpotifyMember[]>([]);
  const [payments, setPayments] = useState<SpotifyPayment[]>([]);
  const [newMemberName, setNewMemberName] = useState("");
  const [newMemberAmount, setNewMemberAmount] = useState("2");
  const [newMemberStartMonth, setNewMemberStartMonth] = useState(currentMonthISO);
  const [paymentDraft, setPaymentDraft] = useState<PaymentDraft | null>(null);

  const sortedMembers = useMemo(() => {
    return [...members].sort((a, b) => {
      if (a.displayOrder !== b.displayOrder) return a.displayOrder - b.displayOrder;
      return a.name.localeCompare(b.name);
    });
  }, [members]);

  const sortedPayments = useMemo(() => {
    return [...payments].sort((a, b) => {
      if (a.paymentDate !== b.paymentDate) return b.paymentDate.localeCompare(a.paymentDate);
      if (a.billingMonth !== b.billingMonth) return b.billingMonth.localeCompare(a.billingMonth);
      return b.id.localeCompare(a.id);
    });
  }, [payments]);

  const paymentsByMonth = useMemo(() => {
    const grouped = new Map<string, SpotifyPayment>();

    for (const item of payments) {
      grouped.set(paymentKey(item.memberId, item.billingMonth), item);
    }

    return grouped;
  }, [payments]);

  const matrixMonths = useMemo(() => {
    const start = addMonths(currentMonthISO(), -5);
    return Array.from({ length: 12 }, (_, index) => addMonths(start, index));
  }, []);

  const dashboard = useMemo(() => {
    const activeMembers = members.filter((item) => item.active);
    const expected = activeMembers.reduce((sum, item) => sum + item.monthlyAmount, 0);
    const currentCollected = activeMembers.reduce(
      (sum, item) => sum + Math.min(getPaidAmount(paymentsByMonth, item.id, currentMonthISO()), item.monthlyAmount),
      0
    );
    const totalDebt = activeMembers.reduce(
      (sum, item) => sum + getMemberDebt(item, paymentsByMonth).total,
      0
    );
    const peopleWithDebt = activeMembers.filter(
      (item) => getMemberDebt(item, paymentsByMonth).total > 0
    ).length;

    return { expected, currentCollected, totalDebt, peopleWithDebt };
  }, [members, paymentsByMonth]);

  async function loadSpotifyData(currentUserId: string) {
    if (!supabase) return;

    setLoadingData(true);
    setLoadError(null);

    const [membersResult, paymentsResult] = await Promise.all([
      supabase
        .from("spotify_family_members")
        .select(memberSelect)
        .eq("owner_id", currentUserId)
        .order("display_order", { ascending: true })
        .order("created_at", { ascending: true }),
      supabase
        .from("spotify_family_payments")
        .select(paymentSelect)
        .eq("owner_id", currentUserId)
        .order("payment_date", { ascending: false })
        .order("created_at", { ascending: false }),
    ]);

    setLoadingData(false);

    if (membersResult.error || paymentsResult.error) {
      const error = membersResult.error ?? paymentsResult.error;
      setLoadError(
        `${error?.message ?? "No pude cargar Spotify Familiar"}. Ejecuta supabase/spotify_family.sql en Supabase.`
      );
      return;
    }

    setMembers(((membersResult.data as SpotifyMemberRow[] | null) ?? []).map(normalizeMember));
    setPayments(((paymentsResult.data as SpotifyPaymentRow[] | null) ?? []).map(normalizePayment));
  }

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

      if (isSalonOnlyEmail(session.user.email)) {
        router.replace("/pretty-escritorio");
        return;
      }

      setUserId(session.user.id);
      setEmail(session.user.email ?? null);
      await loadSpotifyData(session.user.id);
      setChecking(false);
    }

    loadSession();
  }, [router, supabase]);

  async function handleLogout() {
    if (!supabase) return;
    await supabase.auth.signOut();
    router.replace("/login");
  }

  async function seedMembers() {
    if (!supabase || !userId) return;

    setSavingMember(true);

    const { error } = await supabase.from("spotify_family_members").insert(
      Array.from({ length: 4 }, (_, index) => ({
        owner_id: userId,
        name: `Persona ${index + 1}`,
        monthly_amount: 2,
        start_month: currentMonthISO(),
        display_order: index,
      }))
    );

    setSavingMember(false);

    if (error) {
      alert(error.message);
      return;
    }

    await loadSpotifyData(userId);
  }

  async function addMember(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!supabase || !userId) return;

    const monthlyAmount = Math.round(Number(newMemberAmount) * 100) / 100;
    if (!newMemberName.trim()) {
      alert("Escribe el nombre de la persona.");
      return;
    }
    if (!Number.isFinite(monthlyAmount) || monthlyAmount <= 0) {
      alert("El monto mensual debe ser mayor que cero.");
      return;
    }

    setSavingMember(true);

    const { error } = await supabase.from("spotify_family_members").insert({
      owner_id: userId,
      name: newMemberName.trim(),
      monthly_amount: monthlyAmount,
      start_month: newMemberStartMonth,
      display_order: members.length,
    });

    setSavingMember(false);

    if (error) {
      alert(error.message);
      return;
    }

    setNewMemberName("");
    setNewMemberAmount("2");
    setNewMemberStartMonth(currentMonthISO());
    await loadSpotifyData(userId);
  }

  function openPaymentDraft(member: SpotifyMember, months = 1) {
    setPaymentDraft({
      memberId: member.id,
      months: String(months),
      amountPerMonth: String(member.monthlyAmount),
      paymentDate: todayISO(),
      paymentMethod: "Cuenta Banco",
      notes: "",
    });
  }

  async function savePayment(draft: PaymentDraft) {
    if (!supabase || !userId) return;

    const member = members.find((item) => item.id === draft.memberId);
    if (!member) return;

    const months = Number(draft.months);
    const amountPerMonth = Math.round(Number(draft.amountPerMonth) * 100) / 100;

    if (!Number.isInteger(months) || months <= 0) {
      alert("La cantidad de meses debe ser mayor que cero.");
      return;
    }
    if (!Number.isFinite(amountPerMonth) || amountPerMonth <= 0) {
      alert("El monto por mes debe ser mayor que cero.");
      return;
    }

    const applications = buildPaymentApplications(member, paymentsByMonth, months, amountPerMonth);

    setSavingPaymentFor(member.id);

    const { error } = await supabase.from("spotify_family_payments").upsert(
      [...applications.entries()].map(([billingMonth, amount]) => ({
        owner_id: userId,
        member_id: member.id,
        billing_month: billingMonth,
        amount,
        payment_date: draft.paymentDate || todayISO(),
        payment_method: draft.paymentMethod,
        notes: draft.notes.trim(),
      })),
      { onConflict: "member_id,billing_month" }
    );

    setSavingPaymentFor(null);

    if (error) {
      alert(error.message);
      return;
    }

    setPaymentDraft(null);
    await loadSpotifyData(userId);
  }

  async function quickPay(member: SpotifyMember, months = 1) {
    await savePayment({
      memberId: member.id,
      months: String(months),
      amountPerMonth: String(member.monthlyAmount),
      paymentDate: todayISO(),
      paymentMethod: "Cuenta Banco",
      notes: "",
    });
  }

  async function deletePayment(paymentId: string) {
    if (!supabase || !userId) return;

    setDeletingPaymentId(paymentId);

    const { error } = await supabase
      .from("spotify_family_payments")
      .delete()
      .eq("id", paymentId)
      .eq("owner_id", userId);

    setDeletingPaymentId(null);

    if (error) {
      alert(error.message);
      return;
    }

    await loadSpotifyData(userId);
  }

  if (checking) {
    return <div className="flex min-h-screen items-center justify-center text-slate-300">Cargando...</div>;
  }

  if (!supabase) {
    return (
      <div className="flex min-h-screen items-center justify-center p-4">
        <div className="w-full max-w-lg rounded-2xl border border-red-900 bg-slate-900/90 p-6 shadow-2xl shadow-black/30">
          <h1 className="text-xl font-semibold text-slate-100">Configuracion incompleta</h1>
          <p className="mt-2 text-sm text-slate-300">
            {configError ?? "Faltan las variables publicas de Supabase."}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0f1115] p-4 text-slate-100">
      <div className="mx-auto max-w-7xl">
        <header className="rounded-2xl border border-slate-800 bg-slate-950/90 p-5 shadow-2xl shadow-black/25">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
            <div>
              <div className="flex flex-wrap items-center gap-3 text-sm text-slate-400">
                <Link href="/modulos" className="rounded-full border border-slate-700 px-3 py-1 hover:bg-slate-800">
                  Volver a modulos
                </Link>
                <span>{email ? `Sesion: ${email}` : "Spotify Familiar"}</span>
              </div>
              <h1 className="mt-4 text-3xl font-semibold">Spotify Familiar</h1>
              <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-400">
                Control mensual de pagos compartidos, con matriz de meses y pago rapido al pendiente mas antiguo.
              </p>
            </div>

            <button
              onClick={handleLogout}
              className="rounded-xl border border-slate-700 bg-slate-900 px-4 py-2 text-sm font-medium text-slate-200 hover:bg-slate-800"
            >
              Salir
            </button>
          </div>
        </header>

        {loadingData ? (
          <div className="mt-5 rounded-xl border border-slate-800 bg-slate-950 px-4 py-3 text-sm text-slate-400">
            Sincronizando Spotify Familiar...
          </div>
        ) : null}

        {loadError ? (
          <div className="mt-5 rounded-xl border border-red-500/50 bg-red-950/40 p-4 text-sm text-red-100">
            {loadError}
          </div>
        ) : null}

        <section className="mt-6 grid gap-4 md:grid-cols-4">
          <div className="rounded-2xl border border-emerald-500/30 bg-emerald-500/10 p-5">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-emerald-300">Cobrado este mes</p>
            <p className="mt-4 text-3xl font-semibold text-emerald-100">
              {money.format(dashboard.currentCollected)}
            </p>
          </div>
          <div className="rounded-2xl border border-slate-800 bg-slate-950 p-5">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">Esperado mensual</p>
            <p className="mt-4 text-3xl font-semibold">{money.format(dashboard.expected)}</p>
          </div>
          <div className="rounded-2xl border border-red-500/30 bg-red-500/10 p-5">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-red-300">Pendiente total</p>
            <p className="mt-4 text-3xl font-semibold text-red-100">{money.format(dashboard.totalDebt)}</p>
          </div>
          <div className="rounded-2xl border border-amber-500/30 bg-amber-500/10 p-5">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-amber-300">Personas pendientes</p>
            <p className="mt-4 text-3xl font-semibold text-amber-100">{dashboard.peopleWithDebt}</p>
          </div>
        </section>

        <section className="mt-6 rounded-2xl border border-slate-800 bg-slate-950 p-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-sm font-semibold text-green-400">Matriz</p>
              <h2 className="mt-1 text-2xl font-semibold">Pagos por mes</h2>
            </div>
            {members.length === 0 ? (
              <button
                onClick={seedMembers}
                disabled={savingMember}
                className="rounded-xl bg-green-500 px-4 py-3 text-sm font-semibold text-slate-950 disabled:opacity-60"
              >
                {savingMember ? "Creando..." : "Crear 4 personas base"}
              </button>
            ) : null}
          </div>

          <div className="mt-5 overflow-x-auto rounded-xl border border-slate-800">
            <table className="min-w-[980px] w-full border-collapse text-left text-sm">
              <thead className="bg-slate-900 text-slate-400">
                <tr>
                  <th className="sticky left-0 z-10 bg-slate-900 px-4 py-3 font-medium">Persona</th>
                  {matrixMonths.map((month) => (
                    <th key={month} className="px-3 py-3 text-center font-medium">
                      {formatMonth(month)}
                    </th>
                  ))}
                  <th className="px-4 py-3 text-right font-medium">Accion</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800">
                {sortedMembers.length === 0 ? (
                  <tr>
                    <td colSpan={14} className="px-4 py-8 text-center text-slate-400">
                      Crea las 4 personas base o agrega una persona manualmente.
                    </td>
                  </tr>
                ) : (
                  sortedMembers.map((member) => {
                    const debt = getMemberDebt(member, paymentsByMonth);
                    const nextMonth = findFirstPaymentMonth(member, paymentsByMonth);

                    return (
                      <tr key={member.id} className="align-top">
                        <td className="sticky left-0 z-10 bg-slate-950 px-4 py-4">
                          <p className="font-semibold text-slate-100">{member.name}</p>
                          <p className="mt-1 text-xs text-slate-500">
                            {money.format(member.monthlyAmount)} desde {formatMonth(member.startMonth)}
                          </p>
                          {debt.pendingMonths.length > 0 ? (
                            <p className="mt-2 text-xs text-red-300">
                              Debe {debt.pendingMonths.map(formatMonth).join(", ")}
                            </p>
                          ) : (
                            <p className="mt-2 text-xs text-emerald-300">Al dia</p>
                          )}
                        </td>
                        {matrixMonths.map((month) => {
                          const status = getMonthStatus(member, month, paymentsByMonth);
                          const paid = getPaidAmount(paymentsByMonth, member.id, month);
                          const classes =
                            status === "paid"
                              ? "border-emerald-500/40 bg-emerald-500/20 text-emerald-100"
                              : status === "partial"
                                ? "border-amber-500/40 bg-amber-500/20 text-amber-100"
                                : status === "pending"
                                  ? "border-red-500/40 bg-red-500/20 text-red-100"
                                  : "border-slate-800 bg-slate-900 text-slate-500";

                          return (
                            <td key={month} className="px-2 py-3 text-center">
                              <div className={["mx-auto min-h-14 rounded-lg border px-2 py-2", classes].join(" ")}>
                                <p className="text-xs font-semibold">
                                  {status === "paid"
                                    ? "Pagado"
                                    : status === "partial"
                                      ? "Parcial"
                                      : status === "pending"
                                        ? "Pendiente"
                                        : month > currentMonthISO()
                                          ? "Futuro"
                                          : "N/A"}
                                </p>
                                {paid > 0 ? <p className="mt-1 text-xs">{money.format(paid)}</p> : null}
                              </div>
                            </td>
                          );
                        })}
                        <td className="px-4 py-4 text-right">
                          <div className="flex flex-col gap-2">
                            <button
                              onClick={() => quickPay(member)}
                              disabled={savingPaymentFor === member.id}
                              className="rounded-xl bg-green-500 px-3 py-2 text-xs font-semibold text-slate-950 disabled:opacity-60"
                            >
                              {savingPaymentFor === member.id
                                ? "Guardando..."
                                : `Confirmar ${money.format(member.monthlyAmount)}`}
                            </button>
                            <button
                              onClick={() => openPaymentDraft(member, 2)}
                              className="rounded-xl border border-slate-700 px-3 py-2 text-xs font-semibold text-slate-200 hover:bg-slate-800"
                            >
                              +2 meses
                            </button>
                            <button
                              onClick={() => openPaymentDraft(member)}
                              className="rounded-xl border border-slate-700 px-3 py-2 text-xs font-semibold text-slate-200 hover:bg-slate-800"
                            >
                              Modificar
                            </button>
                            <p className="text-xs text-slate-500">Sigue: {formatMonth(nextMonth)}</p>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </section>

        <section className="mt-6 grid gap-4 xl:grid-cols-[380px_minmax(0,1fr)]">
          <form onSubmit={addMember} className="rounded-2xl border border-slate-800 bg-slate-950 p-4">
            <h2 className="text-xl font-semibold">Agregar persona</h2>
            <div className="mt-5 grid gap-4">
              <label className="block">
                <span className="text-sm text-slate-400">Nombre</span>
                <input
                  value={newMemberName}
                  onChange={(event) => setNewMemberName(event.target.value)}
                  placeholder="Nombre"
                  className="mt-2 w-full rounded-xl border border-slate-700 bg-slate-900 px-3 py-3 text-slate-100 outline-none focus:border-green-400"
                />
              </label>
              <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-1">
                <label className="block">
                  <span className="text-sm text-slate-400">Monto mensual</span>
                  <input
                    type="number"
                    inputMode="decimal"
                    min="0"
                    step="0.01"
                    value={newMemberAmount}
                    onChange={(event) => setNewMemberAmount(event.target.value)}
                    className="mt-2 w-full rounded-xl border border-slate-700 bg-slate-900 px-3 py-3 text-slate-100 outline-none focus:border-green-400"
                  />
                </label>
                <label className="block">
                  <span className="text-sm text-slate-400">Empieza en</span>
                  <input
                    type="month"
                    value={newMemberStartMonth}
                    onChange={(event) => setNewMemberStartMonth(event.target.value)}
                    className="mt-2 w-full rounded-xl border border-slate-700 bg-slate-900 px-3 py-3 text-slate-100 outline-none focus:border-green-400"
                  />
                </label>
              </div>
            </div>
            <button
              type="submit"
              disabled={savingMember}
              className="mt-5 w-full rounded-xl bg-green-500 px-4 py-3 text-sm font-semibold text-slate-950 disabled:opacity-60"
            >
              {savingMember ? "Guardando..." : "Guardar persona"}
            </button>
          </form>

          <div className="rounded-2xl border border-slate-800 bg-slate-950 p-4">
            <h2 className="text-xl font-semibold">Historial de pagos</h2>
            <div className="mt-5 overflow-x-auto rounded-xl border border-slate-800">
              <table className="min-w-[760px] w-full text-left text-sm">
                <thead className="bg-slate-900 text-slate-400">
                  <tr>
                    <th className="px-4 py-3 font-medium">Fecha</th>
                    <th className="px-4 py-3 font-medium">Persona</th>
                    <th className="px-4 py-3 font-medium">Mes aplicado</th>
                    <th className="px-4 py-3 text-right font-medium">Monto</th>
                    <th className="px-4 py-3 font-medium">Metodo</th>
                    <th className="px-4 py-3 text-right font-medium">Accion</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800">
                  {sortedPayments.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="px-4 py-8 text-center text-slate-400">
                        Aun no hay pagos registrados.
                      </td>
                    </tr>
                  ) : (
                    sortedPayments.map((payment) => {
                      const member = members.find((item) => item.id === payment.memberId);

                      return (
                        <tr key={payment.id}>
                          <td className="px-4 py-4 text-slate-300">{formatDate(payment.paymentDate)}</td>
                          <td className="px-4 py-4 font-medium text-slate-100">
                            {member?.name ?? "Persona eliminada"}
                          </td>
                          <td className="px-4 py-4 text-slate-300">{formatMonth(payment.billingMonth)}</td>
                          <td className="px-4 py-4 text-right font-semibold text-emerald-300">
                            {money.format(payment.amount)}
                          </td>
                          <td className="px-4 py-4 text-slate-300">{payment.paymentMethod}</td>
                          <td className="px-4 py-4 text-right">
                            <button
                              onClick={() => deletePayment(payment.id)}
                              disabled={deletingPaymentId === payment.id}
                              className="rounded-lg border border-slate-700 px-3 py-1.5 text-xs font-semibold text-slate-200 hover:border-red-400 hover:text-red-200 disabled:opacity-60"
                            >
                              {deletingPaymentId === payment.id ? "Eliminando..." : "Eliminar"}
                            </button>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </section>
      </div>

      {paymentDraft ? (
        <div className="fixed inset-0 z-40 flex items-end bg-black/70 p-4 sm:items-center sm:justify-center">
          <form
            onSubmit={(event) => {
              event.preventDefault();
              void savePayment(paymentDraft);
            }}
            className="w-full max-w-md rounded-2xl border border-slate-800 bg-slate-950 p-5 shadow-2xl shadow-black/40"
          >
            <p className="text-sm font-semibold text-green-400">Registrar pago</p>
            <h2 className="mt-1 text-2xl font-semibold">
              {members.find((item) => item.id === paymentDraft.memberId)?.name ?? "Persona"}
            </h2>
            <div className="mt-5 grid gap-4">
              <label className="block">
                <span className="text-sm text-slate-400">Cantidad de meses</span>
                <input
                  type="number"
                  min="1"
                  step="1"
                  value={paymentDraft.months}
                  onChange={(event) => setPaymentDraft((current) => current ? { ...current, months: event.target.value } : current)}
                  className="mt-2 w-full rounded-xl border border-slate-700 bg-slate-900 px-3 py-3 text-slate-100 outline-none focus:border-green-400"
                />
              </label>
              <label className="block">
                <span className="text-sm text-slate-400">Monto por mes</span>
                <input
                  type="number"
                  inputMode="decimal"
                  min="0"
                  step="0.01"
                  value={paymentDraft.amountPerMonth}
                  onChange={(event) => setPaymentDraft((current) => current ? { ...current, amountPerMonth: event.target.value } : current)}
                  className="mt-2 w-full rounded-xl border border-slate-700 bg-slate-900 px-3 py-3 text-slate-100 outline-none focus:border-green-400"
                />
              </label>
              <div className="rounded-xl border border-slate-800 bg-slate-900 p-3">
                <p className="text-sm text-slate-400">Total a registrar</p>
                <p className="mt-1 text-2xl font-semibold text-emerald-300">
                  {money.format((Number(paymentDraft.months) || 0) * (Number(paymentDraft.amountPerMonth) || 0))}
                </p>
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <label className="block">
                  <span className="text-sm text-slate-400">Metodo</span>
                  <select
                    value={paymentDraft.paymentMethod}
                    onChange={(event) => setPaymentDraft((current) => current ? { ...current, paymentMethod: event.target.value } : current)}
                    className="mt-2 w-full rounded-xl border border-slate-700 bg-slate-900 px-3 py-3 text-slate-100 outline-none focus:border-green-400"
                  >
                    {paymentMethods.map((method) => (
                      <option key={method} value={method}>{method}</option>
                    ))}
                  </select>
                </label>
                <label className="block">
                  <span className="text-sm text-slate-400">Fecha</span>
                  <input
                    type="date"
                    value={paymentDraft.paymentDate}
                    onChange={(event) => setPaymentDraft((current) => current ? { ...current, paymentDate: event.target.value } : current)}
                    className="mt-2 w-full rounded-xl border border-slate-700 bg-slate-900 px-3 py-3 text-slate-100 outline-none focus:border-green-400"
                  />
                </label>
              </div>
              <label className="block">
                <span className="text-sm text-slate-400">Notas</span>
                <textarea
                  value={paymentDraft.notes}
                  onChange={(event) => setPaymentDraft((current) => current ? { ...current, notes: event.target.value } : current)}
                  rows={3}
                  className="mt-2 w-full resize-none rounded-xl border border-slate-700 bg-slate-900 px-3 py-3 text-slate-100 outline-none focus:border-green-400"
                />
              </label>
            </div>

            <div className="mt-5 grid gap-2 sm:grid-cols-2">
              <button
                type="submit"
                disabled={savingPaymentFor === paymentDraft.memberId}
                className="rounded-xl bg-green-500 px-4 py-3 text-sm font-semibold text-slate-950 disabled:opacity-60"
              >
                {savingPaymentFor === paymentDraft.memberId ? "Guardando..." : "Confirmar pago"}
              </button>
              <button
                type="button"
                onClick={() => setPaymentDraft(null)}
                disabled={savingPaymentFor === paymentDraft.memberId}
                className="rounded-xl border border-slate-700 px-4 py-3 text-sm font-semibold text-slate-200 hover:bg-slate-800 disabled:opacity-60"
              >
                Cancelar
              </button>
            </div>
          </form>
        </div>
      ) : null}
    </div>
  );
}
