import type { PersonalLoan } from "@/features/prestamos/types";
import { LoanCard } from "@/features/prestamos/components/LoanCard";

type LoanHistoryProps = {
  loans: PersonalLoan[];
  workingId: string | null;
  onRestore: (id: string) => void;
  onDelete: (id: string) => void;
};

export function LoanHistory({
  loans,
  workingId,
  onRestore,
  onDelete,
}: LoanHistoryProps) {
  if (loans.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-slate-700 p-6 text-sm text-slate-400">
        Todavía no hay préstamos devueltos.
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
          onRestore={onRestore}
          onDelete={onDelete}
        />
      ))}
    </div>
  );
}
