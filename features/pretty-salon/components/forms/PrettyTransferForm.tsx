import { type FormEvent } from "react";
import { cashMovementMethods } from "@/features/pretty-salon/constants";
import type { CashTransferFormState } from "@/features/pretty-salon/types";

type PrettyTransferFormProps = {
  form: CashTransferFormState;
  submitting?: boolean;
  onChange: <K extends keyof CashTransferFormState>(
    field: K,
    value: CashTransferFormState[K]
  ) => void;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
};

export function PrettyTransferForm({
  form,
  submitting,
  onChange,
  onSubmit,
}: PrettyTransferFormProps) {
  return (
    <form onSubmit={onSubmit} className="rounded-lg border border-[#30333a] bg-[#181a1e] p-4">
      <h3 className="text-xl font-semibold text-[#f7f9fb]">Trasladar dinero</h3>
      <p className="mt-2 text-sm leading-6 text-[#aeb5bf]">
        Mueve saldo entre efectivo y cuenta banco sin crear ingreso ni gasto.
      </p>

      <div className="mt-5 grid gap-4">
        <label className="block">
          <span className="text-sm text-[#c7ced6]">Monto</span>
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

        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-1">
          <label className="block">
            <span className="text-sm text-[#c7ced6]">Sale de</span>
            <select
              value={form.fromMethod}
              onChange={(event) => onChange("fromMethod", event.target.value)}
              className="mt-2 w-full rounded-lg border border-[#3a3f48] bg-[#101113] px-3 py-3 text-base text-[#f7f9fb] outline-none transition focus:border-[#00c2a8] sm:py-2 sm:text-sm"
            >
              {cashMovementMethods.map((method) => (
                <option key={method} value={method}>
                  {method}
                </option>
              ))}
            </select>
          </label>

          <label className="block">
            <span className="text-sm text-[#c7ced6]">Entra a</span>
            <select
              value={form.toMethod}
              onChange={(event) => onChange("toMethod", event.target.value)}
              className="mt-2 w-full rounded-lg border border-[#3a3f48] bg-[#101113] px-3 py-3 text-base text-[#f7f9fb] outline-none transition focus:border-[#00c2a8] sm:py-2 sm:text-sm"
            >
              {cashMovementMethods.map((method) => (
                <option key={method} value={method}>
                  {method}
                </option>
              ))}
            </select>
          </label>
        </div>

        <label className="block">
          <span className="text-sm text-[#c7ced6]">Notas</span>
          <textarea
            value={form.notes}
            onChange={(event) => onChange("notes", event.target.value)}
            rows={3}
            placeholder="Ej. Tome efectivo y transferi a la cuenta del salon"
            className="mt-2 w-full resize-none rounded-lg border border-[#3a3f48] bg-[#101113] px-3 py-3 text-base text-[#f7f9fb] outline-none transition focus:border-[#00c2a8] sm:py-2 sm:text-sm"
          />
        </label>
      </div>

      <button
        type="submit"
        disabled={submitting}
        className="mt-5 w-full rounded-lg bg-[#00c2a8] px-4 py-4 text-base font-semibold text-[#081210] transition hover:bg-[#27dcc4] disabled:cursor-not-allowed disabled:opacity-60 sm:py-3 sm:text-sm"
      >
        {submitting ? "Guardando..." : "Guardar traslado"}
      </button>
    </form>
  );
}
