import type { SalonExpensePayment } from "@/features/pretty-salon/types";
import { formatDate, isDonationPayment, money } from "@/features/pretty-salon/utils";

type PrettyExpensePaymentsTableProps = {
  payments: SalonExpensePayment[];
  deletingId?: string | null;
  onDelete: (id: string) => void | Promise<void>;
};

export function PrettyExpensePaymentsTable({
  payments,
  deletingId,
  onDelete,
}: PrettyExpensePaymentsTableProps) {
  return (
    <div className="mt-5 overflow-x-auto rounded-lg border border-[#30333a]">
      <table className="min-w-[640px] w-full text-left text-sm">
        <thead className="bg-[#111316] text-[#aeb5bf]">
          <tr>
            <th className="px-4 py-3 font-medium">Fecha</th>
            <th className="px-4 py-3 font-medium">Metodo</th>
            <th className="px-4 py-3 text-right font-medium">Monto</th>
            <th className="px-4 py-3 font-medium">Notas</th>
            <th className="px-4 py-3 text-right font-medium">Accion</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-[#30333a]">
          {payments.length === 0 ? (
            <tr>
              <td colSpan={5} className="px-4 py-6 text-center text-[#aeb5bf]">
                Aun no hay abonos o donaciones en este mes.
              </td>
            </tr>
          ) : (
            payments.map((item) => (
              <tr key={item.id} className="align-top">
                <td className="px-4 py-4 text-[#d8dde3]">{formatDate(item.date)}</td>
                <td className="px-4 py-4 text-[#d8dde3]">{item.paymentMethod}</td>
                <td
                  className={[
                    "px-4 py-4 text-right font-semibold",
                    isDonationPayment(item.paymentMethod) ? "text-[#70d6ff]" : "text-[#ff8aa1]",
                  ].join(" ")}
                >
                  {money.format(item.amount)}
                </td>
                <td className="px-4 py-4 text-[#aeb5bf]">
                  {item.notes ||
                    (isDonationPayment(item.paymentMethod)
                      ? "Donacion aplicada a deuda mas antigua"
                      : "Aplicado a deuda mas antigua")}
                </td>
                <td className="px-4 py-4 text-right">
                  <button
                    onClick={() => onDelete(item.id)}
                    disabled={deletingId === item.id}
                    className="rounded-md border border-[#454b55] px-3 py-1.5 text-xs font-semibold text-[#d8dde3] transition hover:border-[#ff5f7e] hover:text-[#ff8aa1] disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {deletingId === item.id ? "Eliminando..." : "Eliminar"}
                  </button>
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}
