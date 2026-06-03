"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  getSupabaseBrowserClient,
  getSupabaseConfigError,
} from "@/lib/supabaseClient";
import { isSalonOnlyEmail } from "@/lib/moduleAccess";
import {
  createEmptyTankState,
  createTankExpense,
  deleteTankExpense,
  loadTankState,
  migrateLegacyTankState,
  saveTankBudget,
} from "@/features/dinero-tanque/services/tankBudgetService";
import type {
  TankCategoryBreakdownItem,
  TankExpenseDraft,
  TankMoneyState,
} from "@/features/dinero-tanque/types";

export function todayISO() {
  return new Date().toISOString().slice(0, 10);
}

export function useTankBudget() {
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
  const [expenseDraft, setExpenseDraft] = useState<TankExpenseDraft>({
    title: "",
    category: "Material",
    amount: "",
    date: todayISO(),
    notes: "",
  });

  useEffect(() => {
    if (!budgetModalOpen && !expenseModalOpen) return;

    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      document.body.style.overflow = previous;
    };
  }, [budgetModalOpen, expenseModalOpen]);

  const loadData = useCallback(
    async (currentUserId: string) => {
      if (!supabase) return;

      setLoadingData(true);
      setLoadError(null);

      const { state: nextState, error } = await loadTankState(
        supabase,
        currentUserId
      );

      if (error || !nextState) {
        setLoadError(error);
        setLoadingData(false);
        return;
      }

      setState(nextState);
      setBudgetInput(String(nextState.budget));
      setLoadingData(false);
    },
    [supabase]
  );

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

      const currentUserId = session.user.id;
      await migrateLegacyTankState(supabase, currentUserId);

      setUserId(currentUserId);
      setEmail(session.user.email ?? null);
      await loadData(currentUserId);
      setChecking(false);
    }

    loadSession();
  }, [loadData, router, supabase]);

  const sortedExpenses = useMemo(() => {
    return [...state.expenses].sort((a, b) => {
      if (a.date !== b.date) return b.date.localeCompare(a.date);
      return b.id.localeCompare(a.id);
    });
  }, [state.expenses]);

  const totalSpent = useMemo(() => {
    return state.expenses.reduce((sum, item) => sum + item.amount, 0);
  }, [state.expenses]);

  const categoryBreakdown = useMemo<TankCategoryBreakdownItem[]>(() => {
    const grouped = new Map<string, number>();

    for (const item of state.expenses) {
      const key = item.category.trim() || "General";
      grouped.set(key, (grouped.get(key) ?? 0) + item.amount);
    }

    return [...grouped.entries()]
      .map(([categoryName, categoryTotal]) => ({
        categoryName,
        categoryTotal,
        share: totalSpent > 0 ? (categoryTotal / totalSpent) * 100 : 0,
      }))
      .sort((a, b) => b.categoryTotal - a.categoryTotal);
  }, [state.expenses, totalSpent]);

  const available = state.budget - totalSpent;

  const saveBudget = useCallback(async () => {
    if (!supabase || !userId) return false;

    const parsed = Number(budgetInput);
    if (Number.isNaN(parsed) || parsed < 0) {
      alert("El fondo disponible debe ser un numero valido.");
      return false;
    }

    setSavingBudget(true);

    const { error } = await saveTankBudget(supabase, userId, parsed);

    setSavingBudget(false);

    if (error) {
      alert(error.message);
      return false;
    }

    await loadData(userId);
    return true;
  }, [budgetInput, loadData, supabase, userId]);

  const addExpense = useCallback(
    async (event: React.FormEvent) => {
      event.preventDefault();
      if (!supabase || !userId) return false;

      const parsed = Number(expenseDraft.amount);
      if (!expenseDraft.title.trim()) {
        alert("Escribi el nombre de la compra o gasto.");
        return false;
      }

      if (Number.isNaN(parsed) || parsed <= 0) {
        alert("El monto debe ser mayor que cero.");
        return false;
      }

      setAddingExpense(true);

      const { error } = await createTankExpense(
        supabase,
        userId,
        expenseDraft
      );

      setAddingExpense(false);

      if (error) {
        alert(error.message);
        return false;
      }

      await loadData(userId);

      setExpenseDraft({
        title: "",
        category: "Material",
        amount: "",
        date: todayISO(),
        notes: "",
      });
      return true;
    },
    [expenseDraft, loadData, supabase, userId]
  );

  const deleteExpense = useCallback(
    async (expenseIdValue: string) => {
      if (!supabase || !userId) return;

      setDeletingId(expenseIdValue);

      const { error } = await deleteTankExpense(
        supabase,
        userId,
        expenseIdValue
      );

      setDeletingId(null);

      if (error) {
        alert(error.message);
        return;
      }

      await loadData(userId);
    },
    [loadData, supabase, userId]
  );

  const handleLogout = useCallback(async () => {
    if (!supabase) return;
    await supabase.auth.signOut();
    router.replace("/login");
  }, [router, supabase]);

  return {
    checking,
    supabase,
    configError,
    email,
    state,
    budgetInput,
    setBudgetInput,
    loadingData,
    savingBudget,
    addingExpense,
    deletingId,
    loadError,
    budgetModalOpen,
    setBudgetModalOpen,
    expenseModalOpen,
    setExpenseModalOpen,
    expenseDraft,
    setExpenseDraft,
    sortedExpenses,
    totalSpent,
    categoryBreakdown,
    available,
    loadData,
    saveBudget,
    addExpense,
    deleteExpense,
    handleLogout,
  };
}
