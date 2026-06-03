import type { TankExpense } from "@/features/dinero-tanque/types";

const money = new Intl.NumberFormat("es-SV", {
  style: "currency",
  currency: "USD",
});

type ExpenseHistoryProps = {
  budget: number;
  expenses: TankExpense[];
  loadError: string | null;
  loadingData: boolean;
  deletingId: string | null;
  deleteExpense: (expenseId: string) => Promise<void>;
};

export function ExpenseHistory({
  budget,
  expenses,
  loadError,
  loadingData,
  deletingId,
  deleteExpense,
}: ExpenseHistoryProps) {
  return (
    <section className="rounded-3xl border border-slate-700 bg-slate-900/85 p-6 shadow-2xl shadow-black/10">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h2 className="text-xl font-semibold">Historial</h2>
        </div>
        <div className="text-sm text-slate-400">
          Fondo base:{" "}
          <span className="font-semibold text-slate-200">
            {money.format(budget)}
          </span>
        </div>
      </div>

      {loadError ? (
        <div className="mt-6 rounded-2xl border border-red-900 bg-red-950/30 p-6 text-sm text-red-200">
          {loadError}
          <p className="mt-2 text-red-100/80">
            Verifica que ya ejecutaste el script `supabase/dinero_tanque.sql` y
            que las tablas existen en tu proyecto.
          </p>
        </div>
      ) : loadingData ? (
        <div className="mt-6 rounded-2xl border border-dashed border-slate-700 bg-slate-950/50 p-6 text-sm text-slate-400">
          Cargando movimientos...
        </div>
      ) : expenses.length === 0 ? (
        <div className="mt-6 rounded-2xl border border-dashed border-slate-700 bg-slate-950/50 p-6 text-sm text-slate-400">
          Todavia no hay compras o gastos registrados.
        </div>
      ) : (
        <div className="mt-6 space-y-3">
          {expenses.map((item) => (
            <article
              key={item.id}
              className="rounded-2xl border border-slate-800 bg-slate-950/60 p-4"
            >
              <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="text-lg font-semibold">{item.title}</h3>
                    <span className="rounded-full bg-slate-800 px-3 py-1 text-xs font-medium text-slate-300">
                      {item.category}
                    </span>
                  </div>
                  <p className="mt-2 text-sm text-slate-400">{item.date}</p>
                  {item.notes ? (
                    <p className="mt-3 text-sm leading-6 text-slate-300">
                      {item.notes}
                    </p>
                  ) : null}
                </div>

                <div className="flex flex-col items-start gap-3 sm:items-end">
                  <p className="text-2xl font-semibold text-rose-200">
                    - {money.format(item.amount)}
                  </p>
                  <button
                    onClick={() => deleteExpense(item.id)}
                    disabled={deletingId === item.id}
                    className="rounded-xl border border-slate-700 px-3 py-2 text-sm font-medium text-slate-200 hover:bg-slate-800 disabled:opacity-60"
                  >
                    {deletingId === item.id ? "Eliminando..." : "Eliminar"}
                  </button>
                </div>
              </div>
            </article>
          ))}
        </div>
      )}
    </section>
  );
}
