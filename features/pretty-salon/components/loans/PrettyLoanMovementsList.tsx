import type { SalonLoanMovement } from "@/features/pretty-salon/types";
import { formatDate, money } from "@/features/pretty-salon/utils";

type PrettyLoanMovementsListProps = {
  movements: SalonLoanMovement[];
  deletingId?: string | null;
  onDelete: (id: string) => void | Promise<void>;
};

export function PrettyLoanMovementsList({
  movements,
  deletingId,
  onDelete,
}: PrettyLoanMovementsListProps) {
  return (
    <div className="mt-5 overflow-x-auto rounded-lg border border-[#30333a]">
      <table className="min-w-[760px] w-full text-left text-sm">
        <thead className="bg-[#111316] text-[#aeb5bf]">
          <tr>
            <th className="px-4 py-3 font-medium">Fecha</th>
            <th className="px-4 py-3 font-medium">Movimiento</th>
            <th className="px-4 py-3 font-medium">Quien</th>
            <th className="px-4 py-3 font-medium">Metodo</th>
            <th className="px-4 py-3 text-right font-medium">Monto</th>
            <th className="px-4 py-3 font-medium">Notas</th>
            <th className="px-4 py-3 text-right font-medium">Accion</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-[#30333a]">
          {movements.length === 0 ? (
            <tr>
              <td colSpan={7} className="px-4 py-6 text-center text-[#aeb5bf]">
                Aun no hay dinero prestado o repuesto en este mes.
              </td>
            </tr>
          ) : (
            movements.map((item) => (
              <tr key={item.id} className="align-top">
                <td className="px-4 py-4 text-[#d8dde3]">{formatDate(item.date)}</td>
                <td
                  className={[
                    "px-4 py-4 font-semibold",
                    item.movementType === "borrow" ? "text-[#ff8aa1]" : "text-[#71f2d8]",
                  ].join(" ")}
                >
                  {item.movementType === "borrow" ? "Prestado" : "Reposicion"}
                </td>
                <td className="px-4 py-4 text-[#d8dde3]">
                  {item.borrower || "Sin nombre"}
                </td>
                <td className="px-4 py-4 text-[#d8dde3]">{item.paymentMethod}</td>
                <td
                  className={[
                    "px-4 py-4 text-right font-semibold",
                    item.movementType === "borrow" ? "text-[#ff8aa1]" : "text-[#71f2d8]",
                  ].join(" ")}
                >
                  {item.movementType === "borrow" ? "-" : "+"}
                  {money.format(item.amount)}
                </td>
                <td className="px-4 py-4 text-[#aeb5bf]">{item.notes || "Sin notas"}</td>
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
