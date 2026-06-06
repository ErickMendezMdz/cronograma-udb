import { PrettyBalanceCard } from "@/features/pretty-salon/components/dashboard/PrettyBalanceCard";

type PaymentBreakdownItem = {
  method: string;
  income: number;
  expense: number;
  transferNet: number;
  loanNet: number;
  balance: number;
};

type PrettyPaymentMethodBreakdownProps = {
  items: PaymentBreakdownItem[];
};

export function PrettyPaymentMethodBreakdown({ items }: PrettyPaymentMethodBreakdownProps) {
  if (items.length === 0) {
    return (
      <div className="mt-5 rounded-lg border border-dashed border-[#3a3f48] p-6 text-sm text-[#aeb5bf]">
        Aun no hay movimientos de caja para este mes.
      </div>
    );
  }

  return (
    <div className="mt-5 grid min-w-0 gap-3 md:grid-cols-2">
      {items.map((item) => (
        <PrettyBalanceCard key={item.method} item={item} />
      ))}
    </div>
  );
}
