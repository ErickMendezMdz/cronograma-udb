import { type FormEvent } from "react";
import type { ExpensePaymentFormState } from "@/features/pretty-salon/types";
import { money } from "@/features/pretty-salon/utils";

type PrettyExpensePaymentDialogProps = {
  open: boolean;
  form: ExpensePaymentFormState;
  pendingTotal: number;
  methods: readonly string[];
  submitting?: boolean;
  onChange: <K extends keyof ExpensePaymentFormState>(
    field: K,
    value: ExpensePaymentFormState[K]
  ) => void;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
  onClose: () => void;
};

export function PrettyExpensePaymentDialog({
  open,
  form,
  pendingTotal,
  methods,
  submitting,
  onChange,
  onSubmit,
  onClose,
}: PrettyExpensePaymentDialogProps) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-40 flex items-end bg-black/70 p-4 sm:items-center sm:justify-center">
      <form
        onSubmit={onSubmit}
        className="w-full max-w-md rounded-lg border border-[#30333a] bg-[#181a1e] p-4 shadow-2xl shadow-black/40"
      >
        <p className="text-sm font-semibold text-[#00c2a8]">Deuda de tarjeta</p>
        <h2 className="mt-1 text-2xl font-semibold text-[#f7f9fb]">Registrar abono</h2>
        <p className="mt-2 text-sm leading-6 text-[#aeb5bf]">
          Pendiente actual:{" "}
          <span className="font-semibold text-[#ffe06b]">{money.format(pendingTotal)}</span>.
          El abono se aplica primero a la compra mas antigua. Si usas Donacion, baja la deuda sin afectar caja ni gastos pagados.
        </p>

        <div className="mt-5 grid gap-4">
          <label className="block">
            <span className="text-sm text-[#c7ced6]">Monto a abonar</span>
            <input
              type="number"
              inputMode="decimal"
              min="0"
              step="0.01"
              value={form.amount}
              onChange={(event) => onChange("amount", event.target.value)}
              placeholder="0.00"
              className="mt-2 w-full rounded-lg border border-[#3a3f48] bg-[#101113] px-3 py-3 text-base text-[#f7f9fb] outline-none transition focus:border-[#00c2a8] sm:py-2 sm:text-sm"
            />
          </label>

          <label className="block">
            <span className="text-sm text-[#c7ced6]">Fecha</span>
            <input
              type="date"
              value={form.date}
              onChange={(event) => onChange("date", event.target.value)}
              className="mt-2 w-full rounded-lg border border-[#3a3f48] bg-[#101113] px-3 py-3 text-base text-[#f7f9fb] outline-none transition focus:border-[#00c2a8] sm:py-2 sm:text-sm"
            />
          </label>

          <label className="block">
            <span className="text-sm text-[#c7ced6]">Metodo</span>
            <select
              value={form.paymentMethod}
              onChange={(event) => onChange("paymentMethod", event.target.value)}
              className="mt-2 w-full rounded-lg border border-[#3a3f48] bg-[#101113] px-3 py-3 text-base text-[#f7f9fb] outline-none transition focus:border-[#00c2a8] sm:py-2 sm:text-sm"
            >
              {methods.map((method) => (
                <option key={method} value={method}>
                  {method}
                </option>
              ))}
            </select>
          </label>

          <label className="block">
            <span className="text-sm text-[#c7ced6]">Notas</span>
            <textarea
              value={form.notes}
              onChange={(event) => onChange("notes", event.target.value)}
              rows={3}
              placeholder="Ej. Abono mensual a tarjeta de credito o donacion de material"
              className="mt-2 w-full resize-none rounded-lg border border-[#3a3f48] bg-[#101113] px-3 py-3 text-base text-[#f7f9fb] outline-none transition focus:border-[#00c2a8] sm:py-2 sm:text-sm"
            />
          </label>
        </div>

        <div className="mt-5 grid gap-2 sm:grid-cols-2">
          <button
            type="submit"
            disabled={submitting}
            className="rounded-lg bg-[#00c2a8] px-4 py-3 text-sm font-semibold text-[#081210] transition hover:bg-[#27dcc4] disabled:cursor-not-allowed disabled:opacity-60"
          >
            {submitting ? "Guardando..." : "Confirmar abono"}
          </button>
          <button
            type="button"
            onClick={onClose}
            disabled={submitting}
            className="rounded-lg border border-[#454b55] px-4 py-3 text-sm font-semibold text-[#d8dde3] transition hover:border-[#70d6ff] disabled:cursor-not-allowed disabled:opacity-60"
          >
            Cancelar
          </button>
        </div>
      </form>
    </div>
  );
}
