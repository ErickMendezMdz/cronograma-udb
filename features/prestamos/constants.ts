import type { LoanCategory, LoanFormState, LoanTab } from "@/features/prestamos/types";

export const loanCategories: LoanCategory[] = [
  "Herramientas",
  "Ropa",
  "Libros",
  "Electrónicos",
  "Documentos",
  "Accesorios",
  "Dinero",
  "Hogar",
  "Vehículo",
  "No lo sé",
];

export const loanTabs: Array<{ id: LoanTab; label: string }> = [
  { id: "active", label: "Actuales" },
  { id: "unknown", label: "No lo sé" },
  { id: "history", label: "Historial" },
];

export function todayISO() {
  return new Date().toISOString().slice(0, 10);
}

export function createEmptyLoanForm(): LoanFormState {
  return {
    itemName: "",
    borrowerName: "",
    category: "No lo sé",
    loanDate: todayISO(),
    notes: "",
  };
}
