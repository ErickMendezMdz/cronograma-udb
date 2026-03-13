"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  clearLegacyTankState,
  createEmptyTankState,
  loadLegacyTankState,
  type TankMoneyState,
} from "@/lib/dineroTanque";
import {
  getSupabaseBrowserClient,
  getSupabaseConfigError,
} from "@/lib/supabaseClient";

const money = new Intl.NumberFormat("es-SV", {
  style: "currency",
  currency: "USD",
});

function todayISO() {
  return new Date().toISOString().slice(0, 10);
}

type TankBudgetRow = {
  amount: number | string;
};

type TankExpenseRow = {
  id: string;
  title: string;
  category: string | null;
  amount: number | string;
  expense_date: string;
  notes: string | null;
};

export default function DineroTanquePage() {
  const router = useRouter();
  const supabase = useMemo(() => getSupabaseBrowserClient(), []);
  const configError = useMemo(() => getSupabaseConfigError(), []);

  const [checking, setChecking] = useState(true);
  const [userId, setUserId] = useState<string | null>(null);
  const [email, setEmail] = useState<string | null>(null);
  const [state, setState] = useState<TankMoneyState>(createEmptyTankState);
  const [budgetInput, setBudgetInput] = useState("0");
  const [loadingData, setLoadingData] = useState(false);
  const [savingBudget, setSavingBudget] = useState(false);
  const [addingExpense, setAddingExpense] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [budgetModalOpen, setBudgetModalOpen] = useState(false);
  const [expenseModalOpen, setExpenseModalOpen] = useState(false);

  const [title, setTitle] = useState("");
  const [category, setCategory] = useState("Material");
  const [amount, setAmount] = useState("");
  const [date, setDate] = useState(todayISO);
  const [notes, setNotes] = useState("");

  useEffect(() => {
    if (!budgetModalOpen && !expenseModalOpen) return;

    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      document.body.style.overflow = previous;
    };
  }, [budgetModalOpen, expenseModalOpen]);

  function normalizeState(
    budgetRow: TankBudgetRow | null,
    expenseRows: TankExpenseRow[] | null | undefined
  ): TankMoneyState {
    return {
      budget: Number(budgetRow?.amount ?? 0),
      expenses: (expenseRows ?? []).map((item) => ({
        id: item.id,
        title: item.title,
        category: item.category ?? "General",
        amount: Number(item.amount),
        date: item.expense_date,
        notes: item.notes ?? "",
      })),
    };
  }

  async function migrateLegacyState(currentUserId: string) {
    if (!supabase) return;

    const legacy = loadLegacyTankState(currentUserId);
    if (legacy.budget <= 0 && legacy.expenses.length === 0) {
      return;
    }

    const { data: existingBudget } = await supabase
      .from("tank_budgets")
      .select("amount")
      .eq("owner_id", currentUserId)
      .maybeSingle();

    const { count: existingExpensesCount } = await supabase
      .from("tank_expenses")
      .select("id", { count: "exact", head: true })
      .eq("owner_id", currentUserId);

    const hasRemoteBudget = Number(existingBudget?.amount ?? 0) > 0;
    const hasRemoteExpenses = (existingExpensesCount ?? 0) > 0;

    if (hasRemoteBudget || hasRemoteExpenses) {
      return;
    }

    if (legacy.budget > 0) {
      await supabase.from("tank_budgets").upsert(
        {
          owner_id: currentUserId,
          amount: legacy.budget,
        },
        { onConflict: "owner_id" }
      );
    }

    if (legacy.expenses.length > 0) {
      await supabase.from("tank_expenses").insert(
        legacy.expenses.map((item) => ({
          owner_id: currentUserId,
          title: item.title,
          category: item.category,
          amount: item.amount,
          expense_date: item.date,
          notes: item.notes,
        }))
      );
    }

    clearLegacyTankState(currentUserId);
  }

  async function loadTankData(currentUserId: string) {
    if (!supabase) return;

    setLoadingData(true);
    setLoadError(null);

    const [{ data: budgetRow, error: budgetError }, { data: expenseRows, error: expensesError }] =
      await Promise.all([
        supabase
          .from("tank_budgets")
          .select("amount")
          .eq("owner_id", currentUserId)
          .maybeSingle(),
        supabase
          .from("tank_expenses")
          .select("id, title, category, amount, expense_date, notes")
          .eq("owner_id", currentUserId)
          .order("expense_date", { ascending: false })
          .order("created_at", { ascending: false }),
      ]);

    if (budgetError || expensesError) {
      setLoadError(budgetError?.message ?? expensesError?.message ?? "No se pudieron cargar los datos.");
      setLoadingData(false);
      return;
    }

    const nextState = normalizeState(
      (budgetRow as TankBudgetRow | null) ?? null,
      (expenseRows as TankExpenseRow[] | null) ?? []
    );

    setState(nextState);
    setBudgetInput(String(nextState.budget));
    setLoadingData(false);
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

      const currentUserId = session.user.id;
      await migrateLegacyState(currentUserId);

      setUserId(currentUserId);
      setEmail(session.user.email ?? null);
      await loadTankData(currentUserId);
      setChecking(false);
    }

    loadSession();
  }, [router, supabase]);

  const sortedExpenses = useMemo(() => {
    return [...state.expenses].sort((a, b) => {
      if (a.date !== b.date) return b.date.localeCompare(a.date);
      return b.id.localeCompare(a.id);
    });
  }, [state.expenses]);

  const totalSpent = useMemo(() => {
    return state.expenses.reduce((sum, item) => sum + item.amount, 0);
  }, [state.expenses]);

  const available = state.budget - totalSpent;

  async function updateBudget() {
    if (!supabase || !userId) return false;

    const parsed = Number(budgetInput);
    if (Number.isNaN(parsed) || parsed < 0) {
      alert("El fondo disponible debe ser un numero valido.");
      return false;
    }

    setSavingBudget(true);

    const { error } = await supabase.from("tank_budgets").upsert(
      {
        owner_id: userId,
        amount: parsed,
      },
      { onConflict: "owner_id" }
    );

    setSavingBudget(false);

    if (error) {
      alert(error.message);
      return false;
    }

    await loadTankData(userId);
    return true;
  }

  async function addExpense(e: React.FormEvent) {
    e.preventDefault();
    if (!supabase || !userId) return false;

    const parsed = Number(amount);
    if (!title.trim()) {
      alert("Escribi el nombre de la compra o gasto.");
      return false;
    }

    if (Number.isNaN(parsed) || parsed <= 0) {
      alert("El monto debe ser mayor que cero.");
      return false;
    }

    setAddingExpense(true);

    const { error } = await supabase.from("tank_expenses").insert({
      owner_id: userId,
      title: title.trim(),
      category: category.trim() || "General",
      amount: parsed,
      expense_date: date,
      notes: notes.trim(),
    });

    setAddingExpense(false);

    if (error) {
      alert(error.message);
      return false;
    }

    await loadTankData(userId);

    setTitle("");
    setCategory("Material");
    setAmount("");
    setDate(todayISO());
    setNotes("");
    return true;
  }

  async function deleteExpense(expenseIdValue: string) {
    if (!supabase || !userId) return;

    setDeletingId(expenseIdValue);

    const { error } = await supabase
      .from("tank_expenses")
      .delete()
      .eq("id", expenseIdValue)
      .eq("owner_id", userId);

    setDeletingId(null);

    if (error) {
      alert(error.message);
      return;
    }

    await loadTankData(userId);
  }

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
      <div className="mx-auto max-w-7xl">
        <div className="rounded-2xl border border-slate-700/70 bg-slate-900/85 p-5 shadow-2xl shadow-black/20 backdrop-blur">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
            <div>
              <div className="flex flex-wrap items-center gap-3 text-sm text-slate-400">
                <Link href="/modulos" className="rounded-full border border-slate-700 px-3 py-1 hover:bg-slate-800">
                  Volver a modulos
                </Link>
                <span>{email ? `Sesion: ${email}` : "Dinero Tanque"}</span>
              </div>
              <h1 className="mt-4 text-3xl font-semibold">Dinero Tanque</h1>
            </div>

            <button
              onClick={handleLogout}
              className="rounded-xl border border-slate-700 bg-slate-950/70 px-4 py-2 text-sm font-medium text-slate-200 hover:bg-slate-800"
            >
              Salir
            </button>
          </div>
        </div>

        <div className="mt-6 grid gap-4 md:grid-cols-3">
          <div className="rounded-3xl border border-emerald-500/30 bg-emerald-500/10 p-5">
            <p className="text-sm uppercase tracking-[0.2em] text-emerald-300">Disponible</p>
            <p className="mt-4 text-3xl font-semibold text-emerald-100">{money.format(available)}</p>
          </div>

          <div className="rounded-3xl border border-slate-700 bg-slate-900/85 p-5">
            <p className="text-sm uppercase tracking-[0.2em] text-slate-400">Gastado</p>
            <p className="mt-4 text-3xl font-semibold">{money.format(totalSpent)}</p>
          </div>

          <div className="rounded-3xl border border-slate-700 bg-slate-900/85 p-5">
            <p className="text-sm uppercase tracking-[0.2em] text-slate-400">Movimientos</p>
            <p className="mt-4 text-3xl font-semibold">{state.expenses.length}</p>
          </div>
        </div>

        <div className="mt-6 grid gap-6 xl:grid-cols-[0.92fr_1.58fr]">
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-1">
            <section className="rounded-3xl border border-slate-700 bg-slate-900/85 p-6 shadow-2xl shadow-black/10">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h2 className="text-xl font-semibold">Fondo disponible</h2>
                  <p className="mt-4 text-2xl font-semibold text-emerald-100">{money.format(state.budget)}</p>
                </div>
                <button
                  onClick={() => setBudgetModalOpen(true)}
                  className="rounded-2xl bg-emerald-500 px-4 py-3 text-sm font-semibold text-slate-950"
                >
                  Editar
                </button>
              </div>
            </section>

            <section className="rounded-3xl border border-slate-700 bg-slate-900/85 p-6 shadow-2xl shadow-black/10">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h2 className="text-xl font-semibold">Agregar compra o gasto</h2>
                  <p className="mt-4 text-2xl font-semibold">{state.expenses.length}</p>
                </div>
                <button
                  onClick={() => setExpenseModalOpen(true)}
                  className="rounded-2xl bg-emerald-500 px-4 py-3 text-sm font-semibold text-slate-950"
                >
                  Abrir
                </button>
              </div>
            </section>
          </div>

          <section className="rounded-3xl border border-slate-700 bg-slate-900/85 p-6 shadow-2xl shadow-black/10">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <h2 className="text-xl font-semibold">Historial</h2>
              </div>
              <div className="text-sm text-slate-400">
                Fondo base: <span className="font-semibold text-slate-200">{money.format(state.budget)}</span>
              </div>
            </div>

            {loadError ? (
              <div className="mt-6 rounded-2xl border border-red-900 bg-red-950/30 p-6 text-sm text-red-200">
                {loadError}
                <p className="mt-2 text-red-100/80">
                  Verifica que ya ejecutaste el script `supabase/dinero_tanque.sql` y que las tablas existen en tu proyecto.
                </p>
              </div>
            ) : loadingData ? (
              <div className="mt-6 rounded-2xl border border-dashed border-slate-700 bg-slate-950/50 p-6 text-sm text-slate-400">
                Cargando movimientos...
              </div>
            ) : sortedExpenses.length === 0 ? (
              <div className="mt-6 rounded-2xl border border-dashed border-slate-700 bg-slate-950/50 p-6 text-sm text-slate-400">
                Todavia no hay compras o gastos registrados.
              </div>
            ) : (
              <div className="mt-6 space-y-3">
                {sortedExpenses.map((item) => (
                  <article
                    key={item.id}
                    className="rounded-2xl border border-slate-800 bg-slate-950/60 p-4"
                  >
                    <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                      <div>
                        <div className="flex flex-wrap items-center gap-2">
                          <h3 className="text-lg font-semibold">{item.title}</h3>
                          <span className="rounded-full bg-slate-800 px-3 py-1 text-xs font-medium text-slate-300">
                            {item.category}
                          </span>
                        </div>
                        <p className="mt-2 text-sm text-slate-400">{item.date}</p>
                        {item.notes ? (
                          <p className="mt-3 text-sm leading-6 text-slate-300">{item.notes}</p>
                        ) : null}
                      </div>

                      <div className="flex flex-col items-start gap-3 sm:items-end">
                        <p className="text-2xl font-semibold text-rose-200">- {money.format(item.amount)}</p>
                        <button
                          onClick={() => deleteExpense(item.id)}
                          disabled={deletingId === item.id}
                          className="rounded-xl border border-slate-700 px-3 py-2 text-sm font-medium text-slate-200 hover:bg-slate-800 disabled:opacity-60"
                        >
                          {deletingId === item.id ? "Eliminando..." : "Eliminar"}
                        </button>
                      </div>
                    </div>
                  </article>
                ))}
              </div>
            )}
          </section>
        </div>
      </div>

      <div className="fixed inset-x-4 bottom-4 z-40 grid grid-cols-2 gap-3 sm:hidden">
        <button
          onClick={() => setBudgetModalOpen(true)}
          className="rounded-2xl border border-slate-700 bg-slate-900/95 px-4 py-3 text-sm font-semibold text-slate-100 shadow-2xl shadow-black/30 backdrop-blur"
        >
          Fondo
        </button>
        <button
          onClick={() => setExpenseModalOpen(true)}
          className="rounded-2xl bg-emerald-500 px-4 py-3 text-sm font-semibold text-slate-950 shadow-2xl shadow-black/30"
        >
          Agregar gasto
        </button>
      </div>

      {budgetModalOpen && (
        <div
          className="fixed inset-0 z-[9999] flex items-end justify-center bg-black/60 p-3 sm:items-center sm:p-4"
          onClick={() => setBudgetModalOpen(false)}
        >
          <div
            className="w-[calc(100vw-24px)] max-h-[85vh] overflow-y-auto rounded-3xl border border-slate-700 bg-slate-900 p-5 shadow-2xl shadow-black/40 sm:w-full sm:max-w-md"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between gap-3">
              <h2 className="text-xl font-semibold">Fondo disponible</h2>
              <button
                onClick={() => setBudgetModalOpen(false)}
                className="rounded-xl border border-slate-700 px-3 py-2 text-sm text-slate-300 hover:bg-slate-800"
              >
                Cerrar
              </button>
            </div>

            <div className="mt-5 space-y-4">
              <input
                className="w-full rounded-2xl border border-slate-700 bg-slate-950/80 p-3 text-slate-100 outline-none focus:border-emerald-400 focus:ring-2 focus:ring-emerald-500/30"
                inputMode="decimal"
                value={budgetInput}
                onChange={(e) => setBudgetInput(e.target.value)}
                placeholder="Ej: 350"
              />
              <button
                onClick={async () => {
                  const saved = await updateBudget();
                  if (saved) setBudgetModalOpen(false);
                }}
                disabled={savingBudget}
                className="w-full rounded-2xl bg-emerald-500 py-3 font-semibold text-slate-950 disabled:opacity-60"
              >
                {savingBudget ? "Guardando..." : "Guardar fondo"}
              </button>
            </div>
          </div>
        </div>
      )}

      {expenseModalOpen && (
        <div
          className="fixed inset-0 z-[9999] flex items-end justify-center bg-black/60 p-3 sm:items-center sm:p-4"
          onClick={() => setExpenseModalOpen(false)}
        >
          <div
            className="w-[calc(100vw-24px)] max-h-[85vh] overflow-y-auto rounded-3xl border border-slate-700 bg-slate-900 p-5 shadow-2xl shadow-black/40 sm:w-full sm:max-w-lg"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between gap-3">
              <h2 className="text-xl font-semibold">Agregar compra o gasto</h2>
              <button
                onClick={() => setExpenseModalOpen(false)}
                className="rounded-xl border border-slate-700 px-3 py-2 text-sm text-slate-300 hover:bg-slate-800"
              >
                Cerrar
              </button>
            </div>

            <form
              onSubmit={async (e) => {
                const saved = await addExpense(e);
                if (saved) setExpenseModalOpen(false);
              }}
              className="mt-5 space-y-4"
            >
              <div>
                <label className="text-sm font-medium text-slate-200">Nombre</label>
                <input
                  className="mt-1 w-full rounded-2xl border border-slate-700 bg-slate-950/80 p-3 text-slate-100 outline-none focus:border-emerald-400 focus:ring-2 focus:ring-emerald-500/30"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Ej: Cemento, arena, hierro"
                />
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="text-sm font-medium text-slate-200">Categoria</label>
                  <input
                    className="mt-1 w-full rounded-2xl border border-slate-700 bg-slate-950/80 p-3 text-slate-100 outline-none focus:border-emerald-400 focus:ring-2 focus:ring-emerald-500/30"
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    placeholder="Material, transporte, mano de obra"
                  />
                </div>

                <div>
                  <label className="text-sm font-medium text-slate-200">Monto</label>
                  <input
                    className="mt-1 w-full rounded-2xl border border-slate-700 bg-slate-950/80 p-3 text-slate-100 outline-none focus:border-emerald-400 focus:ring-2 focus:ring-emerald-500/30"
                    inputMode="decimal"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    placeholder="Ej: 27.50"
                  />
                </div>
              </div>

              <div>
                <label className="text-sm font-medium text-slate-200">Fecha</label>
                <input
                  type="date"
                  className="mt-1 w-full rounded-2xl border border-slate-700 bg-slate-950/80 p-3 text-slate-100 outline-none focus:border-emerald-400 focus:ring-2 focus:ring-emerald-500/30"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                />
              </div>

              <div>
                <label className="text-sm font-medium text-slate-200">Notas</label>
                <textarea
                  className="mt-1 min-h-28 w-full rounded-2xl border border-slate-700 bg-slate-950/80 p-3 text-slate-100 outline-none focus:border-emerald-400 focus:ring-2 focus:ring-emerald-500/30"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Opcional"
                />
              </div>

              <button
                type="submit"
                disabled={addingExpense}
                className="w-full rounded-2xl bg-emerald-500 py-3 font-semibold text-slate-950 disabled:opacity-60"
              >
                {addingExpense ? "Guardando..." : "Agregar compra / gasto"}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
