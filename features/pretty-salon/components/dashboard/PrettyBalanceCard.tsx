import { formatSignedMoney, money } from "@/features/pretty-salon/utils";

type PrettyBalanceCardProps = {
  item: {
    method: string;
    income: number;
    expense: number;
    transferNet: number;
    loanNet: number;
    balance: number;
  };
};

function signedTone(value: number) {
  if (value > 0) return "text-[#71f2d8]";
  if (value < 0) return "text-[#ff8aa1]";
  return "text-[#aeb5bf]";
}

export function PrettyBalanceCard({ item }: PrettyBalanceCardProps) {
  return (
    <article className="min-w-0 rounded-lg border border-[#30333a] bg-[#101113] p-4">
      <div className="flex min-w-0 items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="truncate text-base font-semibold text-[#f7f9fb]">{item.method}</p>
          <p className="mt-1 text-xs text-[#8f98a5]">Metodo de caja</p>
        </div>
        <p
          className={[
            "shrink-0 text-right text-xl font-semibold",
            item.balance < 0 ? "text-[#ff8aa1]" : "text-[#f7f9fb]",
          ].join(" ")}
        >
          {money.format(item.balance)}
        </p>
      </div>

      <div className="mt-4 grid gap-2 text-sm">
        <div className="flex items-center justify-between gap-3">
          <span className="text-[#aeb5bf]">Ingresos</span>
          <span className="font-semibold text-[#71f2d8]">{money.format(item.income)}</span>
        </div>
        <div className="flex items-center justify-between gap-3">
          <span className="text-[#aeb5bf]">Gastos</span>
          <span className="font-semibold text-[#ff8aa1]">{money.format(item.expense)}</span>
        </div>
        <div className="flex items-center justify-between gap-3">
          <span className="text-[#aeb5bf]">Traslados</span>
          <span className={["font-semibold", signedTone(item.transferNet)].join(" ")}>
            {formatSignedMoney(item.transferNet)}
          </span>
        </div>
        <div className="flex items-center justify-between gap-3">
          <span className="text-[#aeb5bf]">Prestado</span>
          <span className={["font-semibold", signedTone(item.loanNet)].join(" ")}>
            {formatSignedMoney(item.loanNet)}
          </span>
        </div>
      </div>
    </article>
  );
}
