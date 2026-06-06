type PrettyDashboardHeaderProps = {
  selectedMonth: string;
  monthOptions: string[];
  formatMonth: (month: string) => string;
  onMonthChange: (month: string) => void;
};

export function PrettyDashboardHeader({
  selectedMonth,
  monthOptions,
  formatMonth,
  onMonthChange,
}: PrettyDashboardHeaderProps) {
  return (
    <header className="flex min-w-0 flex-col gap-4 border-b border-[#30333a] pb-5 xl:flex-row xl:items-end xl:justify-between">
      <div className="min-w-0">
        <p className="text-sm font-semibold text-[#00c2a8]">Pretty Salon de belleza</p>
        <h1 className="mt-2 max-w-full text-3xl font-semibold leading-tight text-[#f7f9fb] sm:text-5xl">
          Dashboard financiero
        </h1>
      </div>

      <div className="grid min-w-0 gap-3 sm:flex sm:items-center">
        <label className="block min-w-0">
          <span className="text-sm text-[#aeb5bf]">Mes de trabajo</span>
          <select
            value={selectedMonth}
            onChange={(event) => onMonthChange(event.target.value)}
            className="mt-2 w-full max-w-full rounded-lg border border-[#3a3f48] bg-[#181a1e] px-3 py-3 text-base text-[#f7f9fb] outline-none transition focus:border-[#00c2a8] sm:w-56 sm:py-2 sm:text-sm"
          >
            {monthOptions.map((month) => (
              <option key={month} value={month}>
                {formatMonth(month)}
              </option>
            ))}
          </select>
        </label>
      </div>
    </header>
  );
}
