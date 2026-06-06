export type SectionId =
  | "dashboard"
  | "ingresos"
  | "gastos"
  | "caja"
  | "servicios"
  | "clientes"
  | "reportes";

export type TransactionKind = "income" | "expense";
export type SalonStatus = "paid" | "pending";
export type LoanMovementType = "borrow" | "repay";

export type SalonTransaction = {
  id: string;
  kind: TransactionKind;
  date: string;
  concept: string;
  category: string;
  amount: number;
  paymentMethod: string;
  status: SalonStatus;
  contact: string;
  notes: string;
};

export type SalonTransactionRow = {
  id: string;
  owner_id: string;
  kind: TransactionKind;
  transaction_date: string;
  concept: string;
  category: string | null;
  amount: number | string;
  payment_method: string | null;
  status: SalonStatus;
  contact: string | null;
  notes: string | null;
  created_at: string;
};

export type SalonTransactionInsert = {
  owner_id: string;
  kind: TransactionKind;
  transaction_date: string;
  concept: string;
  category: string;
  amount: number;
  payment_method: string;
  status: SalonStatus;
  contact: string;
  notes: string;
};

export type SalonCashTransfer = {
  id: string;
  date: string;
  fromMethod: string;
  toMethod: string;
  amount: number;
  notes: string;
};

export type SalonCashTransferRow = {
  id: string;
  owner_id: string;
  transfer_date: string;
  from_method: string;
  to_method: string;
  amount: number | string;
  notes: string | null;
  created_at: string;
};

export type SalonCashTransferInsert = {
  owner_id: string;
  transfer_date: string;
  from_method: string;
  to_method: string;
  amount: number;
  notes: string;
};

export type SalonExpensePayment = {
  id: string;
  date: string;
  paymentMethod: string;
  amount: number;
  notes: string;
};

export type SalonExpensePaymentRow = {
  id: string;
  owner_id: string;
  payment_date: string;
  payment_method: string;
  amount: number | string;
  notes: string | null;
  created_at: string;
};

export type SalonExpensePaymentInsert = {
  owner_id: string;
  payment_date: string;
  payment_method: string;
  amount: number;
  notes: string;
};

export type SalonLoanMovement = {
  id: string;
  date: string;
  movementType: LoanMovementType;
  borrower: string;
  paymentMethod: string;
  amount: number;
  notes: string;
};

export type SalonLoanMovementRow = {
  id: string;
  owner_id: string;
  movement_date: string;
  movement_type: LoanMovementType;
  borrower: string | null;
  payment_method: string;
  amount: number | string;
  notes: string | null;
  created_at: string;
};

export type SalonLoanMovementInsert = {
  owner_id: string;
  movement_date: string;
  movement_type: LoanMovementType;
  borrower: string;
  payment_method: string;
  amount: number;
  notes: string;
};

export type TransactionFormState = {
  date: string;
  concept: string;
  category: string;
  amount: string;
  paymentMethod: string;
  status: SalonStatus;
  contact: string;
  notes: string;
};

export type CashTransferFormState = {
  date: string;
  fromMethod: string;
  toMethod: string;
  amount: string;
  notes: string;
};

export type ExpensePaymentFormState = {
  date: string;
  amount: string;
  paymentMethod: string;
  notes: string;
};

export type LoanMovementFormState = {
  date: string;
  movementType: LoanMovementType;
  borrower: string;
  amount: string;
  paymentMethod: string;
  notes: string;
};

export type BreakdownItem = {
  label: string;
  value: number;
  share: number;
  color: string;
};

export type ServiceDefinition = {
  name: string;
  category: string;
  duration: string;
  price: number;
  cost: number;
  demand: string;
};
