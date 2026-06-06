import { type FormEvent } from "react";
import { cashMovementMethods } from "@/features/pretty-salon/constants";
import type {
  LoanMovementFormState,
  LoanMovementType,
} from "@/features/pretty-salon/types";

type PrettyLoanMovementFormProps = {
  form: LoanMovementFormState;
  submitting?: boolean;
  onChange: <K extends keyof LoanMovementFormState>(
    field: K,
    value: LoanMovementFormState[K]
  ) => void;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
};

export function PrettyLoanMovementForm({
  form,
  submitting,
  onChange,
  onSubmit,
}: PrettyLoanMovementFormProps) {
  return (
    <form onSubmit={onSubmit} className="rounded-lg border border-[#30333a] bg-[#181a1e] p-4">
      <h3 className="text-xl font-semibold text-[#f7f9fb]">Prestado</h3>
      <p className="mt-2 text-sm leading-6 text-[#aeb5bf]">
        Registra dinero tomado temporalmente o repuesto. Solo ajusta efectivo o cuenta banco.
      </p>

      <div className="mt-5 grid gap-4">
        <label className="block">
          <span className="text-sm text-[#c7ced6]">Movimiento</span>
          <select
            value={form.movementType}
            onChange={(event) => onChange("movementType", event.target.value as LoanMovementType)}
            className="mt-2 w-full rounded-lg border border-[#3a3f48] bg-[#101113] px-3 py-3 text-base text-[#f7f9fb] outline-none transition focus:border-[#00c2a8] sm:py-2 sm:text-sm"
          >
            <option value="borrow">Prestado</option>
            <option value="repay">Reposicion</option>
          </select>
        </label>

        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-1">
          <label className="block">
            <span className="text-sm text-[#c7ced6]">Quien</span>
            <input
              value={form.borrower}
              onChange={(event) => onChange("borrower", event.target.value)}
              placeholder="Erick o esposa"
              className="mt-2 w-full rounded-lg border border-[#3a3f48] bg-[#101113] px-3 py-3 text-base text-[#f7f9fb] outline-none transition focus:border-[#00c2a8] sm:py-2 sm:text-sm"
            />
          </label>

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
        </div>

        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-1">
          <label className="block">
            <span className="text-sm text-[#c7ced6]">Metodo</span>
            <select
              value={form.paymentMethod}
              onChange={(event) => onChange("paymentMethod", event.target.value)}
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
            <span className="text-sm text-[#c7ced6]">Fecha</span>
            <input
              type="date"
              value={form.date}
              onChange={(event) => onChange("date", event.target.value)}
              className="mt-2 w-full rounded-lg border border-[#3a3f48] bg-[#101113] px-3 py-3 text-base text-[#f7f9fb] outline-none transition focus:border-[#00c2a8] sm:py-2 sm:text-sm"
            />
          </label>
        </div>

        <label className="block">
          <span className="text-sm text-[#c7ced6]">Notas</span>
          <textarea
            value={form.notes}
            onChange={(event) => onChange("notes", event.target.value)}
            rows={3}
            placeholder="Ej. Retiro personal temporal"
            className="mt-2 w-full resize-none rounded-lg border border-[#3a3f48] bg-[#101113] px-3 py-3 text-base text-[#f7f9fb] outline-none transition focus:border-[#00c2a8] sm:py-2 sm:text-sm"
          />
        </label>
      </div>

      <button
        type="submit"
        disabled={submitting}
        className="mt-5 w-full rounded-lg bg-[#00c2a8] px-4 py-4 text-base font-semibold text-[#081210] transition hover:bg-[#27dcc4] disabled:cursor-not-allowed disabled:opacity-60 sm:py-3 sm:text-sm"
      >
        {submitting ? "Guardando..." : "Guardar prestado"}
      </button>
    </form>
  );
}
