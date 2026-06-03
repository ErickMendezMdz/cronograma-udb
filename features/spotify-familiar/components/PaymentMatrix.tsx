import type { MutableRefObject } from "react";
import { MembersList } from "@/features/spotify-familiar/components/MembersList";
import type { SpotifyMember, SpotifyPayment } from "@/features/spotify-familiar/types";

type PaymentMatrixProps = {
  members: SpotifyMember[];
  paymentsByMonth: Map<string, SpotifyPayment>;
  matrixMonths: string[];
  yearOptions: string[];
  selectedYear: string;
  setSelectedYear: (year: string) => void;
  memberMatrixRefs: MutableRefObject<Map<string, HTMLElement>>;
  savingPaymentFor: string | null;
  deletingMemberId: string | null;
  quickPay: (member: SpotifyMember, months?: number) => Promise<void>;
  openPaymentDraft: (member: SpotifyMember, months?: number) => void;
  openMemberDraft: (member: SpotifyMember) => void;
  deleteMember: (member: SpotifyMember) => Promise<void>;
};

export function PaymentMatrix({
  members,
  paymentsByMonth,
  matrixMonths,
  yearOptions,
  selectedYear,
  setSelectedYear,
  memberMatrixRefs,
  savingPaymentFor,
  deletingMemberId,
  quickPay,
  openPaymentDraft,
  openMemberDraft,
  deleteMember,
}: PaymentMatrixProps) {
  return (
    <section className="mt-6 rounded-2xl border border-slate-800 bg-slate-950 p-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-sm font-semibold text-green-400">Matriz</p>
          <h2 className="mt-1 text-2xl font-semibold">Pagos por mes</h2>
        </div>
        <label className="block">
          <span className="text-sm text-slate-400">Ano</span>
          <select
            value={selectedYear}
            onChange={(event) => setSelectedYear(event.target.value)}
            className="mt-2 w-full rounded-xl border border-slate-700 bg-slate-900 px-3 py-2 text-slate-100 outline-none focus:border-green-400 sm:w-40"
          >
            {yearOptions.map((year) => (
              <option key={year} value={year}>
                {year}
              </option>
            ))}
          </select>
        </label>
      </div>

      <div className="mt-5 grid gap-4">
        <MembersList
          members={members}
          paymentsByMonth={paymentsByMonth}
          matrixMonths={matrixMonths}
          memberMatrixRefs={memberMatrixRefs}
          savingPaymentFor={savingPaymentFor}
          deletingMemberId={deletingMemberId}
          quickPay={quickPay}
          openPaymentDraft={openPaymentDraft}
          openMemberDraft={openMemberDraft}
          deleteMember={deleteMember}
        />
      </div>
    </section>
  );
}
