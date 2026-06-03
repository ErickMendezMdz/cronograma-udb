import type { SpotifyMember, SpotifyPayment } from "@/features/spotify-familiar/types";
import {
  findFirstPaymentMonth,
  formatMonth,
  getMemberDebt,
  money,
} from "@/features/spotify-familiar/hooks/useSpotifyFamily";

type PendingMonthsListProps = {
  members: SpotifyMember[];
  paymentsByMonth: Map<string, SpotifyPayment>;
  scrollToMemberMatrix: (memberId: string) => void;
};

export function PendingMonthsList({
  members,
  paymentsByMonth,
  scrollToMemberMatrix,
}: PendingMonthsListProps) {
  return (
    <section className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      {members.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-700 bg-slate-950 p-5 text-sm text-slate-400 sm:col-span-2 xl:col-span-4">
          Agrega las personas reales para ver aqui quien debe y quien va al dia.
        </div>
      ) : (
        members.map((member) => {
          const debt = getMemberDebt(member, paymentsByMonth);
          const nextMonth = findFirstPaymentMonth(member, paymentsByMonth);
          const isUpToDate = debt.total <= 0;

          return (
            <button
              type="button"
              key={member.id}
              onClick={() => scrollToMemberMatrix(member.id)}
              className={[
                "rounded-2xl border p-5 text-left transition hover:-translate-y-0.5 focus:outline-none focus:ring-2 focus:ring-green-400",
                isUpToDate
                  ? "border-emerald-500/30 bg-emerald-500/10"
                  : "border-red-500/30 bg-red-500/10",
              ].join(" ")}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="truncate text-lg font-semibold text-slate-100">
                    {member.name}
                  </p>
                  <p className="mt-1 text-xs text-slate-400">
                    {money.format(member.monthlyAmount)} mensual
                  </p>
                </div>
                <span
                  className={[
                    "shrink-0 rounded-lg px-2 py-1 text-xs font-semibold",
                    isUpToDate
                      ? "bg-emerald-500/15 text-emerald-200"
                      : "bg-red-500/15 text-red-200",
                  ].join(" ")}
                >
                  {isUpToDate ? "Al dia" : "Debe"}
                </span>
              </div>
              <p className="mt-4 text-3xl font-semibold">
                {isUpToDate ? "Va al dia" : money.format(debt.total)}
              </p>
              <p className="mt-2 text-sm text-slate-400">
                {isUpToDate
                  ? `Siguiente pago: ${formatMonth(nextMonth)}`
                  : `Pendiente: ${debt.pendingMonths.map(formatMonth).join(", ")}`}
              </p>
              <p className="mt-4 text-xs font-semibold text-green-300">
                Ver matriz
              </p>
            </button>
          );
        })
      )}
    </section>
  );
}
