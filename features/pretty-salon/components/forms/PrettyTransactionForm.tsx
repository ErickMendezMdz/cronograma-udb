import { type FormEvent } from "react";
import type {
  SalonStatus,
  TransactionFormState,
  TransactionKind,
} from "@/features/pretty-salon/types";
import { isCreditPayment } from "@/features/pretty-salon/utils";

type PrettyTransactionFormProps = {
  kind: TransactionKind;
  title: string;
  description: string;
  form: TransactionFormState;
  categories: readonly string[];
  methods: readonly string[];
  submitLabel: string;
  submitting?: boolean;
  onChange: <K extends keyof TransactionFormState>(
    field: K,
    value: TransactionFormState[K]
  ) => void;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
};

export function PrettyTransactionForm({
  kind,
  title,
  description,
  form,
  categories,
  methods,
  submitLabel,
  submitting,
  onChange,
  onSubmit,
}: PrettyTransactionFormProps) {
  const creditSelected = isCreditPayment(form.paymentMethod);
  const statusText =
    kind === "income"
      ? creditSelected
        ? "Credito se guarda como por cobrar."
        : "Marca por cobrar solo si aun no recibiste el dinero."
      : creditSelected
        ? "Tarjeta de credito se guarda como por pagar."
        : "Marca por pagar solo si aun no salio el dinero.";

  return (
    <form onSubmit={onSubmit} className="rounded-lg border border-[#30333a] bg-[#181a1e] p-4">
      <h3 className="text-xl font-semibold text-[#f7f9fb]">{title}</h3>
      <p className="mt-2 text-sm leading-6 text-[#aeb5bf]">{description}</p>

      <div className="mt-5 grid gap-4 sm:grid-cols-2">
        <label className="block sm:col-span-2">
          <span className="text-sm text-[#c7ced6]">Concepto</span>
          <input
            value={form.concept}
            onChange={(event) => onChange("concept", event.target.value)}
            placeholder={kind === "income" ? "Ej. Corte, color, manicure" : "Ej. Tintes, renta, limpieza"}
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
          <span className="text-sm text-[#c7ced6]">Categoria</span>
          <select
            value={form.category}
            onChange={(event) => onChange("category", event.target.value)}
            className="mt-2 w-full rounded-lg border border-[#3a3f48] bg-[#101113] px-3 py-3 text-base text-[#f7f9fb] outline-none transition focus:border-[#00c2a8] sm:py-2 sm:text-sm"
          >
            {categories.map((category) => (
              <option key={category} value={category}>
                {category}
              </option>
            ))}
          </select>
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
          <span className="text-sm text-[#c7ced6]">
            {kind === "income" ? "Estado del cobro" : "Estado del pago"}
          </span>
          <select
            value={form.status}
            onChange={(event) => onChange("status", event.target.value as SalonStatus)}
            disabled={creditSelected}
            className="mt-2 w-full rounded-lg border border-[#3a3f48] bg-[#101113] px-3 py-3 text-base text-[#f7f9fb] outline-none transition focus:border-[#00c2a8] disabled:cursor-not-allowed disabled:opacity-70 sm:py-2 sm:text-sm"
          >
            <option value="paid">{kind === "income" ? "Cobrado" : "Pagado"}</option>
            <option value="pending">{kind === "income" ? "Por cobrar" : "Por pagar"}</option>
          </select>
          <p
            className={[
              "mt-2 text-xs leading-5",
              creditSelected ? "text-[#ffe06b]" : "text-[#8f98a5]",
            ].join(" ")}
          >
            {statusText}
          </p>
        </label>

        <label className="block">
          <span className="text-sm text-[#c7ced6]">
            {kind === "income" ? "Cliente" : "Proveedor"}
          </span>
          <input
            value={form.contact}
            onChange={(event) => onChange("contact", event.target.value)}
            placeholder="Nombre"
            className="mt-2 w-full rounded-lg border border-[#3a3f48] bg-[#101113] px-3 py-3 text-base text-[#f7f9fb] outline-none transition focus:border-[#00c2a8] sm:py-2 sm:text-sm"
          />
        </label>

        <label className="block sm:col-span-2">
          <span className="text-sm text-[#c7ced6]">Notas</span>
          <textarea
            value={form.notes}
            onChange={(event) => onChange("notes", event.target.value)}
            rows={3}
            placeholder="Detalle opcional"
            className="mt-2 w-full resize-none rounded-lg border border-[#3a3f48] bg-[#101113] px-3 py-3 text-base text-[#f7f9fb] outline-none transition focus:border-[#00c2a8] sm:py-2 sm:text-sm"
          />
        </label>
      </div>

      <button
        type="submit"
        disabled={submitting}
        className="mt-5 w-full rounded-lg bg-[#00c2a8] px-4 py-4 text-base font-semibold text-[#081210] transition hover:bg-[#27dcc4] disabled:cursor-not-allowed disabled:opacity-60 sm:py-3 sm:text-sm"
      >
        {submitting ? "Guardando..." : submitLabel}
      </button>
    </form>
  );
}
