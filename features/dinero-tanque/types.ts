export type TankExpense = {
  id: string;
  title: string;
  category: string;
  amount: number;
  date: string;
  notes: string;
};

export type TankMoneyState = {
  budget: number;
  expenses: TankExpense[];
};

export type TankBudgetRow = {
  amount: number | string;
};

export type TankExpenseRow = {
  id: string;
  title: string;
  category: string | null;
  amount: number | string;
  expense_date: string;
  notes: string | null;
};

export type TankExpenseDraft = {
  title: string;
  category: string;
  amount: string;
  date: string;
  notes: string;
};

export type TankCategoryBreakdownItem = {
  categoryName: string;
  categoryTotal: number;
  share: number;
};
