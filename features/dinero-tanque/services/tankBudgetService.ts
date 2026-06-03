import type { SupabaseClient } from "@supabase/supabase-js";
import {
  clearLegacyTankState,
  loadLegacyTankState,
} from "@/lib/dineroTanque";
import type {
  TankBudgetRow,
  TankExpense,
  TankExpenseDraft,
  TankExpenseRow,
  TankMoneyState,
} from "@/features/dinero-tanque/types";

export function createEmptyTankState(): TankMoneyState {
  return {
    budget: 0,
    expenses: [],
  };
}

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

export async function getTankBudget(
  supabase: SupabaseClient,
  ownerId: string
) {
  return supabase
    .from("tank_budgets")
    .select("amount")
    .eq("owner_id", ownerId)
    .maybeSingle();
}

export async function getTankExpenses(
  supabase: SupabaseClient,
  ownerId: string
) {
  return supabase
    .from("tank_expenses")
    .select("id, title, category, amount, expense_date, notes")
    .eq("owner_id", ownerId)
    .order("expense_date", { ascending: false })
    .order("created_at", { ascending: false });
}

export async function getTankExpensesCount(
  supabase: SupabaseClient,
  ownerId: string
) {
  return supabase
    .from("tank_expenses")
    .select("id", { count: "exact", head: true })
    .eq("owner_id", ownerId);
}

export async function loadTankState(
  supabase: SupabaseClient,
  ownerId: string
) {
  const [{ data: budgetRow, error: budgetError }, { data: expenseRows, error: expensesError }] =
    await Promise.all([
      getTankBudget(supabase, ownerId),
      getTankExpenses(supabase, ownerId),
    ]);

  if (budgetError || expensesError) {
    return {
      state: null,
      error:
        budgetError?.message ??
        expensesError?.message ??
        "No se pudieron cargar los datos.",
    };
  }

  return {
    state: normalizeState(
      (budgetRow as TankBudgetRow | null) ?? null,
      (expenseRows as TankExpenseRow[] | null) ?? []
    ),
    error: null,
  };
}

export async function saveTankBudget(
  supabase: SupabaseClient,
  ownerId: string,
  amount: number
) {
  return supabase.from("tank_budgets").upsert(
    {
      owner_id: ownerId,
      amount,
    },
    { onConflict: "owner_id" }
  );
}

export async function createTankExpense(
  supabase: SupabaseClient,
  ownerId: string,
  draft: TankExpenseDraft
) {
  return supabase.from("tank_expenses").insert({
    owner_id: ownerId,
    title: draft.title.trim(),
    category: draft.category.trim() || "General",
    amount: Number(draft.amount),
    expense_date: draft.date,
    notes: draft.notes.trim(),
  });
}

export async function deleteTankExpense(
  supabase: SupabaseClient,
  ownerId: string,
  expenseId: string
) {
  return supabase
    .from("tank_expenses")
    .delete()
    .eq("id", expenseId)
    .eq("owner_id", ownerId);
}

export async function insertLegacyTankExpenses(
  supabase: SupabaseClient,
  ownerId: string,
  expenses: TankExpense[]
) {
  return supabase.from("tank_expenses").insert(
    expenses.map((item) => ({
      owner_id: ownerId,
      title: item.title,
      category: item.category,
      amount: item.amount,
      expense_date: item.date,
      notes: item.notes,
    }))
  );
}

export async function migrateLegacyTankState(
  supabase: SupabaseClient,
  ownerId: string
) {
  const legacy = loadLegacyTankState(ownerId);
  if (legacy.budget <= 0 && legacy.expenses.length === 0) {
    return;
  }

  const [{ data: existingBudget }, { count: existingExpensesCount }] =
    await Promise.all([
      getTankBudget(supabase, ownerId),
      getTankExpensesCount(supabase, ownerId),
    ]);

  const hasRemoteBudget = Number(existingBudget?.amount ?? 0) > 0;
  const hasRemoteExpenses = (existingExpensesCount ?? 0) > 0;

  if (hasRemoteBudget || hasRemoteExpenses) {
    return;
  }

  if (legacy.budget > 0) {
    await saveTankBudget(supabase, ownerId, legacy.budget);
  }

  if (legacy.expenses.length > 0) {
    await insertLegacyTankExpenses(supabase, ownerId, legacy.expenses);
  }

  clearLegacyTankState(ownerId);
}
