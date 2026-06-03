import type { Dispatch, FormEvent, SetStateAction } from "react";
import type { TankExpenseDraft } from "@/features/dinero-tanque/types";

type ExpenseFormProps = {
  movementsCount: number;
  draft: TankExpenseDraft;
  setDraft: Dispatch<SetStateAction<TankExpenseDraft>>;
  addingExpense: boolean;
  modalOpen: boolean;
  openModal: () => void;
  closeModal: () => void;
  addExpense: (event: FormEvent) => Promise<boolean>;
};

export function ExpenseForm({
  movementsCount,
  draft,
  setDraft,
  addingExpense,
  modalOpen,
  openModal,
  closeModal,
  addExpense,
}: ExpenseFormProps) {
  return (
    <>
      <section className="rounded-3xl border border-slate-700 bg-slate-900/85 p-6 shadow-2xl shadow-black/10">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 className="text-xl font-semibold">Agregar compra o gasto</h2>
            <p className="mt-4 text-2xl font-semibold">{movementsCount}</p>
          </div>
          <button
            onClick={openModal}
            className="rounded-2xl bg-emerald-500 px-4 py-3 text-sm font-semibold text-slate-950"
          >
            Abrir
          </button>
        </div>
      </section>

      {modalOpen && (
        <div
          className="fixed inset-0 z-[9999] flex items-end justify-center bg-black/60 p-3 sm:items-center sm:p-4"
          onClick={closeModal}
        >
          <div
            className="w-[calc(100vw-24px)] max-h-[85vh] overflow-y-auto rounded-3xl border border-slate-700 bg-slate-900 p-5 shadow-2xl shadow-black/40 sm:w-full sm:max-w-lg"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between gap-3">
              <h2 className="text-xl font-semibold">Agregar compra o gasto</h2>
              <button
                onClick={closeModal}
                className="rounded-xl border border-slate-700 px-3 py-2 text-sm text-slate-300 hover:bg-slate-800"
              >
                Cerrar
              </button>
            </div>

            <form
              onSubmit={async (event) => {
                const saved = await addExpense(event);
                if (saved) closeModal();
              }}
              className="mt-5 space-y-4"
            >
              <div>
                <label className="text-sm font-medium text-slate-200">
                  Nombre
                </label>
                <input
                  className="mt-1 w-full rounded-2xl border border-slate-700 bg-slate-950/80 p-3 text-slate-100 outline-none focus:border-emerald-400 focus:ring-2 focus:ring-emerald-500/30"
                  value={draft.title}
                  onChange={(e) =>
                    setDraft((current) => ({
                      ...current,
                      title: e.target.value,
                    }))
                  }
                  placeholder="Ej: Cemento, arena, hierro"
                />
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="text-sm font-medium text-slate-200">
                    Categoria
                  </label>
                  <input
                    className="mt-1 w-full rounded-2xl border border-slate-700 bg-slate-950/80 p-3 text-slate-100 outline-none focus:border-emerald-400 focus:ring-2 focus:ring-emerald-500/30"
                    value={draft.category}
                    onChange={(e) =>
                      setDraft((current) => ({
                        ...current,
                        category: e.target.value,
                      }))
                    }
                    placeholder="Material, transporte, mano de obra"
                  />
                </div>

                <div>
                  <label className="text-sm font-medium text-slate-200">
                    Monto
                  </label>
                  <input
                    className="mt-1 w-full rounded-2xl border border-slate-700 bg-slate-950/80 p-3 text-slate-100 outline-none focus:border-emerald-400 focus:ring-2 focus:ring-emerald-500/30"
                    inputMode="decimal"
                    value={draft.amount}
                    onChange={(e) =>
                      setDraft((current) => ({
                        ...current,
                        amount: e.target.value,
                      }))
                    }
                    placeholder="Ej: 27.50"
                  />
                </div>
              </div>

              <div>
                <label className="text-sm font-medium text-slate-200">
                  Fecha
                </label>
                <input
                  type="date"
                  className="mt-1 w-full rounded-2xl border border-slate-700 bg-slate-950/80 p-3 text-slate-100 outline-none focus:border-emerald-400 focus:ring-2 focus:ring-emerald-500/30"
                  value={draft.date}
                  onChange={(e) =>
                    setDraft((current) => ({
                      ...current,
                      date: e.target.value,
                    }))
                  }
                />
              </div>

              <div>
                <label className="text-sm font-medium text-slate-200">
                  Notas
                </label>
                <textarea
                  className="mt-1 min-h-28 w-full rounded-2xl border border-slate-700 bg-slate-950/80 p-3 text-slate-100 outline-none focus:border-emerald-400 focus:ring-2 focus:ring-emerald-500/30"
                  value={draft.notes}
                  onChange={(e) =>
                    setDraft((current) => ({
                      ...current,
                      notes: e.target.value,
                    }))
                  }
                  placeholder="Opcional"
                />
              </div>

              <button
                type="submit"
                disabled={addingExpense}
                className="w-full rounded-2xl bg-emerald-500 py-3 font-semibold text-slate-950 disabled:opacity-60"
              >
                {addingExpense ? "Guardando..." : "Agregar compra / gasto"}
              </button>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
