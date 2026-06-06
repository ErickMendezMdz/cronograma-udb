import type { BreakdownItem } from "@/features/pretty-salon/types";
import { PrettyCategoryBreakdown } from "@/features/pretty-salon/components/reports/PrettyCategoryBreakdown";
import { PrettyMonthlyReport } from "@/features/pretty-salon/components/reports/PrettyMonthlyReport";

type MonthlyReport = {
  month: string;
  income: number;
  expenses: number;
  pending: number;
  profit: number;
  margin: number;
};

type PrettyReportsSectionProps = {
  reports: MonthlyReport[];
  selectedMonthLabel: string;
  expenseBreakdown: BreakdownItem[];
  loanBreakdown: BreakdownItem[];
  pendingExpenseBreakdown: BreakdownItem[];
  pendingIncomeBreakdown: BreakdownItem[];
  formatMonth: (month: string) => string;
};

export function PrettyReportsSection({
  reports,
  selectedMonthLabel,
  expenseBreakdown,
  loanBreakdown,
  pendingExpenseBreakdown,
  pendingIncomeBreakdown,
  formatMonth,
}: PrettyReportsSectionProps) {
  return (
    <section className="mt-6 grid min-w-0 gap-4">
      <PrettyMonthlyReport reports={reports} formatMonth={formatMonth} />

      <div className="min-w-0 rounded-lg border border-[#30333a] bg-[#181a1e] p-4">
        <div>
          <p className="text-sm font-semibold text-[#00c2a8]">{selectedMonthLabel}</p>
          <h2 className="mt-1 text-2xl font-semibold text-[#f7f9fb]">
            Detalle por categoria
          </h2>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-[#aeb5bf]">
            Montos del mes seleccionado para revisar gastos, prestamos y pendientes.
          </p>
        </div>
        <div className="mt-5 grid min-w-0 gap-4 md:grid-cols-2">
          <PrettyCategoryBreakdown
            title="Gastos pagados"
            items={expenseBreakdown}
            emptyMessage="No hay gastos pagados por categoria en este mes."
            variant="card"
          />
          <PrettyCategoryBreakdown
            title="Prestado pendiente"
            items={loanBreakdown}
            emptyMessage="No hay dinero prestado pendiente en este mes."
            variant="card"
          />
          <PrettyCategoryBreakdown
            title="Por pagar"
            items={pendingExpenseBreakdown}
            emptyMessage="No hay gastos por pagar en este mes."
            variant="card"
          />
          <PrettyCategoryBreakdown
            title="Por cobrar"
            items={pendingIncomeBreakdown}
            emptyMessage="No hay ingresos por cobrar en este mes."
            variant="card"
          />
        </div>
      </div>
    </section>
  );
}
