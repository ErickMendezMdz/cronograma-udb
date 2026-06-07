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

export function getTodayDateInputValue() {
  const date = new Date();
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function createEmptyLoanForm(): LoanFormState {
  return {
    itemName: "",
    borrowerName: "",
    category: "No lo sé",
    loanDate: getTodayDateInputValue(),
    notes: "",
  };
}
