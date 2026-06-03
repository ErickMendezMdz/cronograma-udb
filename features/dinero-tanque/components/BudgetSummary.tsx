const money = new Intl.NumberFormat("es-SV", {
  style: "currency",
  currency: "USD",
});

type BudgetSummaryProps = {
  budget: number;
  available: number;
  totalSpent: number;
  movementsCount: number;
};

export function BudgetSummary({
  budget,
  available,
  totalSpent,
  movementsCount,
}: BudgetSummaryProps) {
  return (
    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
      <div className="rounded-3xl border border-emerald-500/30 bg-emerald-500/10 p-5">
        <p className="text-sm uppercase tracking-[0.2em] text-emerald-300">
          Disponible
        </p>
        <p className="mt-4 text-3xl font-semibold text-emerald-100">
          {money.format(available)}
        </p>
      </div>

      <div className="rounded-3xl border border-slate-700 bg-slate-900/85 p-5">
        <p className="text-sm uppercase tracking-[0.2em] text-slate-400">
          Fondo
        </p>
        <p className="mt-4 text-3xl font-semibold">{money.format(budget)}</p>
      </div>

      <div className="rounded-3xl border border-slate-700 bg-slate-900/85 p-5">
        <p className="text-sm uppercase tracking-[0.2em] text-slate-400">
          Gastado
        </p>
        <p className="mt-4 text-3xl font-semibold">{money.format(totalSpent)}</p>
      </div>

      <div className="rounded-3xl border border-slate-700 bg-slate-900/85 p-5">
        <p className="text-sm uppercase tracking-[0.2em] text-slate-400">
          Movimientos
        </p>
        <p className="mt-4 text-3xl font-semibold">{movementsCount}</p>
      </div>
    </div>
  );
}
