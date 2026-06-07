import type { PersonalLoan } from "@/features/prestamos/types";
import { LoanCard } from "@/features/prestamos/components/LoanCard";

type LoansListProps = {
  loans: PersonalLoan[];
  emptyMessage: string;
  workingId: string | null;
  onEdit: (loan: PersonalLoan) => void;
  onReturned: (id: string) => void;
  onDelete: (id: string) => void;
};

export function LoansList({
  loans,
  emptyMessage,
  workingId,
  onEdit,
  onReturned,
  onDelete,
}: LoansListProps) {
  if (loans.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-slate-700 p-6 text-sm text-slate-400">
        {emptyMessage}
      </div>
    );
  }

  return (
    <div className="grid gap-3 lg:grid-cols-2">
      {loans.map((loan) => (
        <LoanCard
          key={loan.id}
          loan={loan}
          working={workingId === loan.id}
          onEdit={onEdit}
          onReturned={onReturned}
          onDelete={onDelete}
        />
      ))}
    </div>
  );
}
