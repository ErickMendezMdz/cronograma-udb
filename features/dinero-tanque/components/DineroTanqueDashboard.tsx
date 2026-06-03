"use client";

import { Button } from "@/components/ui/Button";
import { BudgetForm } from "@/features/dinero-tanque/components/BudgetForm";
import { BudgetSummary } from "@/features/dinero-tanque/components/BudgetSummary";
import { CategoryBreakdown } from "@/features/dinero-tanque/components/CategoryBreakdown";
import { ExpenseForm } from "@/features/dinero-tanque/components/ExpenseForm";
import { ExpenseHistory } from "@/features/dinero-tanque/components/ExpenseHistory";
import { useTankBudget } from "@/features/dinero-tanque/hooks/useTankBudget";

export function DineroTanqueDashboard() {
  const tankBudget = useTankBudget();

  if (tankBudget.checking) {
    return (
      <div className="min-h-screen flex items-center justify-center text-slate-300">
        Cargando...
      </div>
    );
  }

  if (!tankBudget.supabase) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="w-full max-w-lg rounded-2xl border border-red-900 bg-slate-900/90 p-6 shadow-2xl shadow-black/30">
          <h1 className="text-xl font-semibold text-slate-100">
            Configuracion incompleta
          </h1>
          <p className="mt-2 text-sm text-slate-300">
            {tankBudget.configError ??
              "Falta configurar las variables publicas de Supabase."}
          </p>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="flex flex-wrap items-center justify-between gap-3 text-sm text-slate-400">
        <span>
          {tankBudget.email ? `Sesion: ${tankBudget.email}` : "Dinero Tanque"}
        </span>
        <Button onClick={tankBudget.handleLogout} variant="secondary">
          Salir
        </Button>
      </div>

      <div className="mt-6">
        <BudgetSummary
          budget={tankBudget.state.budget}
          available={tankBudget.available}
          totalSpent={tankBudget.totalSpent}
          movementsCount={tankBudget.state.expenses.length}
        />
      </div>

      <div className="mt-6 grid gap-6 xl:grid-cols-[0.92fr_1.58fr]">
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-1">
          <CategoryBreakdown
            totalSpent={tankBudget.totalSpent}
            items={tankBudget.categoryBreakdown}
          />

          <BudgetForm
            budget={tankBudget.state.budget}
            budgetInput={tankBudget.budgetInput}
            savingBudget={tankBudget.savingBudget}
            setBudgetInput={tankBudget.setBudgetInput}
            modalOpen={tankBudget.budgetModalOpen}
            openModal={() => tankBudget.setBudgetModalOpen(true)}
            closeModal={() => tankBudget.setBudgetModalOpen(false)}
            saveBudget={tankBudget.saveBudget}
          />

          <ExpenseForm
            movementsCount={tankBudget.state.expenses.length}
            draft={tankBudget.expenseDraft}
            setDraft={tankBudget.setExpenseDraft}
            addingExpense={tankBudget.addingExpense}
            modalOpen={tankBudget.expenseModalOpen}
            openModal={() => tankBudget.setExpenseModalOpen(true)}
            closeModal={() => tankBudget.setExpenseModalOpen(false)}
            addExpense={tankBudget.addExpense}
          />
        </div>

        <ExpenseHistory
          budget={tankBudget.state.budget}
          expenses={tankBudget.sortedExpenses}
          loadError={tankBudget.loadError}
          loadingData={tankBudget.loadingData}
          deletingId={tankBudget.deletingId}
          deleteExpense={tankBudget.deleteExpense}
        />
      </div>

      <div className="fixed inset-x-4 bottom-4 z-40 grid grid-cols-2 gap-3 sm:hidden">
        <button
          onClick={() => tankBudget.setBudgetModalOpen(true)}
          className="rounded-2xl border border-slate-700 bg-slate-900/95 px-4 py-3 text-sm font-semibold text-slate-100 shadow-2xl shadow-black/30 backdrop-blur"
        >
          Fondo
        </button>
        <button
          onClick={() => tankBudget.setExpenseModalOpen(true)}
          className="rounded-2xl bg-emerald-500 px-4 py-3 text-sm font-semibold text-slate-950 shadow-2xl shadow-black/30"
        >
          Agregar gasto
        </button>
      </div>
    </>
  );
}
