import type { SalonTransaction } from "@/features/pretty-salon/types";
import { PrettyEmptyState } from "@/features/pretty-salon/components/shared/PrettyEmptyState";
import { PrettyTransactionItem } from "@/features/pretty-salon/components/transactions/PrettyTransactionItem";

type PrettyTransactionsListProps = {
  transactions: SalonTransaction[];
  emptyMessage: string;
  onDelete: (id: string) => void | Promise<void>;
  onCollect: (transaction: SalonTransaction) => void;
  onPayExpense: () => void;
  expensePaidAmounts?: Map<string, number>;
  deletingId?: string | null;
  collectingId?: string | null;
};

export function PrettyTransactionsList({
  transactions,
  emptyMessage,
  onDelete,
  onCollect,
  onPayExpense,
  expensePaidAmounts,
  deletingId,
  collectingId,
}: PrettyTransactionsListProps) {
  if (transactions.length === 0) {
    return <PrettyEmptyState message={emptyMessage} />;
  }

  return (
    <div className="grid gap-3 lg:grid-cols-2">
      {transactions.map((item) => (
        <PrettyTransactionItem
          key={item.id}
          transaction={item}
          onDelete={onDelete}
          onCollect={onCollect}
          onPayExpense={onPayExpense}
          expensePaidAmount={item.kind === "expense" ? (expensePaidAmounts?.get(item.id) ?? 0) : 0}
          deletingId={deletingId}
          collectingId={collectingId}
        />
      ))}
    </div>
  );
}
