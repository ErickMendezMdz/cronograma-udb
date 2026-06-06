import { type RefObject } from "react";

type PrettyQuickActionsProps = {
  quickAccessRef: RefObject<HTMLElement | null>;
  totalPendingExpenses: number;
  onIncome: () => void;
  onExpense: () => void;
  onTransfer: () => void;
  onLoan: () => void;
  onExpensePayment: () => void;
};

export function PrettyQuickActions({
  quickAccessRef,
  totalPendingExpenses,
  onIncome,
  onExpense,
  onTransfer,
  onLoan,
  onExpensePayment,
}: PrettyQuickActionsProps) {
  return (
    <section
      ref={quickAccessRef}
      className="mt-6 min-w-0 scroll-mt-4 rounded-lg border border-[#30333a] bg-[#181a1e] p-4"
    >
      <div>
        <p className="text-sm font-semibold text-[#00c2a8]">Accesos rapidos</p>
        <h2 className="mt-1 text-2xl font-semibold text-[#f7f9fb]">Registrar movimiento</h2>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-[#aeb5bf]">
          Entradas directas para las acciones mas usadas en caja.
        </p>
      </div>
      <div className="mt-5 grid min-w-0 gap-3 sm:grid-cols-2 xl:grid-cols-5">
        <button
          onClick={onIncome}
          className="min-w-0 rounded-lg border border-[#00c2a8] bg-[#0f312e] px-4 py-4 text-left transition hover:bg-[#123b37]"
        >
          <span className="block text-base font-semibold text-[#71f2d8]">Ingreso</span>
          <span className="mt-1 block text-xs text-[#aeb5bf]">Registrar ingreso</span>
        </button>
        <button
          onClick={onExpense}
          className="min-w-0 rounded-lg border border-[#ff5f7e] bg-[#321820] px-4 py-4 text-left transition hover:bg-[#3f1d27]"
        >
          <span className="block text-base font-semibold text-[#ff8aa1]">Gastos</span>
          <span className="mt-1 block text-xs text-[#aeb5bf]">Registrar gasto</span>
        </button>
        <button
          onClick={onTransfer}
          className="min-w-0 rounded-lg border border-[#70d6ff] bg-[#132936] px-4 py-4 text-left transition hover:bg-[#173344]"
        >
          <span className="block text-base font-semibold text-[#70d6ff]">Traslado</span>
          <span className="mt-1 block text-xs text-[#aeb5bf]">Mover efectivo o banco</span>
        </button>
        <button
          onClick={onLoan}
          className="min-w-0 rounded-lg border border-[#f7d84a] bg-[#302a12] px-4 py-4 text-left transition hover:bg-[#3b3315]"
        >
          <span className="block text-base font-semibold text-[#ffe06b]">Prestado</span>
          <span className="mt-1 block text-xs text-[#aeb5bf]">Registrar dinero tomado</span>
        </button>
        <button
          onClick={onExpensePayment}
          disabled={totalPendingExpenses <= 0}
          className="min-w-0 rounded-lg border border-[#b8f060] bg-[#20311f] px-4 py-4 text-left transition hover:bg-[#273b25] disabled:cursor-not-allowed disabled:opacity-50"
        >
          <span className="block text-base font-semibold text-[#d8ff94]">Abono</span>
          <span className="mt-1 block text-xs text-[#aeb5bf]">Registrar abono</span>
        </button>
      </div>
    </section>
  );
}
