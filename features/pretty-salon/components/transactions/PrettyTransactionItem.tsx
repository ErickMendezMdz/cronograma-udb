import type { SalonTransaction } from "@/features/pretty-salon/types";
import { formatDate, getStatusLabel, money } from "@/features/pretty-salon/utils";

type PrettyTransactionItemProps = {
  transaction: SalonTransaction;
  onDelete: (id: string) => void | Promise<void>;
  onCollect: (transaction: SalonTransaction) => void;
  onPayExpense: () => void;
  expensePaidAmount?: number;
  deletingId?: string | null;
  collectingId?: string | null;
};

export function PrettyTransactionItem({
  transaction,
  onDelete,
  onCollect,
  onPayExpense,
  expensePaidAmount = 0,
  deletingId,
  collectingId,
}: PrettyTransactionItemProps) {
  const canCollect = transaction.kind === "income" && transaction.status === "pending";
  const expensePendingAmount = Math.max(transaction.amount - expensePaidAmount, 0);
  const canPayExpense =
    transaction.kind === "expense" &&
    transaction.status === "pending" &&
    expensePendingAmount > 0;
  const isExpensePaid =
    transaction.kind === "expense" &&
    transaction.status === "pending" &&
    expensePendingAmount <= 0;
  const isExpensePartial =
    transaction.kind === "expense" && expensePaidAmount > 0 && expensePendingAmount > 0;
  const isCollecting = collectingId === transaction.id;
  const isDeleting = deletingId === transaction.id;

  return (
    <article className="min-w-0 rounded-lg border border-[#30333a] bg-[#101113] p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="break-words text-base font-semibold text-[#f7f9fb]">
            {transaction.concept}
          </p>
          <p className="mt-1 text-xs text-[#aeb5bf]">
            {formatDate(transaction.date)} · {transaction.category}
          </p>
        </div>
        <p
          className={[
            "shrink-0 text-right text-lg font-semibold tabular-nums",
            transaction.kind === "income" ? "text-[#71f2d8]" : "text-[#ff8aa1]",
          ].join(" ")}
        >
          {transaction.kind === "income" ? "+" : "-"}
          {money.format(transaction.amount)}
        </p>
      </div>

      <div className="mt-4 grid grid-cols-2 gap-2 text-xs">
        <div className="rounded-md bg-[#181a1e] px-3 py-2">
          <p className="text-[#8f98a5]">Contacto</p>
          <p className="mt-1 truncate text-[#d8dde3]">
            {transaction.contact || "Sin contacto"}
          </p>
        </div>
        <div className="rounded-md bg-[#181a1e] px-3 py-2">
          <p className="text-[#8f98a5]">Metodo</p>
          <p className="mt-1 truncate text-[#d8dde3]">{transaction.paymentMethod}</p>
        </div>
      </div>

      <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
        <span
          className={[
            "inline-flex rounded-md px-2 py-1 text-xs font-semibold",
            transaction.status === "paid" || isExpensePaid
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
              : getStatusLabel(transaction.status, transaction.kind)}
        </span>
        <div className="ml-auto flex flex-wrap justify-end gap-2">
          {canCollect ? (
            <button
              onClick={() => onCollect(transaction)}
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
            onClick={() => onDelete(transaction.id)}
            disabled={isDeleting || isCollecting}
            className="rounded-md border border-[#454b55] px-3 py-2 text-xs font-semibold text-[#d8dde3] transition hover:border-[#ff5f7e] hover:text-[#ff8aa1] disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isDeleting ? "Eliminando..." : "Eliminar"}
          </button>
        </div>
      </div>

      {isExpensePartial ? (
        <p className="mt-3 text-xs leading-5 text-[#aeb5bf]">
          Abonado {money.format(expensePaidAmount)} de {money.format(transaction.amount)}.
          Pendiente {money.format(expensePendingAmount)}.
        </p>
      ) : null}

      {transaction.notes ? (
        <p className="mt-3 whitespace-pre-line text-xs leading-5 text-[#aeb5bf]">
          {transaction.notes}
        </p>
      ) : null}
    </article>
  );
}
