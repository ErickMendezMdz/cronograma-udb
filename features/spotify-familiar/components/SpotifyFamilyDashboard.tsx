"use client";

import { Button } from "@/components/ui/Button";
import { MemberForm } from "@/features/spotify-familiar/components/MemberForm";
import { PaymentForm } from "@/features/spotify-familiar/components/PaymentForm";
import { PaymentMatrix } from "@/features/spotify-familiar/components/PaymentMatrix";
import { PaymentSummary } from "@/features/spotify-familiar/components/PaymentSummary";
import { PendingMonthsList } from "@/features/spotify-familiar/components/PendingMonthsList";
import { useSpotifyFamily } from "@/features/spotify-familiar/hooks/useSpotifyFamily";
import {
  formatDate,
  formatMonth,
  money,
} from "@/features/spotify-familiar/hooks/useSpotifyFamily";
import type {
  SpotifyMember,
  SpotifyPayment,
} from "@/features/spotify-familiar/types";

type PaymentHistoryProps = {
  payments: SpotifyPayment[];
  members: SpotifyMember[];
  deletingPaymentId: string | null;
  deletePayment: (paymentId: string) => Promise<void>;
};

function PaymentHistory({
  payments,
  members,
  deletingPaymentId,
  deletePayment,
}: PaymentHistoryProps) {
  return (
    <div className="rounded-2xl border border-slate-800 bg-slate-950 p-4">
      <h2 className="text-xl font-semibold">Historial de pagos</h2>
      <div className="mt-5 overflow-x-auto rounded-xl border border-slate-800">
        <table className="min-w-[760px] w-full text-left text-sm">
          <thead className="bg-slate-900 text-slate-400">
            <tr>
              <th className="px-4 py-3 font-medium">Fecha</th>
              <th className="px-4 py-3 font-medium">Persona</th>
              <th className="px-4 py-3 font-medium">Mes aplicado</th>
              <th className="px-4 py-3 text-right font-medium">Monto</th>
              <th className="px-4 py-3 font-medium">Metodo</th>
              <th className="px-4 py-3 text-right font-medium">Accion</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800">
            {payments.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-slate-400">
                  Aun no hay pagos registrados.
                </td>
              </tr>
            ) : (
              payments.map((payment) => {
                const member = members.find((item) => item.id === payment.memberId);

                return (
                  <tr key={payment.id}>
                    <td className="px-4 py-4 text-slate-300">
                      {formatDate(payment.paymentDate)}
                    </td>
                    <td className="px-4 py-4 font-medium text-slate-100">
                      {member?.name ?? "Persona eliminada"}
                    </td>
                    <td className="px-4 py-4 text-slate-300">
                      {formatMonth(payment.billingMonth)}
                    </td>
                    <td className="px-4 py-4 text-right font-semibold text-emerald-300">
                      {money.format(payment.amount)}
                    </td>
                    <td className="px-4 py-4 text-slate-300">
                      {payment.paymentMethod}
                    </td>
                    <td className="px-4 py-4 text-right">
                      <button
                        onClick={() => deletePayment(payment.id)}
                        disabled={deletingPaymentId === payment.id}
                        className="rounded-lg border border-slate-700 px-3 py-1.5 text-xs font-semibold text-slate-200 hover:border-red-400 hover:text-red-200 disabled:opacity-60"
                      >
                        {deletingPaymentId === payment.id
                          ? "Eliminando..."
                          : "Eliminar"}
                      </button>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export function SpotifyFamilyDashboard() {
  const spotifyFamily = useSpotifyFamily();

  if (spotifyFamily.checking) {
    return (
      <div className="flex min-h-screen items-center justify-center text-slate-300">
        Cargando...
      </div>
    );
  }

  if (!spotifyFamily.supabase) {
    return (
      <div className="flex min-h-screen items-center justify-center p-4">
        <div className="w-full max-w-lg rounded-2xl border border-red-900 bg-slate-900/90 p-6 shadow-2xl shadow-black/30">
          <h1 className="text-xl font-semibold text-slate-100">
            Configuracion incompleta
          </h1>
          <p className="mt-2 text-sm text-slate-300">
            {spotifyFamily.configError ??
              "Faltan las variables publicas de Supabase."}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="text-slate-100">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <div className="flex flex-wrap items-center gap-3 text-sm text-slate-400">
            <span>
              {spotifyFamily.email
                ? `Sesion: ${spotifyFamily.email}`
                : "Spotify Familiar"}
            </span>
          </div>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-400">
            Control mensual de pagos compartidos, con matriz de meses y pago
            rapido al pendiente mas antiguo.
          </p>
        </div>

        <Button onClick={spotifyFamily.handleLogout} variant="secondary">
          Salir
        </Button>
      </div>

      {spotifyFamily.loadingData ? (
        <div className="mt-5 rounded-xl border border-slate-800 bg-slate-950 px-4 py-3 text-sm text-slate-400">
          Sincronizando Spotify Familiar...
        </div>
      ) : null}

      {spotifyFamily.loadError ? (
        <div className="mt-5 rounded-xl border border-red-500/50 bg-red-950/40 p-4 text-sm text-red-100">
          {spotifyFamily.loadError}
        </div>
      ) : null}

      <PaymentSummary totals={spotifyFamily.summaryTotals} />

      <PendingMonthsList
        members={spotifyFamily.sortedMembers}
        paymentsByMonth={spotifyFamily.paymentsByMonth}
        scrollToMemberMatrix={spotifyFamily.scrollToMemberMatrix}
      />

      <PaymentMatrix
        members={spotifyFamily.sortedMembers}
        paymentsByMonth={spotifyFamily.paymentsByMonth}
        matrixMonths={spotifyFamily.matrixMonths}
        yearOptions={spotifyFamily.yearOptions}
        selectedYear={spotifyFamily.selectedYear}
        setSelectedYear={spotifyFamily.setSelectedYear}
        memberMatrixRefs={spotifyFamily.memberMatrixRefs}
        savingPaymentFor={spotifyFamily.savingPaymentFor}
        deletingMemberId={spotifyFamily.deletingMemberId}
        quickPay={spotifyFamily.quickPay}
        openPaymentDraft={spotifyFamily.openPaymentDraft}
        openMemberDraft={spotifyFamily.openMemberDraft}
        deleteMember={spotifyFamily.deleteMember}
      />

      <section className="mt-6 grid gap-4 xl:grid-cols-[380px_minmax(0,1fr)]">
        <MemberForm
          newMemberDraft={spotifyFamily.newMemberDraft}
          setNewMemberDraft={spotifyFamily.setNewMemberDraft}
          memberDraft={spotifyFamily.memberDraft}
          setMemberDraft={spotifyFamily.setMemberDraft}
          savingMember={spotifyFamily.savingMember}
          addMember={spotifyFamily.addMember}
          updateMember={spotifyFamily.updateMember}
        />

        <PaymentHistory
          payments={spotifyFamily.sortedPayments}
          members={spotifyFamily.members}
          deletingPaymentId={spotifyFamily.deletingPaymentId}
          deletePayment={spotifyFamily.deletePayment}
        />
      </section>

      <PaymentForm
        paymentDraft={spotifyFamily.paymentDraft}
        setPaymentDraft={spotifyFamily.setPaymentDraft}
        members={spotifyFamily.members}
        savingPaymentFor={spotifyFamily.savingPaymentFor}
        savePayment={spotifyFamily.savePayment}
      />
    </div>
  );
}
