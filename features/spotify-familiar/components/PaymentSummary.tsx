import type { PaymentSummaryTotals } from "@/features/spotify-familiar/types";
import { money } from "@/features/spotify-familiar/hooks/useSpotifyFamily";

type PaymentSummaryProps = {
  totals: PaymentSummaryTotals;
};

export function PaymentSummary({ totals }: PaymentSummaryProps) {
  return (
    <section className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      <div className="rounded-2xl border border-green-500/30 bg-green-500/10 p-5">
        <p className="text-sm uppercase tracking-[0.2em] text-green-300">
          Pagado
        </p>
        <p className="mt-4 text-3xl font-semibold text-green-100">
          {money.format(totals.paid)}
        </p>
      </div>
      <div className="rounded-2xl border border-red-500/30 bg-red-500/10 p-5">
        <p className="text-sm uppercase tracking-[0.2em] text-red-300">
          Pendiente
        </p>
        <p className="mt-4 text-3xl font-semibold text-red-100">
          {money.format(totals.debt)}
        </p>
      </div>
      <div className="rounded-2xl border border-slate-800 bg-slate-950 p-5">
        <p className="text-sm uppercase tracking-[0.2em] text-slate-400">
          Esperado
        </p>
        <p className="mt-4 text-3xl font-semibold">
          {money.format(totals.expected)}
        </p>
      </div>
      <div className="rounded-2xl border border-slate-800 bg-slate-950 p-5">
        <p className="text-sm uppercase tracking-[0.2em] text-slate-400">
          Activos
        </p>
        <p className="mt-4 text-3xl font-semibold">{totals.activeMembers}</p>
      </div>
    </section>
  );
}
