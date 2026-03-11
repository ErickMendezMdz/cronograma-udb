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

export function createEmptyTankState(): TankMoneyState {
  return {
    budget: 0,
    expenses: [],
  };
}

export function loadLegacyTankState(userId: string): TankMoneyState {
  if (typeof window === "undefined") {
    return createEmptyTankState();
  }

  const raw = window.localStorage.getItem(`dinero-tanque:${userId}`);
  if (!raw) {
    return createEmptyTankState();
  }

  try {
    const parsed = JSON.parse(raw) as Partial<TankMoneyState>;
    return {
      budget: typeof parsed.budget === "number" ? parsed.budget : 0,
      expenses: Array.isArray(parsed.expenses)
        ? parsed.expenses.filter(
            (item): item is TankExpense =>
              typeof item?.id === "string" &&
              typeof item?.title === "string" &&
              typeof item?.category === "string" &&
              typeof item?.amount === "number" &&
              typeof item?.date === "string" &&
              typeof item?.notes === "string"
          )
        : [],
    };
  } catch {
    return createEmptyTankState();
  }
}

export function clearLegacyTankState(userId: string) {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.removeItem(`dinero-tanque:${userId}`);
}
