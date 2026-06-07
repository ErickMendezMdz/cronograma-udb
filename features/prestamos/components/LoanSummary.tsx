import type { LoanSummaryCounts } from "@/features/prestamos/types";

type LoanSummaryProps = {
  counts: LoanSummaryCounts;
};

export function LoanSummary({ counts }: LoanSummaryProps) {
  const items = [
    { label: "Prestadas actualmente", value: counts.activeCount },
    { label: "Personas con préstamos activos", value: counts.activeBorrowersCount },
    { label: "Sin categorizar", value: counts.unknownCount },
    { label: "Devueltos en historial", value: counts.returnedCount },
  ];

  return (
    <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
      {items.map((item) => (
        <article
          key={item.label}
          className="rounded-2xl border border-slate-700 bg-slate-950/60 p-4"
        >
          <p className="text-sm text-slate-400">{item.label}</p>
          <p className="mt-3 text-3xl font-semibold text-slate-100">{item.value}</p>
        </article>
      ))}
    </section>
  );
}
