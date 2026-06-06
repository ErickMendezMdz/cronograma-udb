import { money } from "@/features/pretty-salon/utils";

type MonthlyReport = {
  month: string;
  income: number;
  expenses: number;
  pending: number;
  profit: number;
  margin: number;
};

type PrettyMonthlyReportProps = {
  reports: MonthlyReport[];
  formatMonth: (month: string) => string;
};

export function PrettyMonthlyReport({ reports, formatMonth }: PrettyMonthlyReportProps) {
  return (
    <div className="min-w-0 rounded-lg border border-[#30333a] bg-[#181a1e] p-4">
      <div>
        <p className="text-sm font-semibold text-[#00c2a8]">Reportes</p>
        <h2 className="mt-1 text-2xl font-semibold text-[#f7f9fb]">Resumen mensual</h2>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-[#aeb5bf]">
          Lectura rapida de ingresos, gastos, pendientes y margen por mes.
        </p>
      </div>
      <div className="mt-5 overflow-x-auto rounded-lg border border-[#30333a]">
        <table className="min-w-[760px] w-full text-left text-sm">
          <thead className="bg-[#111316] text-[#aeb5bf]">
            <tr>
              <th className="px-4 py-3 font-medium">Mes</th>
              <th className="px-4 py-3 text-right font-medium">Ingresos</th>
              <th className="px-4 py-3 text-right font-medium">Gastos</th>
              <th className="px-4 py-3 text-right font-medium">Utilidad</th>
              <th className="px-4 py-3 text-right font-medium">Pendientes</th>
              <th className="px-4 py-3 text-right font-medium">Margen</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#30333a]">
            {reports.map((report) => (
              <tr key={report.month}>
                <td className="px-4 py-4 font-medium text-[#f7f9fb]">
                  {formatMonth(report.month)}
                </td>
                <td className="px-4 py-4 text-right text-[#71f2d8]">
                  {money.format(report.income)}
                </td>
                <td className="px-4 py-4 text-right text-[#ff8aa1]">
                  {money.format(report.expenses)}
                </td>
                <td className="px-4 py-4 text-right font-semibold text-[#f7f9fb]">
                  {money.format(report.profit)}
                </td>
                <td className="px-4 py-4 text-right text-[#ffe06b]">
                  {money.format(report.pending)}
                </td>
                <td className="px-4 py-4 text-right text-[#70d6ff]">
                  {report.margin.toFixed(1)}%
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
