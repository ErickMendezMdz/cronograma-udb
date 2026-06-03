import type { TankCategoryBreakdownItem } from "@/features/dinero-tanque/types";

const money = new Intl.NumberFormat("es-SV", {
  style: "currency",
  currency: "USD",
});

type CategoryBreakdownProps = {
  totalSpent: number;
  items: TankCategoryBreakdownItem[];
};

export function CategoryBreakdown({
  totalSpent,
  items,
}: CategoryBreakdownProps) {
  return (
    <section className="rounded-3xl border border-slate-700 bg-slate-900/85 p-6 shadow-2xl shadow-black/10 sm:col-span-2 xl:col-span-1">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="text-xl font-semibold">Gastado por categoria</h2>
          <p className="mt-1 text-sm text-slate-400">{money.format(totalSpent)}</p>
        </div>
      </div>

      {items.length === 0 ? (
        <div className="mt-5 rounded-2xl border border-dashed border-slate-700 bg-slate-950/40 p-4 text-sm text-slate-400">
          Aun no hay gastos registrados por categoria.
        </div>
      ) : (
        <div className="mt-5 space-y-4">
          {items.map((item) => (
            <div key={item.categoryName}>
              <div className="mb-2 flex items-center justify-between gap-3 text-sm">
                <span className="font-medium text-slate-200">
                  {item.categoryName}
                </span>
                <span className="text-slate-300">
                  {money.format(item.categoryTotal)}
                </span>
              </div>
              <div className="h-3 rounded-full bg-slate-800">
                <div
                  className="h-full rounded-full bg-emerald-500"
                  style={{ width: `${Math.max(item.share, 6)}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
