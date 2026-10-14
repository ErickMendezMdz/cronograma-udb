import type { SharedCase, SharedParticipant } from "@/features/recordatorios/types";
import { getInstallments, getParticipantBalances, localDateValue } from "@/features/recordatorios/utils";

export type PersonCaseBalance = {
  caseId: string;
  title: string;
  caseType: SharedCase["caseType"];
  assigned: number;
  paid: number;
  pending: number;
  currentPending: number;
};

export type PersonBalance = {
  key: string;
  name: string;
  assigned: number;
  paid: number;
  pending: number;
  currentPending: number;
  cases: PersonCaseBalance[];
};

function cents(amount: number) {
  return Math.round(amount * 100);
}

function currentPendingCents(sharedCase: SharedCase, participant: SharedParticipant, paid: number, today: string) {
  const obligations = sharedCase.caseType === "shared"
    ? [...sharedCase.purchases]
      .sort((a, b) => a.purchaseDate.localeCompare(b.purchaseDate))
      .map((purchase) => ({
        amount: Math.ceil(cents(purchase.amount) / sharedCase.participants.length),
        dueDate: purchase.purchaseDate,
      }))
    : getInstallments(sharedCase).map((installment) => ({
      amount: cents(installment.participantAmounts[participant.id] ?? 0),
      dueDate: installment.dueDate,
    }));

  let remainingPaid = cents(paid);
  return obligations.reduce((sum, obligation) => {
    const applied = Math.min(remainingPaid, obligation.amount);
    remainingPaid -= applied;
    const isCurrent = sharedCase.caseType === "installment"
      ? obligation.dueDate.slice(0, 7) <= today.slice(0, 7)
      : obligation.dueDate <= today;
    return sum + (isCurrent ? obligation.amount - applied : 0);
  }, 0);
}

export function getPersonBalances(cases: SharedCase[], today = localDateValue()): PersonBalance[] {
  const people = new Map<string, PersonBalance>();

  for (const sharedCase of cases) {
    if (sharedCase.status !== "active") continue;

    for (const balance of getParticipantBalances(sharedCase)) {
      const name = balance.name.trim().replace(/\s+/g, " ");
      const key = name.toLocaleLowerCase("es");
      const person = people.get(key) ?? {
        key, name, assigned: 0, paid: 0, pending: 0, currentPending: 0, cases: [],
      };
      const currentPending = Math.min(cents(balance.pending), currentPendingCents(sharedCase, balance, balance.paid, today)) / 100;
      person.assigned += cents(balance.assigned);
      person.paid += cents(balance.paid);
      person.pending += cents(balance.pending);
      person.currentPending += cents(currentPending);
      person.cases.push({
        caseId: sharedCase.id,
        title: sharedCase.title,
        caseType: sharedCase.caseType,
        assigned: balance.assigned,
        paid: balance.paid,
        pending: balance.pending,
        currentPending,
      });
      people.set(key, person);
    }
  }

  return [...people.values()]
    .map((person) => ({
      ...person,
      assigned: person.assigned / 100,
      paid: person.paid / 100,
      pending: person.pending / 100,
      currentPending: person.currentPending / 100,
      cases: person.cases.sort((a, b) => b.currentPending - a.currentPending || b.pending - a.pending || a.title.localeCompare(b.title, "es")),
    }))
    .sort((a, b) => a.name.localeCompare(b.name, "es"));
}
