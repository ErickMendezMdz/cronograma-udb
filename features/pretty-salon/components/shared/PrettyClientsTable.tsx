import { formatDate, money } from "@/features/pretty-salon/utils";

type ClientRow = {
  name: string;
  visits: number;
  paid: number;
  pending: number;
  lastDate: string;
};

type PrettyClientsTableProps = {
  clients: ClientRow[];
};

export function PrettyClientsTable({ clients }: PrettyClientsTableProps) {
  return (
    <div className="mt-5 overflow-x-auto rounded-lg border border-[#30333a]">
      <table className="min-w-[720px] w-full text-left text-sm">
        <thead className="bg-[#111316] text-[#aeb5bf]">
          <tr>
            <th className="px-4 py-3 font-medium">Cliente</th>
            <th className="px-4 py-3 text-right font-medium">Visitas</th>
            <th className="px-4 py-3 text-right font-medium">Pagado</th>
            <th className="px-4 py-3 text-right font-medium">Pendiente</th>
            <th className="px-4 py-3 text-right font-medium">Ultima visita</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-[#30333a]">
          {clients.map((client) => (
            <tr key={client.name}>
              <td className="px-4 py-4 font-medium text-[#f7f9fb]">{client.name}</td>
              <td className="px-4 py-4 text-right text-[#d8dde3]">{client.visits}</td>
              <td className="px-4 py-4 text-right text-[#71f2d8]">
                {money.format(client.paid)}
              </td>
              <td className="px-4 py-4 text-right text-[#ffe06b]">
                {money.format(client.pending)}
              </td>
              <td className="px-4 py-4 text-right text-[#d8dde3]">
                {formatDate(client.lastDate)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
