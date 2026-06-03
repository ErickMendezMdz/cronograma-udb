type BudgetFormProps = {
  budget: number;
  budgetInput: string;
  savingBudget: boolean;
  setBudgetInput: (value: string) => void;
  openModal: () => void;
  closeModal: () => void;
  modalOpen: boolean;
  saveBudget: () => Promise<boolean>;
};

const money = new Intl.NumberFormat("es-SV", {
  style: "currency",
  currency: "USD",
});

export function BudgetForm({
  budget,
  budgetInput,
  savingBudget,
  setBudgetInput,
  openModal,
  closeModal,
  modalOpen,
  saveBudget,
}: BudgetFormProps) {
  return (
    <>
      <section className="rounded-3xl border border-slate-700 bg-slate-900/85 p-6 shadow-2xl shadow-black/10">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 className="text-xl font-semibold">Fondo disponible</h2>
            <p className="mt-4 text-2xl font-semibold text-emerald-100">
              {money.format(budget)}
            </p>
          </div>
          <button
            onClick={openModal}
            className="rounded-2xl bg-emerald-500 px-4 py-3 text-sm font-semibold text-slate-950"
          >
            Editar
          </button>
        </div>
      </section>

      {modalOpen && (
        <div
          className="fixed inset-0 z-[9999] flex items-end justify-center bg-black/60 p-3 sm:items-center sm:p-4"
          onClick={closeModal}
        >
          <div
            className="w-[calc(100vw-24px)] max-h-[85vh] overflow-y-auto rounded-3xl border border-slate-700 bg-slate-900 p-5 shadow-2xl shadow-black/40 sm:w-full sm:max-w-md"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between gap-3">
              <h2 className="text-xl font-semibold">Fondo disponible</h2>
              <button
                onClick={closeModal}
                className="rounded-xl border border-slate-700 px-3 py-2 text-sm text-slate-300 hover:bg-slate-800"
              >
                Cerrar
              </button>
            </div>

            <div className="mt-5 space-y-4">
              <input
                className="w-full rounded-2xl border border-slate-700 bg-slate-950/80 p-3 text-slate-100 outline-none focus:border-emerald-400 focus:ring-2 focus:ring-emerald-500/30"
                inputMode="decimal"
                value={budgetInput}
                onChange={(e) => setBudgetInput(e.target.value)}
                placeholder="Ej: 350"
              />
              <button
                onClick={async () => {
                  const saved = await saveBudget();
                  if (saved) closeModal();
                }}
                disabled={savingBudget}
                className="w-full rounded-2xl bg-emerald-500 py-3 font-semibold text-slate-950 disabled:opacity-60"
              >
                {savingBudget ? "Guardando..." : "Guardar fondo"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
