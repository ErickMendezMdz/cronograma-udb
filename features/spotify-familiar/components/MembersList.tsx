import type { MutableRefObject } from "react";
import type { SpotifyMember, SpotifyPayment } from "@/features/spotify-familiar/types";
import {
  currentMonthISO,
  findFirstPaymentMonth,
  formatMonth,
  getMemberDebt,
  getMonthStatus,
  getPaidAmount,
  money,
} from "@/features/spotify-familiar/hooks/useSpotifyFamily";

type MembersListProps = {
  members: SpotifyMember[];
  paymentsByMonth: Map<string, SpotifyPayment>;
  matrixMonths: string[];
  memberMatrixRefs: MutableRefObject<Map<string, HTMLElement>>;
  savingPaymentFor: string | null;
  deletingMemberId: string | null;
  quickPay: (member: SpotifyMember, months?: number) => Promise<void>;
  openPaymentDraft: (member: SpotifyMember, months?: number) => void;
  openMemberDraft: (member: SpotifyMember) => void;
  deleteMember: (member: SpotifyMember) => Promise<void>;
};

export function MembersList({
  members,
  paymentsByMonth,
  matrixMonths,
  memberMatrixRefs,
  savingPaymentFor,
  deletingMemberId,
  quickPay,
  openPaymentDraft,
  openMemberDraft,
  deleteMember,
}: MembersListProps) {
  if (members.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-slate-700 bg-slate-900 p-5 text-sm text-slate-400">
        Agrega una persona para empezar a registrar pagos.
      </div>
    );
  }

  return (
    <>
      {members.map((member) => {
        const debt = getMemberDebt(member, paymentsByMonth);
        const nextMonth = findFirstPaymentMonth(member, paymentsByMonth);

        return (
          <article
            key={member.id}
            ref={(node) => {
              if (node) {
                memberMatrixRefs.current.set(member.id, node);
              } else {
                memberMatrixRefs.current.delete(member.id);
              }
            }}
            className="scroll-mt-4 rounded-2xl border border-slate-800 bg-slate-900 p-4"
          >
            <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <h3 className="text-xl font-semibold text-slate-100">
                    {member.name}
                  </h3>
                  {!member.active ? (
                    <span className="rounded-lg bg-slate-800 px-2 py-1 text-xs font-semibold text-slate-400">
                      Inactiva
                    </span>
                  ) : null}
                </div>
                {debt.pendingMonths.length > 0 ? (
                  <p className="mt-2 text-sm text-red-300">
                    Debe {money.format(debt.total)}:{" "}
                    {debt.pendingMonths.map(formatMonth).join(", ")}
                  </p>
                ) : (
                  <p className="mt-2 text-sm text-emerald-300">Va al dia</p>
                )}
              </div>
            </div>

            <div className="mt-4 grid grid-cols-3 gap-2 sm:grid-cols-4 lg:grid-cols-6 xl:grid-cols-12">
              {matrixMonths.map((month) => {
                const status = getMonthStatus(member, month, paymentsByMonth);
                const paid = getPaidAmount(paymentsByMonth, member.id, month);
                const classes =
                  status === "paid"
                    ? "border-emerald-500/40 bg-emerald-500/20 text-emerald-100"
                    : status === "partial"
                      ? "border-amber-500/40 bg-amber-500/20 text-amber-100"
                      : status === "pending"
                        ? "border-red-500/40 bg-red-500/20 text-red-100"
                        : "border-slate-800 bg-slate-950 text-slate-500";

                return (
                  <div
                    key={month}
                    className={["min-h-20 rounded-xl border p-2 text-center", classes].join(" ")}
                  >
                    <p className="text-xs font-semibold capitalize">
                      {formatMonth(month)}
                    </p>
                    <p className="mt-2 text-xs font-semibold">
                      {status === "paid"
                        ? "Pagado"
                        : status === "partial"
                          ? "Parcial"
                          : status === "pending"
                            ? "Pendiente"
                            : month > currentMonthISO()
                              ? "Futuro"
                              : "N/A"}
                    </p>
                    {paid > 0 ? (
                      <p className="mt-1 text-xs">{money.format(paid)}</p>
                    ) : null}
                  </div>
                );
              })}
            </div>
            <p className="mt-3 text-xs text-slate-500">
              Siguiente aplicacion automatica: {formatMonth(nextMonth)}
            </p>
            <div className="mt-4 grid grid-cols-2 gap-2 sm:flex sm:flex-wrap">
              <button
                onClick={() => quickPay(member)}
                disabled={savingPaymentFor === member.id || !member.active}
                className="rounded-xl bg-green-500 px-3 py-2 text-xs font-semibold text-slate-950 disabled:opacity-60"
              >
                {savingPaymentFor === member.id
                  ? "Guardando..."
                  : `Confirmar ${money.format(member.monthlyAmount)}`}
              </button>
              <button
                onClick={() => openPaymentDraft(member, 2)}
                disabled={!member.active}
                className="rounded-xl border border-slate-700 px-3 py-2 text-xs font-semibold text-slate-200 hover:bg-slate-800 disabled:opacity-60"
              >
                +2 meses
              </button>
              <button
                onClick={() => openPaymentDraft(member)}
                disabled={!member.active}
                className="rounded-xl border border-slate-700 px-3 py-2 text-xs font-semibold text-slate-200 hover:bg-slate-800 disabled:opacity-60"
              >
                Modificar pago
              </button>
              <button
                onClick={() => openMemberDraft(member)}
                className="rounded-xl border border-slate-700 px-3 py-2 text-xs font-semibold text-slate-200 hover:bg-slate-800"
              >
                Editar persona
              </button>
              <button
                onClick={() => deleteMember(member)}
                disabled={deletingMemberId === member.id}
                className="rounded-xl border border-red-500/40 px-3 py-2 text-xs font-semibold text-red-200 hover:bg-red-500/10 disabled:opacity-60 sm:col-span-2"
              >
                {deletingMemberId === member.id ? "Eliminando..." : "Eliminar"}
              </button>
            </div>
          </article>
        );
      })}
    </>
  );
}
