"use client";

import { Button } from "@/components/ui/Button";
import { LoanFilters } from "@/features/prestamos/components/LoanFilters";
import { LoanForm } from "@/features/prestamos/components/LoanForm";
import { LoanHistory } from "@/features/prestamos/components/LoanHistory";
import { LoansList } from "@/features/prestamos/components/LoansList";
import { LoanSummary } from "@/features/prestamos/components/LoanSummary";
import { useLoans } from "@/features/prestamos/hooks/useLoans";

export function LoansDashboard() {
  const loans = useLoans();

  if (loans.checking) {
    return (
      <div className="flex min-h-[320px] items-center justify-center text-slate-300">
        Cargando...
      </div>
    );
  }

  if (!loans.supabase) {
    return (
      <div className="flex min-h-[320px] items-center justify-center p-4">
        <div className="w-full max-w-lg rounded-2xl border border-red-900 bg-slate-900/90 p-6 shadow-2xl shadow-black/30">
          <h1 className="text-xl font-semibold text-slate-100">
            Configuración incompleta
          </h1>
          <p className="mt-2 text-sm text-slate-300">
            {loans.configError ??
              "Falta configurar las variables públicas de Supabase."}
          </p>
        </div>
      </div>
    );
  }

  const emptyMessage =
    loans.activeTab === "unknown"
      ? "No hay préstamos activos sin categorizar."
      : "No hay préstamos activos con estos filtros.";

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3 text-sm text-slate-400">
        <span>
          {loans.email ? `Sesión: ${loans.email}` : "Cosas Prestadas"}
        </span>
        <Button onClick={loans.handleLogout} variant="secondary">
          Salir
        </Button>
      </div>

      <div className="mt-6 flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-sm font-semibold text-blue-300">Libreta rápida</p>
          <h1 className="mt-1 text-3xl font-semibold text-slate-100">
            Qué presté y quién lo tiene
          </h1>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-400">
            Registra cosas prestadas en segundos y márcalas como devueltas cuando regresen.
          </p>
        </div>
        <Button onClick={loans.openCreateForm} className="shrink-0">
          + Registrar préstamo
        </Button>
      </div>

      <div className="mt-6">
        <LoanSummary counts={loans.summaryCounts} />
      </div>

      {loans.formOpen ? (
        <div className="mt-6">
          <LoanForm
            form={loans.form}
            updateForm={loans.updateForm}
            onSubmit={loans.saveLoan}
            onCancel={loans.closeForm}
            saving={loans.saving}
            editing={Boolean(loans.editingLoan)}
          />
        </div>
      ) : null}

      <div className="mt-6">
        <LoanFilters
          activeTab={loans.activeTab}
          setActiveTab={loans.setActiveTab}
          search={loans.search}
          setSearch={loans.setSearch}
          selectedCategory={loans.selectedCategory}
          setSelectedCategory={loans.setSelectedCategory}
          activeCount={loans.activeLoans.length}
          unknownCount={loans.unknownCategoryLoans.length}
          historyCount={loans.returnedLoans.length}
        />
      </div>

      {loans.error ? (
        <div className="mt-6 rounded-2xl border border-red-900 bg-red-950/40 p-4 text-sm text-red-100">
          {loans.error}
        </div>
      ) : null}

      {loans.loading ? (
        <div className="mt-6 rounded-2xl border border-slate-700 bg-slate-900/80 p-4 text-sm text-slate-400">
          Cargando préstamos...
        </div>
      ) : null}

      <div className="mt-6">
        {loans.activeTab === "history" ? (
          <LoanHistory
            loans={loans.displayedLoans}
            workingId={loans.workingId}
            onRestore={loans.restoreLoan}
            onDelete={loans.deleteLoan}
          />
        ) : (
          <LoansList
            loans={loans.displayedLoans}
            emptyMessage={emptyMessage}
            workingId={loans.workingId}
            onEdit={loans.editLoan}
            onReturned={loans.markReturned}
            onDelete={loans.deleteLoan}
          />
        )}
      </div>
    </div>
  );
}
