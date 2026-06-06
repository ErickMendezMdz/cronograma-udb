import { money } from "@/features/pretty-salon/utils";

type DailyTrendItem = {
  date: string;
  label: string;
  income: number;
  expense: number;
};

type PrettyDailyTrendProps = {
  dailyTrend: DailyTrendItem[];
  trendMax: number;
};

export function PrettyDailyTrend({ dailyTrend, trendMax }: PrettyDailyTrendProps) {
  return (
    <section className="mt-6 grid min-w-0 gap-4">
      <div className="min-w-0 rounded-lg border border-[#30333a] bg-[#181a1e] p-4">
        <div>
          <p className="text-sm font-semibold text-[#00c2a8]">Vista principal</p>
          <h2 className="mt-1 text-2xl font-semibold text-[#f7f9fb]">
            Ingresos contra gastos
          </h2>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-[#aeb5bf]">
            Comparativo de los ultimos dias con movimientos pagados.
          </p>
        </div>

        <div className="mt-6 flex h-44 min-w-0 items-end gap-1 border-b border-[#30333a] px-1 pb-3 sm:h-64 sm:gap-2">
          {dailyTrend.map((item) => {
            const incomeHeight = item.income > 0 ? Math.max((item.income / trendMax) * 100, 6) : 0;
            const expenseHeight =
              item.expense > 0 ? Math.max((item.expense / trendMax) * 100, 6) : 0;

            return (
              <div key={item.date} className="flex min-w-0 flex-1 flex-col items-center gap-2">
                <div className="flex h-32 w-full items-end justify-center gap-1 sm:h-48">
                  <div
                    title={`Ingresos ${money.format(item.income)}`}
                    className="w-3 rounded-sm bg-[#00c2a8]"
                    style={{ height: `${incomeHeight}%` }}
                  />
                  <div
                    title={`Gastos ${money.format(item.expense)}`}
                    className="w-3 rounded-sm bg-[#ff5f7e]"
                    style={{ height: `${expenseHeight}%` }}
                  />
                </div>
                <span className="truncate text-xs text-[#aeb5bf]">{item.label}</span>
              </div>
            );
          })}
        </div>

        <div className="mt-4 flex flex-wrap gap-4 text-sm text-[#c7ced6]">
          <span className="inline-flex items-center gap-2">
            <span className="h-3 w-3 rounded-sm bg-[#00c2a8]" />
            Ingresos
          </span>
          <span className="inline-flex items-center gap-2">
            <span className="h-3 w-3 rounded-sm bg-[#ff5f7e]" />
            Gastos
          </span>
        </div>
      </div>
    </section>
  );
}
