import { type FormEvent } from "react";
import type { TransactionFormState } from "@/features/pretty-salon/types";
import { PrettyTransactionForm } from "@/features/pretty-salon/components/forms/PrettyTransactionForm";

type PrettyIncomeFormProps = {
  form: TransactionFormState;
  categories: readonly string[];
  methods: readonly string[];
  submitting?: boolean;
  onChange: <K extends keyof TransactionFormState>(
    field: K,
    value: TransactionFormState[K]
  ) => void;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
};

export function PrettyIncomeForm(props: PrettyIncomeFormProps) {
  return (
    <PrettyTransactionForm
      kind="income"
      title="Registrar ingreso"
      description="Guarda cobros de servicios, ventas de producto, membresias, paquetes o propinas."
      submitLabel="Guardar ingreso"
      {...props}
    />
  );
}
