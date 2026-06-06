import { type FormEvent } from "react";
import type { TransactionFormState } from "@/features/pretty-salon/types";
import { PrettyTransactionForm } from "@/features/pretty-salon/components/forms/PrettyTransactionForm";

type PrettyExpenseFormProps = {
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

export function PrettyExpenseForm(props: PrettyExpenseFormProps) {
  return (
    <PrettyTransactionForm
      kind="expense"
      title="Registrar gasto"
      description="Controla insumos, nomina, renta, servicios basicos, marketing, limpieza y equipo."
      submitLabel="Guardar gasto"
      {...props}
    />
  );
}
