import type { SalonTransaction } from "@/features/pretty-salon/types";
import { money } from "@/features/pretty-salon/utils";

type PrettyCollectIncomeDialogProps = {
  target: SalonTransaction | null;
  methods: readonly string[];
  selectedMethod: string;
  collectingId?: string | null;
  onMethodChange: (method: string) => void;
  onSubmit: () => void | Promise<void>;
  onClose: () => void;
};

export function PrettyCollectIncomeDialog({
  target,
  methods,
  selectedMethod,
  collectingId,
  onMethodChange,
  onSubmit,
  onClose,
}: PrettyCollectIncomeDialogProps) {
  if (!target) return null;

  const isCollecting = collectingId === target.id;

  return (
    <div className="fixed inset-0 z-40 flex items-end bg-black/70 p-4 sm:items-center sm:justify-center">
      <div className="w-full max-w-md rounded-lg border border-[#30333a] bg-[#181a1e] p-4 shadow-2xl shadow-black/40">
        <p className="text-sm font-semibold text-[#00c2a8]">Cobro de credito</p>
        <h2 className="mt-1 text-2xl font-semibold text-[#f7f9fb]">Marcar como cobrado</h2>
        <p className="mt-2 text-sm leading-6 text-[#aeb5bf]">
          {target.contact || "Cliente"} cancelo{" "}
          <span className="font-semibold text-[#f7f9fb]">{money.format(target.amount)}</span>{" "}
          por {target.concept}.
        </p>

        <label className="mt-5 block">
          <span className="text-sm text-[#c7ced6]">Metodo recibido</span>
          <select
            value={selectedMethod}
            onChange={(event) => onMethodChange(event.target.value)}
            className="mt-2 w-full rounded-lg border border-[#3a3f48] bg-[#101113] px-3 py-3 text-base text-[#f7f9fb] outline-none transition focus:border-[#00c2a8] sm:py-2 sm:text-sm"
          >
            {methods.map((method) => (
              <option key={method} value={method}>
                {method}
              </option>
            ))}
          </select>
        </label>

        <div className="mt-5 grid gap-2 sm:grid-cols-2">
          <button
            type="button"
            onClick={onSubmit}
            disabled={isCollecting}
            className="rounded-lg bg-[#00c2a8] px-4 py-3 text-sm font-semibold text-[#081210] transition hover:bg-[#27dcc4] disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isCollecting ? "Cobrando..." : "Confirmar cobro"}
          </button>
          <button
            type="button"
            onClick={onClose}
            disabled={isCollecting}
            className="rounded-lg border border-[#454b55] px-4 py-3 text-sm font-semibold text-[#d8dde3] transition hover:border-[#70d6ff] disabled:cursor-not-allowed disabled:opacity-60"
          >
            Cancelar
          </button>
        </div>
      </div>
    </div>
  );
}
