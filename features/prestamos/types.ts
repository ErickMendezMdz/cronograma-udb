export type LoanStatus = "active" | "returned";

export type LoanCategory =
  | "Herramientas"
  | "Ropa"
  | "Libros"
  | "Electrónicos"
  | "Documentos"
  | "Accesorios"
  | "Dinero"
  | "Hogar"
  | "Vehículo"
  | "No lo sé";

export type PersonalLoan = {
  id: string;
  itemName: string;
  borrowerName: string;
  category: LoanCategory;
  loanDate: string;
  returnedAt: string | null;
  status: LoanStatus;
  notes: string;
};

export type PersonalLoanRow = {
  id: string;
  owner_id: string;
  item_name: string;
  borrower_name: string;
  category: string;
  loan_date: string;
  returned_at: string | null;
  status: LoanStatus;
  notes: string | null;
  created_at: string;
  updated_at: string;
};

export type LoanFormState = {
  itemName: string;
  borrowerName: string;
  category: LoanCategory;
  loanDate: string;
  notes: string;
};

export type LoanTab = "active" | "unknown" | "history";

export type LoanSummaryCounts = {
  activeCount: number;
  activeBorrowersCount: number;
  unknownCount: number;
  returnedCount: number;
};
