"use client";

import { type FormEvent } from "react";
import Link from "next/link";
import {
  cashMovementMethods,
  collectionPaymentMethods,
  expenseCategories,
  expensePaymentMethods,
  expenseSettlementMethods,
  incomeCategories,
  incomePaymentMethods,
  mobileNavItems,
  sectionItems,
  serviceCatalog,
} from "@/features/pretty-salon/constants";
import { PrettyBalanceCard } from "@/features/pretty-salon/components/dashboard/PrettyBalanceCard";
import { PrettyDashboardHeader } from "@/features/pretty-salon/components/dashboard/PrettyDashboardHeader";
import { PrettyMetricCard } from "@/features/pretty-salon/components/dashboard/PrettyMetricCard";
import { PrettyQuickActions } from "@/features/pretty-salon/components/dashboard/PrettyQuickActions";
import { PrettySectionTabs } from "@/features/pretty-salon/components/dashboard/PrettySectionTabs";
import { usePrettySalon } from "@/features/pretty-salon/hooks/usePrettySalon";
import type {
  BreakdownItem,
  CashTransferFormState,
  ExpensePaymentFormState,
  LoanMovementType,
  LoanMovementFormState,
  SalonStatus,
  SalonTransaction,
  TransactionFormState,
  TransactionKind,
} from "@/features/pretty-salon/types";
import {
  formatDate,
  formatMonth,
  getStatusLabel,
  isCreditPayment,
  isDonationPayment,
  money,
} from "@/features/pretty-salon/utils";

function SectionTitle({
  label,
  title,
  description,
}: {
  label: string;
  title: string;
  description: string;
}) {
  return (
    <div>
      <p className="text-sm font-semibold text-[#00c2a8]">{label}</p>
      <h2 className="mt-1 text-2xl font-semibold text-[#f7f9fb]">{title}</h2>
      <p className="mt-2 max-w-2xl text-sm leading-6 text-[#aeb5bf]">{description}</p>
    </div>
  );
}

function BreakdownList({
  items,
  emptyMessage,
}: {
  items: BreakdownItem[];
  emptyMessage: string;
}) {
  if (items.length === 0) {
    return <p className="text-sm text-[#aeb5bf]">{emptyMessage}</p>;
  }

  return (
    <div className="space-y-4">
      {items.map((item) => (
        <div key={item.label}>
          <div className="flex items-center justify-between gap-3 text-sm">
            <span className="text-[#eef2f4]">{item.label}</span>
            <span className="font-semibold text-[#f7f9fb]">{money.format(item.value)}</span>
          </div>
          <div className="mt-2 h-2 rounded-md bg-[#2a2d33]">
            <div
              className="h-full rounded-md"
              style={{ width: `${Math.max(item.share, 4)}%`, backgroundColor: item.color }}
            />
          </div>
        </div>
      ))}
    </div>
  );
}

function TransactionTable({
  transactions,
  emptyMessage,
  onDelete,
  onCollect,
  onPayExpense,
  expensePaidAmounts,
  deletingId,
  collectingId,
}: {
  transactions: SalonTransaction[];
  emptyMessage: string;
  onDelete: (id: string) => void | Promise<void>;
  onCollect: (transaction: SalonTransaction) => void;
  onPayExpense: () => void;
  expensePaidAmounts?: Map<string, number>;
  deletingId?: string | null;
  collectingId?: string | null;
}) {
  if (transactions.length === 0) {
    return (
      <div className="rounded-lg border border-dashed border-[#3a3f48] p-6 text-sm text-[#aeb5bf]">
        {emptyMessage}
      </div>
    );
  }

  return (
    <div className="grid gap-3 lg:grid-cols-2">
        {transactions.map((item) => {
          const canCollect = item.kind === "income" && item.status === "pending";
          const expensePaidAmount = item.kind === "expense" ? (expensePaidAmounts?.get(item.id) ?? 0) : 0;
          const expensePendingAmount = Math.max(item.amount - expensePaidAmount, 0);
          const canPayExpense = item.kind === "expense" && item.status === "pending" && expensePendingAmount > 0;
          const isExpensePaid = item.kind === "expense" && item.status === "pending" && expensePendingAmount <= 0;
          const isExpensePartial = item.kind === "expense" && expensePaidAmount > 0 && expensePendingAmount > 0;
          const isCollecting = collectingId === item.id;
          const isDeleting = deletingId === item.id;

          return (
            <article key={item.id} className="min-w-0 rounded-lg border border-[#30333a] bg-[#101113] p-4">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="break-words text-base font-semibold text-[#f7f9fb]">{item.concept}</p>
                  <p className="mt-1 text-xs text-[#aeb5bf]">
                    {formatDate(item.date)} · {item.category}
                  </p>
                </div>
                <p
                  className={[
                    "shrink-0 text-right text-lg font-semibold tabular-nums",
                    item.kind === "income" ? "text-[#71f2d8]" : "text-[#ff8aa1]",
                  ].join(" ")}
                >
                  {item.kind === "income" ? "+" : "-"}
                  {money.format(item.amount)}
                </p>
              </div>

              <div className="mt-4 grid grid-cols-2 gap-2 text-xs">
                <div className="rounded-md bg-[#181a1e] px-3 py-2">
                  <p className="text-[#8f98a5]">Contacto</p>
                  <p className="mt-1 truncate text-[#d8dde3]">{item.contact || "Sin contacto"}</p>
                </div>
                <div className="rounded-md bg-[#181a1e] px-3 py-2">
                  <p className="text-[#8f98a5]">Metodo</p>
                  <p className="mt-1 truncate text-[#d8dde3]">{item.paymentMethod}</p>
                </div>
              </div>

              <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
                <span
                  className={[
                    "inline-flex rounded-md px-2 py-1 text-xs font-semibold",
                    item.status === "paid" || isExpensePaid
                      ? "bg-[#0f3b33] text-[#71f2d8]"
                      : isExpensePartial
                        ? "bg-[#193347] text-[#70d6ff]"
                        : "bg-[#403611] text-[#ffe06b]",
                  ].join(" ")}
                >
                  {isExpensePartial
                    ? "Abonado"
                    : isExpensePaid
                      ? "Pagado"
                      : getStatusLabel(item.status, item.kind)}
                </span>
                <div className="ml-auto flex flex-wrap justify-end gap-2">
                  {canCollect ? (
                    <button
                      onClick={() => onCollect(item)}
                      disabled={isCollecting || isDeleting}
                      className="rounded-md border border-[#00c2a8] px-3 py-2 text-xs font-semibold text-[#71f2d8] transition hover:bg-[#0f312e] disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      {isCollecting ? "Cobrando..." : "Cobrar"}
                    </button>
                  ) : null}
                  {canPayExpense ? (
                    <button
                      onClick={onPayExpense}
                      disabled={isDeleting}
                      className="rounded-md border border-[#70d6ff] px-3 py-2 text-xs font-semibold text-[#70d6ff] transition hover:bg-[#132936] disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      Abonar
                    </button>
                  ) : null}
                  <button
                    onClick={() => onDelete(item.id)}
                    disabled={isDeleting || isCollecting}
                    className="rounded-md border border-[#454b55] px-3 py-2 text-xs font-semibold text-[#d8dde3] transition hover:border-[#ff5f7e] hover:text-[#ff8aa1] disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {isDeleting ? "Eliminando..." : "Eliminar"}
                  </button>
                </div>
              </div>

              {isExpensePartial ? (
                <p className="mt-3 text-xs leading-5 text-[#aeb5bf]">
                  Abonado {money.format(expensePaidAmount)} de {money.format(item.amount)}.
                  Pendiente {money.format(expensePendingAmount)}.
                </p>
              ) : null}

              {item.notes ? (
                <p className="mt-3 whitespace-pre-line text-xs leading-5 text-[#aeb5bf]">
                  {item.notes}
                </p>
              ) : null}
            </article>
          );
        })}
    </div>
  );
}

function TransactionForm({
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
}: {
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
}) {
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
          <p className={["mt-2 text-xs leading-5", creditSelected ? "text-[#ffe06b]" : "text-[#8f98a5]"].join(" ")}>
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

function CashTransferForm({
  form,
  submitting,
  onChange,
  onSubmit,
}: {
  form: CashTransferFormState;
  submitting?: boolean;
  onChange: <K extends keyof CashTransferFormState>(
    field: K,
    value: CashTransferFormState[K]
  ) => void;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
}) {
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

function LoanMovementForm({
  form,
  submitting,
  onChange,
  onSubmit,
}: {
  form: LoanMovementFormState;
  submitting?: boolean;
  onChange: <K extends keyof LoanMovementFormState>(
    field: K,
    value: LoanMovementFormState[K]
  ) => void;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
}) {
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

function ExpensePaymentDialog({
  form,
  pendingTotal,
  submitting,
  onChange,
  onSubmit,
  onClose,
}: {
  form: ExpensePaymentFormState;
  pendingTotal: number;
  submitting?: boolean;
  onChange: <K extends keyof ExpensePaymentFormState>(
    field: K,
    value: ExpensePaymentFormState[K]
  ) => void;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
  onClose: () => void;
}) {
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
              {expenseSettlementMethods.map((method) => (
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

export default function PrettyEscritorioPage() {
  const {
    actionAreaRef,
    quickAccessRef,
    cashTransferFormRef,
    loanMovementFormRef,
    checking,
    supabase,
    configError,
    loadingData,
    loadError,
    migrationNotice,
    savingKind,
    savingCashTransfer,
    savingExpensePayment,
    savingLoanMovement,
    deletingId,
    deletingCashTransferId,
    deletingExpensePaymentId,
    deletingLoanMovementId,
    collectingId,
    userId,
    email,
    activeSection,
    setActiveSection,
    selectedMonth,
    setSelectedMonth,
    incomeForm,
    expenseForm,
    cashTransferForm,
    expensePaymentForm,
    loanMovementForm,
    expensePaymentDialogOpen,
    setExpensePaymentDialogOpen,
    collectionTarget,
    setCollectionTarget,
    collectionMethod,
    setCollectionMethod,
    loadSalonData,
    handleLogout,
    switchSection,
    updateIncomeForm,
    updateExpenseForm,
    updateCashTransferForm,
    updateExpensePaymentForm,
    updateLoanMovementForm,
    openExpensePaymentDialog,
    openCashAction,
    openIncomeForm,
    openExpenseForm,
    handleMobileNavigation,
    addTransaction,
    addCashTransfer,
    addExpensePayment,
    addLoanMovement,
    deleteTransaction,
    deleteCashTransfer,
    deleteExpensePayment,
    deleteLoanMovement,
    openCollectDialog,
    collectPendingIncome,
    startIncomeFromService,
    sortedTransactions,
    monthOptions,
    monthlyCashTransfers,
    monthlyExpensePayments,
    monthlyLoanMovements,
    expensePaymentAllocations,
    paidIncome,
    pendingIncome,
    paidExpenses,
    pendingExpenses,
    totalPendingExpenses,
    netProfit,
    projectedProfit,
    margin,
    incomeBreakdown,
    expenseBreakdown,
    pendingExpenseBreakdown,
    pendingIncomeBreakdown,
    loanBreakdown,
    dailyTrend,
    trendMax,
    paymentBreakdown,
    cashTransferVolume,
    loanedBalance,
    clientRows,
    monthlyReports,
  } = usePrettySalon();

  if (checking) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#101113] text-[#f7f9fb]">
        Cargando...
      </div>
    );
  }

  if (!supabase) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#101113] p-4">
        <div className="w-full max-w-lg rounded-lg border border-[#ff5f7e] bg-[#181a1e] p-6 text-[#f7f9fb] shadow-2xl shadow-black/30">
          <h1 className="text-xl font-semibold">Configuracion incompleta</h1>
          <p className="mt-2 text-sm text-[#aeb5bf]">
            {configError ?? "Faltan las variables publicas de Supabase."}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen w-full max-w-full overflow-x-hidden bg-[#101113] text-[#f7f9fb]">
      <div className="mx-auto grid min-h-screen w-full max-w-[1500px] min-w-0 lg:grid-cols-[292px_minmax(0,1fr)]">
        <aside className="min-w-0 border-b border-[#30333a] bg-[#15171a] p-4 lg:sticky lg:top-0 lg:h-screen lg:overflow-y-auto lg:border-b-0 lg:border-r">
          <div className="flex items-start justify-between gap-4 lg:block">
            <div className="min-w-0">
              <p className="text-2xl font-semibold leading-tight text-[#f7f9fb]">Pretty Salon</p>
            </div>
            <Link
              href="/modulos"
              className="shrink-0 rounded-lg border border-[#3a3f48] px-3 py-2 text-sm font-semibold text-[#d8dde3] transition hover:border-[#00c2a8] hover:text-[#71f2d8]"
            >
              Modulos
            </Link>
          </div>

          <div
            role="img"
            aria-label="Interior de salon de belleza"
            className="mt-5 hidden h-36 rounded-lg border border-[#30333a] bg-cover bg-center sm:block"
            style={{
              backgroundImage:
                "linear-gradient(180deg, rgba(16,17,19,0.05), rgba(16,17,19,0.65)), url('https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?auto=format&fit=crop&w=900&q=80')",
            }}
          />

          <PrettySectionTabs
            items={sectionItems}
            activeSection={activeSection}
            onChange={setActiveSection}
          />

          <div className="mt-5 hidden rounded-lg border border-[#30333a] bg-[#181a1e] p-4 lg:block">
            <p className="text-sm font-semibold text-[#f7f9fb]">Sesion activa</p>
            <p className="mt-1 break-all text-sm text-[#aeb5bf]">{email ?? "Administracion"}</p>
            <button
              onClick={handleLogout}
              className="mt-4 w-full rounded-lg border border-[#454b55] px-3 py-2 text-sm font-semibold text-[#d8dde3] transition hover:border-[#ff5f7e] hover:text-[#ff8aa1]"
            >
              Salir
            </button>
          </div>
        </aside>

        <main className="min-w-0 pb-28 pl-4 pr-4 pt-4 sm:p-6 sm:pb-28 lg:p-8">
          <PrettyDashboardHeader
            selectedMonth={selectedMonth}
            monthOptions={monthOptions}
            formatMonth={formatMonth}
            onMonthChange={setSelectedMonth}
          />

          {loadingData ? (
            <div className="mt-5 rounded-lg border border-[#30333a] bg-[#181a1e] px-4 py-3 text-sm text-[#aeb5bf]">
              Sincronizando movimientos con Supabase...
            </div>
          ) : null}

          {loadError ? (
            <div className="mt-5 rounded-lg border border-[#ff5f7e] bg-[#321820] p-4 text-sm text-[#ffd4dd]">
              <p className="font-semibold text-[#fff2f5]">No se pudieron cargar los datos.</p>
              <p className="mt-1">{loadError}</p>
              <button
                onClick={() => {
                  if (userId) void loadSalonData();
                }}
                className="mt-3 rounded-lg border border-[#ff8aa1] px-3 py-2 text-xs font-semibold text-[#ffd4dd] transition hover:bg-[#49212b]"
              >
                Reintentar
              </button>
            </div>
          ) : null}

          {migrationNotice ? (
            <div className="mt-5 rounded-lg border border-[#f7d84a] bg-[#2e2912] px-4 py-3 text-sm text-[#fff1a6]">
              {migrationNotice}
            </div>
          ) : null}

          {activeSection === "dashboard" ? (
            <PrettyQuickActions
              quickAccessRef={quickAccessRef}
              totalPendingExpenses={totalPendingExpenses}
              onIncome={() => openIncomeForm("Efectivo")}
              onExpense={openExpenseForm}
              onTransfer={() => openCashAction("transfer")}
              onLoan={() => openCashAction("loan")}
              onExpensePayment={openExpensePaymentDialog}
            />
          ) : null}

          <section className="mt-6 grid min-w-0 gap-3 sm:grid-cols-2 xl:grid-cols-4">
            <PrettyMetricCard
              label="Utilidad real"
              value={money.format(netProfit)}
              detail={`${margin.toFixed(1)}% de margen`}
              accent="#f7d84a"
            />
            <PrettyMetricCard
              label="Gastos pagados"
              value={money.format(paidExpenses)}
              detail={`${money.format(pendingExpenses)} por pagar`}
              accent="#ff5f7e"
            />
            <PrettyMetricCard
              label="Ingresos cobrados"
              value={money.format(paidIncome)}
              detail={`${money.format(pendingIncome)} por cobrar`}
              accent="#00c2a8"
            />
            <PrettyMetricCard
              label="Por pagar"
              value={money.format(totalPendingExpenses)}
              detail="Deuda pendiente"
              accent="#70d6ff"
            />
          </section>

          <div ref={actionAreaRef} className="scroll-mt-4" />

          {activeSection === "dashboard" ? (
            <>
              <section className="mt-6 grid min-w-0 gap-4">
                <div className="min-w-0 rounded-lg border border-[#30333a] bg-[#181a1e] p-4">
                  <SectionTitle
                    label="Vista principal"
                    title="Ingresos contra gastos"
                    description="Comparativo de los ultimos dias con movimientos pagados."
                  />

                  <div className="mt-6 flex h-44 min-w-0 items-end gap-1 border-b border-[#30333a] px-1 pb-3 sm:h-64 sm:gap-2">
                    {dailyTrend.map((item) => {
                      const incomeHeight = item.income > 0 ? Math.max((item.income / trendMax) * 100, 6) : 0;
                      const expenseHeight = item.expense > 0 ? Math.max((item.expense / trendMax) * 100, 6) : 0;

                      return (
                        <div key={item.date} className="flex min-w-0 flex-1 flex-col items-center gap-2">
                          <div className="flex h-32 w-full items-end justify-center gap-1 sm:h-48">
                            <div
                              title={`Ingresos ${money.format(item.income)}`}
                              className="w-3 rounded-sm bg-[#00c2a8]"
                              style={{ height: `${incomeHeight}%` }}
                            />
                            <div
                              title={`Gastos ${money.format(item.expense)}`}
                              className="w-3 rounded-sm bg-[#ff5f7e]"
                              style={{ height: `${expenseHeight}%` }}
                            />
                          </div>
                          <span className="truncate text-xs text-[#aeb5bf]">{item.label}</span>
                        </div>
                      );
                    })}
                  </div>

                  <div className="mt-4 flex flex-wrap gap-4 text-sm text-[#c7ced6]">
                    <span className="inline-flex items-center gap-2">
                      <span className="h-3 w-3 rounded-sm bg-[#00c2a8]" />
                      Ingresos
                    </span>
                    <span className="inline-flex items-center gap-2">
                      <span className="h-3 w-3 rounded-sm bg-[#ff5f7e]" />
                      Gastos
                    </span>
                  </div>
                </div>
              </section>

              <section className="mt-6 grid min-w-0 gap-4 xl:grid-cols-2">
                <div className="min-w-0 rounded-lg border border-[#30333a] bg-[#181a1e] p-4">
                  <SectionTitle
                    label="Ingresos"
                    title="Fuentes del mes"
                    description="Lo que mas esta aportando al salon."
                  />
                  <div className="mt-5">
                    <BreakdownList
                      items={incomeBreakdown}
                      emptyMessage="Aun no hay ingresos cobrados en este mes."
                    />
                  </div>
                </div>

                <div className="min-w-0 rounded-lg border border-[#30333a] bg-[#181a1e] p-4">
                  <SectionTitle
                    label="Gastos"
                    title="Costos principales"
                    description="Categorias que estan consumiendo caja."
                  />
                  <div className="mt-5">
                    <BreakdownList
                      items={expenseBreakdown}
                      emptyMessage="Aun no hay gastos pagados en este mes."
                    />
                  </div>
                </div>
              </section>

              <section className="mt-6 min-w-0 rounded-lg border border-[#30333a] bg-[#181a1e] p-4">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
                  <SectionTitle
                    label="Movimientos"
                    title="Actividad reciente"
                    description="Ultimos registros creados para el salon."
                  />
                  <button
                    onClick={() => switchSection("reportes")}
                    className="rounded-lg border border-[#3a3f48] px-4 py-2 text-sm font-semibold text-[#d8dde3] transition hover:border-[#70d6ff]"
                  >
                    Ver reportes
                  </button>
                </div>
                <div className="mt-5">
                  <TransactionTable
                    transactions={sortedTransactions.slice(0, 6)}
                    emptyMessage="Todavia no hay movimientos."
                    onDelete={deleteTransaction}
                    onCollect={openCollectDialog}
                    onPayExpense={openExpensePaymentDialog}
                    expensePaidAmounts={expensePaymentAllocations}
                    deletingId={deletingId}
                    collectingId={collectingId}
                  />
                </div>
              </section>
            </>
          ) : null}

          {activeSection === "ingresos" ? (
            <section className="mt-6 grid min-w-0 gap-4 xl:grid-cols-[360px_minmax(0,1fr)] 2xl:grid-cols-[400px_minmax(0,1fr)]">
              <TransactionForm
                kind="income"
                title="Registrar ingreso"
                description="Guarda cobros de servicios, ventas de producto, membresias, paquetes o propinas."
                form={incomeForm}
                categories={incomeCategories}
                methods={incomePaymentMethods}
                submitLabel="Guardar ingreso"
                submitting={savingKind === "income"}
                onChange={updateIncomeForm}
                onSubmit={(event) => addTransaction("income", event)}
              />
              <div className="min-w-0 rounded-lg border border-[#30333a] bg-[#181a1e] p-4">
                <SectionTitle
                  label="Ingresos"
                  title="Historial de cobros"
                  description="Movimientos positivos del salon, pagados o pendientes."
                />
                <div className="mt-5">
                  <TransactionTable
                    transactions={sortedTransactions.filter((item) => item.kind === "income")}
                    emptyMessage="No hay ingresos registrados."
                    onDelete={deleteTransaction}
                    onCollect={openCollectDialog}
                    onPayExpense={openExpensePaymentDialog}
                    expensePaidAmounts={expensePaymentAllocations}
                    deletingId={deletingId}
                    collectingId={collectingId}
                  />
                </div>
              </div>
            </section>
          ) : null}

          {activeSection === "gastos" ? (
            <section className="mt-6 grid min-w-0 gap-4 xl:grid-cols-[360px_minmax(0,1fr)] 2xl:grid-cols-[400px_minmax(0,1fr)]">
              <TransactionForm
                kind="expense"
                title="Registrar gasto"
                description="Controla insumos, nomina, renta, servicios basicos, marketing, limpieza y equipo."
                form={expenseForm}
                categories={expenseCategories}
                methods={expensePaymentMethods}
                submitLabel="Guardar gasto"
                submitting={savingKind === "expense"}
                onChange={updateExpenseForm}
                onSubmit={(event) => addTransaction("expense", event)}
              />
              <div className="min-w-0 rounded-lg border border-[#30333a] bg-[#181a1e] p-4">
                <SectionTitle
                  label="Gastos"
                  title="Historial de pagos"
                  description="Costos operativos del salon, pagados o pendientes."
                />
                <div className="mt-5">
                  <TransactionTable
                    transactions={sortedTransactions.filter((item) => item.kind === "expense")}
                    emptyMessage="No hay gastos registrados."
                    onDelete={deleteTransaction}
                    onCollect={openCollectDialog}
                    onPayExpense={openExpensePaymentDialog}
                    expensePaidAmounts={expensePaymentAllocations}
                    deletingId={deletingId}
                    collectingId={collectingId}
                  />
                </div>
              </div>
            </section>
          ) : null}

          {activeSection === "caja" ? (
            <section className="mt-6 grid min-w-0 gap-4 xl:grid-cols-[minmax(0,1fr)_380px]">
              <div className="grid min-w-0 gap-4">
                <div className="min-w-0 rounded-lg border border-[#30333a] bg-[#181a1e] p-4">
                  <SectionTitle
                    label="Caja"
                    title="Saldos en caja"
                    description="Ingresos menos gastos pagados, ajustado por traslados internos del mes."
                  />
                  {paymentBreakdown.length === 0 ? (
                    <div className="mt-5 rounded-lg border border-dashed border-[#3a3f48] p-6 text-sm text-[#aeb5bf]">
                      Aun no hay movimientos de caja para este mes.
                    </div>
                  ) : (
                    <div className="mt-5 grid min-w-0 gap-3 md:grid-cols-2">
                      {paymentBreakdown.map((item) => (
                        <PrettyBalanceCard key={item.method} item={item} />
                      ))}
                    </div>
                  )}
                </div>

                <div className="min-w-0 rounded-lg border border-[#30333a] bg-[#181a1e] p-4">
                  <SectionTitle
                    label="Traslados"
                    title="Movimientos internos"
                    description="Cambios entre metodos que no alteran ingresos, gastos ni utilidad."
                  />
                  <div className="mt-5 overflow-x-auto rounded-lg border border-[#30333a]">
                    <table className="min-w-[720px] w-full text-left text-sm">
                      <thead className="bg-[#111316] text-[#aeb5bf]">
                        <tr>
                          <th className="px-4 py-3 font-medium">Fecha</th>
                          <th className="px-4 py-3 font-medium">Sale de</th>
                          <th className="px-4 py-3 font-medium">Entra a</th>
                          <th className="px-4 py-3 text-right font-medium">Monto</th>
                          <th className="px-4 py-3 font-medium">Notas</th>
                          <th className="px-4 py-3 text-right font-medium">Accion</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-[#30333a]">
                        {monthlyCashTransfers.length === 0 ? (
                          <tr>
                            <td colSpan={6} className="px-4 py-6 text-center text-[#aeb5bf]">
                              Aun no hay traslados internos en este mes.
                            </td>
                          </tr>
                        ) : (
                          monthlyCashTransfers.map((item) => (
                            <tr key={item.id} className="align-top">
                              <td className="px-4 py-4 text-[#d8dde3]">{formatDate(item.date)}</td>
                              <td className="px-4 py-4 text-[#ff8aa1]">{item.fromMethod}</td>
                              <td className="px-4 py-4 text-[#71f2d8]">{item.toMethod}</td>
                              <td className="px-4 py-4 text-right font-semibold text-[#f7f9fb]">
                                {money.format(item.amount)}
                              </td>
                              <td className="px-4 py-4 text-[#aeb5bf]">
                                {item.notes || "Sin notas"}
                              </td>
                              <td className="px-4 py-4 text-right">
                                <button
                                  onClick={() => deleteCashTransfer(item.id)}
                                  disabled={deletingCashTransferId === item.id}
                                  className="rounded-md border border-[#454b55] px-3 py-1.5 text-xs font-semibold text-[#d8dde3] transition hover:border-[#ff5f7e] hover:text-[#ff8aa1] disabled:cursor-not-allowed disabled:opacity-60"
                                >
                                  {deletingCashTransferId === item.id ? "Eliminando..." : "Eliminar"}
                                </button>
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>

                <div className="min-w-0 rounded-lg border border-[#30333a] bg-[#181a1e] p-4">
                  <SectionTitle
                    label="Prestado"
                    title="Dinero pendiente de reponer"
                    description="Retiros temporales y reposiciones. No se cuentan como gasto ni como deuda por pagar."
                  />
                  <div className="mt-5 overflow-x-auto rounded-lg border border-[#30333a]">
                    <table className="min-w-[760px] w-full text-left text-sm">
                      <thead className="bg-[#111316] text-[#aeb5bf]">
                        <tr>
                          <th className="px-4 py-3 font-medium">Fecha</th>
                          <th className="px-4 py-3 font-medium">Movimiento</th>
                          <th className="px-4 py-3 font-medium">Quien</th>
                          <th className="px-4 py-3 font-medium">Metodo</th>
                          <th className="px-4 py-3 text-right font-medium">Monto</th>
                          <th className="px-4 py-3 font-medium">Notas</th>
                          <th className="px-4 py-3 text-right font-medium">Accion</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-[#30333a]">
                        {monthlyLoanMovements.length === 0 ? (
                          <tr>
                            <td colSpan={7} className="px-4 py-6 text-center text-[#aeb5bf]">
                              Aun no hay dinero prestado o repuesto en este mes.
                            </td>
                          </tr>
                        ) : (
                          monthlyLoanMovements.map((item) => (
                            <tr key={item.id} className="align-top">
                              <td className="px-4 py-4 text-[#d8dde3]">{formatDate(item.date)}</td>
                              <td
                                className={[
                                  "px-4 py-4 font-semibold",
                                  item.movementType === "borrow" ? "text-[#ff8aa1]" : "text-[#71f2d8]",
                                ].join(" ")}
                              >
                                {item.movementType === "borrow" ? "Prestado" : "Reposicion"}
                              </td>
                              <td className="px-4 py-4 text-[#d8dde3]">{item.borrower || "Sin nombre"}</td>
                              <td className="px-4 py-4 text-[#d8dde3]">{item.paymentMethod}</td>
                              <td
                                className={[
                                  "px-4 py-4 text-right font-semibold",
                                  item.movementType === "borrow" ? "text-[#ff8aa1]" : "text-[#71f2d8]",
                                ].join(" ")}
                              >
                                {item.movementType === "borrow" ? "-" : "+"}
                                {money.format(item.amount)}
                              </td>
                              <td className="px-4 py-4 text-[#aeb5bf]">
                                {item.notes || "Sin notas"}
                              </td>
                              <td className="px-4 py-4 text-right">
                                <button
                                  onClick={() => deleteLoanMovement(item.id)}
                                  disabled={deletingLoanMovementId === item.id}
                                  className="rounded-md border border-[#454b55] px-3 py-1.5 text-xs font-semibold text-[#d8dde3] transition hover:border-[#ff5f7e] hover:text-[#ff8aa1] disabled:cursor-not-allowed disabled:opacity-60"
                                >
                                  {deletingLoanMovementId === item.id ? "Eliminando..." : "Eliminar"}
                                </button>
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>

                <div className="min-w-0 rounded-lg border border-[#30333a] bg-[#181a1e] p-4">
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
                    <SectionTitle
                      label="Deuda"
                      title="Abonos y donaciones"
                      description="Liquidaciones aplicadas a los gastos por pagar mas antiguos."
                    />
                    <button
                      onClick={openExpensePaymentDialog}
                      disabled={totalPendingExpenses <= 0}
                      className="rounded-lg border border-[#70d6ff] px-4 py-2 text-sm font-semibold text-[#70d6ff] transition hover:bg-[#132936] disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      Registrar abono
                    </button>
                  </div>
                  <div className="mt-5 overflow-x-auto rounded-lg border border-[#30333a]">
                    <table className="min-w-[640px] w-full text-left text-sm">
                      <thead className="bg-[#111316] text-[#aeb5bf]">
                        <tr>
                          <th className="px-4 py-3 font-medium">Fecha</th>
                          <th className="px-4 py-3 font-medium">Metodo</th>
                          <th className="px-4 py-3 text-right font-medium">Monto</th>
                          <th className="px-4 py-3 font-medium">Notas</th>
                          <th className="px-4 py-3 text-right font-medium">Accion</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-[#30333a]">
                        {monthlyExpensePayments.length === 0 ? (
                          <tr>
                            <td colSpan={5} className="px-4 py-6 text-center text-[#aeb5bf]">
                              Aun no hay abonos o donaciones en este mes.
                            </td>
                          </tr>
                        ) : (
                          monthlyExpensePayments.map((item) => (
                            <tr key={item.id} className="align-top">
                              <td className="px-4 py-4 text-[#d8dde3]">{formatDate(item.date)}</td>
                              <td className="px-4 py-4 text-[#d8dde3]">{item.paymentMethod}</td>
                              <td
                                className={[
                                  "px-4 py-4 text-right font-semibold",
                                  isDonationPayment(item.paymentMethod) ? "text-[#70d6ff]" : "text-[#ff8aa1]",
                                ].join(" ")}
                              >
                                {money.format(item.amount)}
                              </td>
                              <td className="px-4 py-4 text-[#aeb5bf]">
                                {item.notes ||
                                  (isDonationPayment(item.paymentMethod)
                                    ? "Donacion aplicada a deuda mas antigua"
                                    : "Aplicado a deuda mas antigua")}
                              </td>
                              <td className="px-4 py-4 text-right">
                                <button
                                  onClick={() => deleteExpensePayment(item.id)}
                                  disabled={deletingExpensePaymentId === item.id}
                                  className="rounded-md border border-[#454b55] px-3 py-1.5 text-xs font-semibold text-[#d8dde3] transition hover:border-[#ff5f7e] hover:text-[#ff8aa1] disabled:cursor-not-allowed disabled:opacity-60"
                                >
                                  {deletingExpensePaymentId === item.id ? "Eliminando..." : "Eliminar"}
                                </button>
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>

              <div className="grid min-w-0 gap-4">
                <div className="min-w-0 rounded-lg border border-[#30333a] bg-[#181a1e] p-4">
                  <SectionTitle
                    label="Cierre"
                    title="Resumen de caja"
                    description="Lo esencial para revisar antes de cerrar el dia."
                  />
                  <div className="mt-5 space-y-4 text-sm">
                    <div className="flex items-center justify-between gap-4 border-b border-[#30333a] pb-3">
                      <span className="text-[#aeb5bf]">Saldo real</span>
                      <span className="font-semibold text-[#f7f9fb]">{money.format(netProfit)}</span>
                    </div>
                    <div className="flex items-center justify-between gap-4 border-b border-[#30333a] pb-3">
                      <span className="text-[#aeb5bf]">Por cobrar</span>
                      <span className="font-semibold text-[#ffe06b]">{money.format(pendingIncome)}</span>
                    </div>
                    <div className="flex items-center justify-between gap-4 border-b border-[#30333a] pb-3">
                      <span className="text-[#aeb5bf]">Por pagar</span>
                      <span className="font-semibold text-[#ffe06b]">
                        {money.format(totalPendingExpenses)}
                      </span>
                    </div>
                    <div className="flex items-center justify-between gap-4 border-b border-[#30333a] pb-3">
                      <span className="text-[#aeb5bf]">Pagado</span>
                      <span className="font-semibold text-[#ff8aa1]">{money.format(paidExpenses)}</span>
                    </div>
                    <div className="flex items-center justify-between gap-4 border-b border-[#30333a] pb-3">
                      <span className="text-[#aeb5bf]">Traslados internos</span>
                      <span className="font-semibold text-[#70d6ff]">
                        {money.format(cashTransferVolume)}
                      </span>
                    </div>
                    <div className="flex items-center justify-between gap-4 border-b border-[#30333a] pb-3">
                      <span className="text-[#aeb5bf]">Prestado pendiente</span>
                      <span
                        className={[
                          "font-semibold",
                          loanedBalance > 0 ? "text-[#ffe06b]" : "text-[#71f2d8]",
                        ].join(" ")}
                      >
                        {money.format(Math.max(loanedBalance, 0))}
                      </span>
                    </div>
                    <div className="flex items-center justify-between gap-4">
                      <span className="text-[#aeb5bf]">Saldo proyectado</span>
                      <span className="font-semibold text-[#70d6ff]">
                        {money.format(projectedProfit)}
                      </span>
                    </div>
                  </div>
                </div>

                <div ref={cashTransferFormRef} className="scroll-mt-4">
                  <CashTransferForm
                    form={cashTransferForm}
                    submitting={savingCashTransfer}
                    onChange={updateCashTransferForm}
                    onSubmit={addCashTransfer}
                  />
                </div>
                <div ref={loanMovementFormRef} className="scroll-mt-4">
                  <LoanMovementForm
                    form={loanMovementForm}
                    submitting={savingLoanMovement}
                    onChange={updateLoanMovementForm}
                    onSubmit={addLoanMovement}
                  />
                </div>
              </div>
            </section>
          ) : null}

          {activeSection === "servicios" ? (
            <section className="mt-6">
              <div className="min-w-0 rounded-lg border border-[#30333a] bg-[#181a1e] p-4">
                <SectionTitle
                  label="Servicios"
                  title="Catalogo base"
                  description="Precios de referencia con costo estimado para entender margen antes de vender."
                />
                <div className="mt-5 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
                  {serviceCatalog.map((service) => {
                    const profit = service.price - service.cost;
                    const serviceMargin = service.price > 0 ? (profit / service.price) * 100 : 0;

                    return (
                      <article
                        key={service.name}
                        className="rounded-lg border border-[#30333a] bg-[#101113] p-4"
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <p className="text-lg font-semibold text-[#f7f9fb]">{service.name}</p>
                            <p className="mt-1 text-sm text-[#aeb5bf]">
                              {service.category} - {service.duration}
                            </p>
                          </div>
                          <span className="rounded-md bg-[#24352f] px-2 py-1 text-xs font-semibold text-[#71f2d8]">
                            {service.demand}
                          </span>
                        </div>
                        <div className="mt-5 grid grid-cols-3 gap-2 text-sm">
                          <div>
                            <p className="text-[#aeb5bf]">Precio</p>
                            <p className="mt-1 font-semibold text-[#f7f9fb]">
                              {money.format(service.price)}
                            </p>
                          </div>
                          <div>
                            <p className="text-[#aeb5bf]">Costo</p>
                            <p className="mt-1 font-semibold text-[#ff8aa1]">
                              {money.format(service.cost)}
                            </p>
                          </div>
                          <div>
                            <p className="text-[#aeb5bf]">Margen</p>
                            <p className="mt-1 font-semibold text-[#f7d84a]">
                              {serviceMargin.toFixed(0)}%
                            </p>
                          </div>
                        </div>
                        <button
                          onClick={() => startIncomeFromService(service)}
                          className="mt-5 w-full rounded-lg border border-[#00c2a8] px-3 py-2 text-sm font-semibold text-[#71f2d8] transition hover:bg-[#0f312e]"
                        >
                          Registrar venta
                        </button>
                      </article>
                    );
                  })}
                </div>
              </div>
            </section>
          ) : null}

          {activeSection === "clientes" ? (
            <section className="mt-6 min-w-0 rounded-lg border border-[#30333a] bg-[#181a1e] p-4">
              <SectionTitle
                label="Clientes"
                title="Historial financiero"
                description="Clientes generados a partir de los ingresos registrados."
              />
              <div className="mt-5 overflow-x-auto rounded-lg border border-[#30333a]">
                <table className="min-w-[720px] w-full text-left text-sm">
                  <thead className="bg-[#111316] text-[#aeb5bf]">
                    <tr>
                      <th className="px-4 py-3 font-medium">Cliente</th>
                      <th className="px-4 py-3 text-right font-medium">Visitas</th>
                      <th className="px-4 py-3 text-right font-medium">Pagado</th>
                      <th className="px-4 py-3 text-right font-medium">Pendiente</th>
                      <th className="px-4 py-3 text-right font-medium">Ultima visita</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#30333a]">
                    {clientRows.map((client) => (
                      <tr key={client.name}>
                        <td className="px-4 py-4 font-medium text-[#f7f9fb]">{client.name}</td>
                        <td className="px-4 py-4 text-right text-[#d8dde3]">{client.visits}</td>
                        <td className="px-4 py-4 text-right text-[#71f2d8]">
                          {money.format(client.paid)}
                        </td>
                        <td className="px-4 py-4 text-right text-[#ffe06b]">
                          {money.format(client.pending)}
                        </td>
                        <td className="px-4 py-4 text-right text-[#d8dde3]">
                          {formatDate(client.lastDate)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>
          ) : null}

          {activeSection === "reportes" ? (
            <section className="mt-6 grid min-w-0 gap-4">
              <div className="min-w-0 rounded-lg border border-[#30333a] bg-[#181a1e] p-4">
                <SectionTitle
                  label="Reportes"
                  title="Resumen mensual"
                  description="Lectura rapida de ingresos, gastos, pendientes y margen por mes."
                />
                <div className="mt-5 overflow-x-auto rounded-lg border border-[#30333a]">
                  <table className="min-w-[760px] w-full text-left text-sm">
                    <thead className="bg-[#111316] text-[#aeb5bf]">
                      <tr>
                        <th className="px-4 py-3 font-medium">Mes</th>
                        <th className="px-4 py-3 text-right font-medium">Ingresos</th>
                        <th className="px-4 py-3 text-right font-medium">Gastos</th>
                        <th className="px-4 py-3 text-right font-medium">Utilidad</th>
                        <th className="px-4 py-3 text-right font-medium">Pendientes</th>
                        <th className="px-4 py-3 text-right font-medium">Margen</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#30333a]">
                      {monthlyReports.map((report) => (
                        <tr key={report.month}>
                          <td className="px-4 py-4 font-medium text-[#f7f9fb]">
                            {formatMonth(report.month)}
                          </td>
                          <td className="px-4 py-4 text-right text-[#71f2d8]">
                            {money.format(report.income)}
                          </td>
                          <td className="px-4 py-4 text-right text-[#ff8aa1]">
                            {money.format(report.expenses)}
                          </td>
                          <td className="px-4 py-4 text-right font-semibold text-[#f7f9fb]">
                            {money.format(report.profit)}
                          </td>
                          <td className="px-4 py-4 text-right text-[#ffe06b]">
                            {money.format(report.pending)}
                          </td>
                          <td className="px-4 py-4 text-right text-[#70d6ff]">
                            {report.margin.toFixed(1)}%
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              <div className="min-w-0 rounded-lg border border-[#30333a] bg-[#181a1e] p-4">
                <SectionTitle
                  label={formatMonth(selectedMonth)}
                  title="Detalle por categoria"
                  description="Montos del mes seleccionado para revisar gastos, prestamos y pendientes."
                />
                <div className="mt-5 grid min-w-0 gap-4 md:grid-cols-2">
                  <div className="min-w-0 rounded-lg border border-[#30333a] bg-[#101113] p-4">
                    <h3 className="text-base font-semibold text-[#f7f9fb]">Gastos pagados</h3>
                    <div className="mt-4">
                      <BreakdownList
                        items={expenseBreakdown}
                        emptyMessage="No hay gastos pagados por categoria en este mes."
                      />
                    </div>
                  </div>
                  <div className="min-w-0 rounded-lg border border-[#30333a] bg-[#101113] p-4">
                    <h3 className="text-base font-semibold text-[#f7f9fb]">Prestado pendiente</h3>
                    <div className="mt-4">
                      <BreakdownList
                        items={loanBreakdown}
                        emptyMessage="No hay dinero prestado pendiente en este mes."
                      />
                    </div>
                  </div>
                  <div className="min-w-0 rounded-lg border border-[#30333a] bg-[#101113] p-4">
                    <h3 className="text-base font-semibold text-[#f7f9fb]">Por pagar</h3>
                    <div className="mt-4">
                      <BreakdownList
                        items={pendingExpenseBreakdown}
                        emptyMessage="No hay gastos por pagar en este mes."
                      />
                    </div>
                  </div>
                  <div className="min-w-0 rounded-lg border border-[#30333a] bg-[#101113] p-4">
                    <h3 className="text-base font-semibold text-[#f7f9fb]">Por cobrar</h3>
                    <div className="mt-4">
                      <BreakdownList
                        items={pendingIncomeBreakdown}
                        emptyMessage="No hay ingresos por cobrar en este mes."
                      />
                    </div>
                  </div>
                </div>
              </div>
            </section>
          ) : null}
        </main>
      </div>

      {collectionTarget ? (
        <div className="fixed inset-0 z-40 flex items-end bg-black/70 p-4 sm:items-center sm:justify-center">
          <div className="w-full max-w-md rounded-lg border border-[#30333a] bg-[#181a1e] p-4 shadow-2xl shadow-black/40">
            <p className="text-sm font-semibold text-[#00c2a8]">Cobro de credito</p>
            <h2 className="mt-1 text-2xl font-semibold text-[#f7f9fb]">Marcar como cobrado</h2>
            <p className="mt-2 text-sm leading-6 text-[#aeb5bf]">
              {collectionTarget.contact || "Cliente"} cancelo{" "}
              <span className="font-semibold text-[#f7f9fb]">
                {money.format(collectionTarget.amount)}
              </span>{" "}
              por {collectionTarget.concept}.
            </p>

            <label className="mt-5 block">
              <span className="text-sm text-[#c7ced6]">Metodo recibido</span>
              <select
                value={collectionMethod}
                onChange={(event) => setCollectionMethod(event.target.value)}
                className="mt-2 w-full rounded-lg border border-[#3a3f48] bg-[#101113] px-3 py-3 text-base text-[#f7f9fb] outline-none transition focus:border-[#00c2a8] sm:py-2 sm:text-sm"
              >
                {collectionPaymentMethods.map((method) => (
                  <option key={method} value={method}>
                    {method}
                  </option>
                ))}
              </select>
            </label>

            <div className="mt-5 grid gap-2 sm:grid-cols-2">
              <button
                type="button"
                onClick={collectPendingIncome}
                disabled={collectingId === collectionTarget.id}
                className="rounded-lg bg-[#00c2a8] px-4 py-3 text-sm font-semibold text-[#081210] transition hover:bg-[#27dcc4] disabled:cursor-not-allowed disabled:opacity-60"
              >
                {collectingId === collectionTarget.id ? "Cobrando..." : "Confirmar cobro"}
              </button>
              <button
                type="button"
                onClick={() => setCollectionTarget(null)}
                disabled={collectingId === collectionTarget.id}
                className="rounded-lg border border-[#454b55] px-4 py-3 text-sm font-semibold text-[#d8dde3] transition hover:border-[#70d6ff] disabled:cursor-not-allowed disabled:opacity-60"
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {expensePaymentDialogOpen ? (
        <ExpensePaymentDialog
          form={expensePaymentForm}
          pendingTotal={totalPendingExpenses}
          submitting={savingExpensePayment}
          onChange={updateExpensePaymentForm}
          onSubmit={addExpensePayment}
          onClose={() => setExpensePaymentDialogOpen(false)}
        />
      ) : null}

      <nav className="fixed inset-x-0 bottom-0 z-30 border-t border-[#30333a] bg-[#15171a]/95 px-2 pb-[calc(env(safe-area-inset-bottom)+0.5rem)] pt-2 shadow-[0_-12px_30px_rgba(0,0,0,0.35)] backdrop-blur lg:hidden">
        <div className="mx-auto grid max-w-md grid-cols-4 gap-2">
          {mobileNavItems.map((item) => {
            const isActive = activeSection === item.id;

            return (
              <button
                key={item.id}
                onClick={() => handleMobileNavigation(item.id)}
                className={[
                  "rounded-lg border px-2 py-2.5 text-xs font-semibold transition",
                  isActive
                    ? "border-[#00c2a8] bg-[#0f312e] text-[#71f2d8]"
                    : "border-[#30333a] bg-[#181a1e] text-[#c7ced6]",
                ].join(" ")}
              >
                {item.label}
              </button>
            );
          })}
        </div>
      </nav>
    </div>
  );
}
