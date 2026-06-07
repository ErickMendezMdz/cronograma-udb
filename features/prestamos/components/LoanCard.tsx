import type { PersonalLoan } from "@/features/prestamos/types";

type LoanCardProps = {
  loan: PersonalLoan;
  working: boolean;
  onEdit?: (loan: PersonalLoan) => void;
  onReturned?: (id: string) => void;
  onRestore?: (id: string) => void;
  onDelete: (id: string) => void;
};

function formatDate(value: string) {
  return new Date(`${value}T00:00:00`).toLocaleDateString("es-SV", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function formatReturnedAt(value: string | null) {
  if (!value) return "";
  return new Date(value).toLocaleDateString("es-SV", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

export function LoanCard({
  loan,
  working,
  onEdit,
  onReturned,
  onRestore,
  onDelete,
}: LoanCardProps) {
  const isReturned = loan.status === "returned";

  return (
    <article className="rounded-2xl border border-slate-700 bg-slate-950/70 p-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="break-words text-lg font-semibold text-slate-100">{loan.itemName}</p>
          <p className="mt-1 text-sm text-slate-400">
            Lo tiene <span className="font-semibold text-slate-200">{loan.borrowerName}</span>
          </p>
        </div>
        <span
          className={[
            "rounded-full px-3 py-1 text-xs font-semibold",
            loan.category === "No lo sé"
              ? "bg-amber-500/15 text-amber-200"
              : "bg-blue-500/15 text-blue-200",
          ].join(" ")}
        >
          {loan.category}
        </span>
      </div>

      <div className="mt-4 grid gap-2 text-sm text-slate-400 sm:grid-cols-2">
        <p>
          Prestado: <span className="text-slate-200">{formatDate(loan.loanDate)}</span>
        </p>
        {isReturned ? (
          <p>
            Devuelto:{" "}
            <span className="text-slate-200">{formatReturnedAt(loan.returnedAt)}</span>
          </p>
        ) : null}
      </div>

      {loan.notes ? (
        <p className="mt-3 whitespace-pre-line text-sm leading-6 text-slate-400">
          {loan.notes}
        </p>
      ) : null}

      <div className="mt-4 flex flex-wrap gap-2">
        {!isReturned && onReturned ? (
          <button
            onClick={() => onReturned(loan.id)}
            disabled={working}
            className="rounded-xl bg-emerald-500 px-3 py-2 text-sm font-semibold text-slate-950 transition hover:bg-emerald-400 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {working ? "Guardando..." : "Marcar devuelto"}
          </button>
        ) : null}
        {!isReturned && onEdit ? (
          <button
            onClick={() => onEdit(loan)}
            disabled={working}
            className="rounded-xl border border-slate-700 px-3 py-2 text-sm font-semibold text-slate-300 transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
          >
            Editar
          </button>
        ) : null}
        {isReturned && onRestore ? (
          <button
            onClick={() => onRestore(loan.id)}
            disabled={working}
            className="rounded-xl border border-blue-500/60 px-3 py-2 text-sm font-semibold text-blue-200 transition hover:bg-blue-500/10 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {working ? "Restaurando..." : "Restaurar como prestado"}
          </button>
        ) : null}
        <button
          onClick={() => onDelete(loan.id)}
          disabled={working}
          className="rounded-xl border border-red-900/70 px-3 py-2 text-sm font-semibold text-red-100 transition hover:bg-red-950/50 disabled:cursor-not-allowed disabled:opacity-60"
        >
          Eliminar
        </button>
      </div>
    </article>
  );
}
