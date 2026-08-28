import type {
  CreditCard,
  ParticipantBalance,
  SharedCase,
  SharedParticipant,
} from "@/features/recordatorios/types";

export function localDateValue(date = new Date()) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function makeDate(year: number, monthIndex: number, day: number) {
  const lastDay = new Date(year, monthIndex + 1, 0).getDate();
  return new Date(year, monthIndex, Math.min(day, lastDay));
}

export function nextPayOpportunities(value: string): [string, string] {
  const purchase = new Date(`${value}T12:00:00`);
  const year = purchase.getFullYear();
  const month = purchase.getMonth();
  const candidates = [
    makeDate(year, month, 15),
    makeDate(year, month, 30),
    makeDate(year, month + 1, 15),
    makeDate(year, month + 1, 30),
    makeDate(year, month + 2, 15),
  ].filter((candidate) => candidate.getTime() > purchase.getTime());

  return [localDateValue(candidates[0]), localDateValue(candidates[1])];
}

export function formatMoney(value: number) {
  return new Intl.NumberFormat("es-SV", {
    style: "currency",
    currency: "USD",
  }).format(value);
}

export function formatDate(value: string | null) {
  if (!value) return "—";
  return new Date(`${value}T12:00:00`).toLocaleDateString("es-SV", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export function estimatedCardDates(purchaseDate: string, card?: CreditCard) {
  if (!card) return null;
  const purchase = new Date(`${purchaseDate}T12:00:00`);
  const cutMonth = purchase.getDate() <= card.cutDay
    ? purchase.getMonth()
    : purchase.getMonth() + 1;
  const cut = makeDate(purchase.getFullYear(), cutMonth, card.cutDay);
  const dueMonth = card.dueDay > card.cutDay ? cutMonth : cutMonth + 1;
  const due = makeDate(purchase.getFullYear(), dueMonth, card.dueDay);
  return { cutDate: localDateValue(cut), dueDate: localDateValue(due) };
}

export function splitAmount(amount: number, participants: SharedParticipant[]) {
  const totalCents = Math.round(amount * 100);
  const equalShareCents = Math.ceil(totalCents / participants.length);

  return participants.map((participant) => ({
    participantId: participant.id,
    amount: equalShareCents / 100,
  }));
}

export function getParticipantBalances(sharedCase: SharedCase): ParticipantBalance[] {
  const today = localDateValue();

  return [...sharedCase.participants]
    .sort((a, b) => Number(a.isOwner) - Number(b.isOwner))
    .map((participant) => {
    const assigned = sharedCase.purchases.reduce(
      (sum, purchase) =>
        sum +
        Math.ceil(
          Math.round(purchase.amount * 100) / sharedCase.participants.length
        ) /
          100,
      0
    );
    const paid = sharedCase.payments
      .filter((payment) => payment.participantId === participant.id)
      .reduce((sum, payment) => sum + payment.amount, 0);
    const pending = Math.max(0, assigned - paid);
    let paymentRemaining = paid;
    const pendingPurchases = [...sharedCase.purchases]
      .sort((a, b) => a.purchaseDate.localeCompare(b.purchaseDate))
      .filter((purchase) => {
        const share =
          Math.ceil(
            Math.round(purchase.amount * 100) / sharedCase.participants.length
          ) / 100;
        const applied = Math.min(paymentRemaining, share);
        paymentRemaining -= applied;
        return share - applied > 0.005;
      });
    const opportunities = pendingPurchases
      .flatMap((purchase) => [purchase.firstOpportunity, purchase.secondOpportunity])
      .filter(Boolean)
      .sort();
    const futureOpportunities = [...new Set(opportunities.filter((date) => date >= today))];
    const hasOverdueAmount = pendingPurchases.some(
      (purchase) => purchase.secondOpportunity < today
    );

    let status: ParticipantBalance["status"] = "pending";
    if (participant.isOwner) status = "own";
    else if (pending <= 0.005) status = "paid";
    else if (hasOverdueAmount) status = "overdue";
    else if (paid > 0) status = "partial";

    return {
      ...participant,
      assigned,
      paid,
      pending,
      status,
      firstOpportunity:
        futureOpportunities[0] ?? pendingPurchases[0]?.secondOpportunity ?? null,
      secondOpportunity: futureOpportunities[1] ?? null,
    };
    });
}

export function caseTotals(sharedCase: SharedCase) {
  const balances = getParticipantBalances(sharedCase);
  const collectable = balances
    .filter((balance) => !balance.isOwner)
    .reduce((sum, balance) => sum + balance.assigned, 0);
  const received = balances
    .filter((balance) => !balance.isOwner)
    .reduce((sum, balance) => sum + balance.paid, 0);
  const allocated = sharedCase.allocations.reduce(
    (sum, allocation) => sum + allocation.amount,
    0
  );
  const assignedTotal = balances.reduce(
    (sum, balance) => sum + balance.assigned,
    0
  );
  const purchaseTotal = sharedCase.purchases.reduce(
    (sum, purchase) => sum + purchase.amount,
    0
  );
  return {
    purchaseTotal,
    roundingAdjustment: Math.max(0, assignedTotal - purchaseTotal),
    collectable,
    received,
    pending: Math.max(0, collectable - received),
    unallocated: Math.max(0, received - allocated),
  };
}
