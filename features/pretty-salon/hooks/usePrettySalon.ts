"use client";

import { type FormEvent, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { getSupabaseBrowserClient, getSupabaseConfigError } from "@/lib/supabaseClient";
import { collectionPaymentMethods, serviceCatalog } from "@/features/pretty-salon/constants";
import {
  collectPrettySalonPendingIncome,
  countPrettySalonTransactions,
  createPrettySalonCashTransfer,
  createPrettySalonExpensePayment,
  createPrettySalonLoanMovement,
  createPrettySalonTransaction,
  deletePrettySalonCashTransfer,
  deletePrettySalonExpensePayment,
  deletePrettySalonLoanMovement,
  deletePrettySalonTransaction,
  getPrettySalonData,
  insertPrettySalonTransactions,
} from "@/features/pretty-salon/services/prettySalonService";
import type {
  CashTransferFormState,
  ExpensePaymentFormState,
  LoanMovementFormState,
  SalonCashTransfer,
  SalonCashTransferRow,
  SalonExpensePayment,
  SalonExpensePaymentRow,
  SalonLoanMovement,
  SalonLoanMovementRow,
  SalonTransaction,
  SalonTransactionRow,
  SectionId,
  TransactionFormState,
  TransactionKind,
} from "@/features/pretty-salon/types";
import {
  allocateExpensePayments,
  buildBreakdown,
  buildValueBreakdown,
  clearLegacyTransactions,
  currentMonthISO,
  dateDaysAgo,
  defaultCashTransferForm,
  defaultExpenseForm,
  defaultExpensePaymentForm,
  defaultIncomeForm,
  defaultLoanMovementForm,
  formatDate,
  formatDay,
  isDonationPayment,
  loadLegacyTransactions,
  money,
  normalizeCashMethod,
  normalizeCashTransferRow,
  normalizeExpensePaymentRow,
  normalizeExpenseSettlementMethod,
  normalizeLoanMovementRow,
  normalizeTransactionRow,
  resolveStatusForPayment,
  sumAmounts,
  toCashTransferInsert,
  toExpensePaymentInsert,
  toLoanMovementInsert,
  toTransactionInsert,
  todayISO,
} from "@/features/pretty-salon/utils";

export function usePrettySalon() {
  const router = useRouter();
  const actionAreaRef = useRef<HTMLDivElement>(null);
  const quickAccessRef = useRef<HTMLDivElement>(null);
  const cashTransferFormRef = useRef<HTMLDivElement>(null);
  const loanMovementFormRef = useRef<HTMLDivElement>(null);
  const supabase = useMemo(() => getSupabaseBrowserClient(), []);
  const configError = useMemo(() => getSupabaseConfigError(), []);

  const [checking, setChecking] = useState(true);
  const [loadingData, setLoadingData] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [migrationNotice, setMigrationNotice] = useState<string | null>(null);
  const [savingKind, setSavingKind] = useState<TransactionKind | null>(null);
  const [savingCashTransfer, setSavingCashTransfer] = useState(false);
  const [savingExpensePayment, setSavingExpensePayment] = useState(false);
  const [savingLoanMovement, setSavingLoanMovement] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [deletingCashTransferId, setDeletingCashTransferId] = useState<string | null>(null);
  const [deletingExpensePaymentId, setDeletingExpensePaymentId] = useState<string | null>(null);
  const [deletingLoanMovementId, setDeletingLoanMovementId] = useState<string | null>(null);
  const [collectingId, setCollectingId] = useState<string | null>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const [email, setEmail] = useState<string | null>(null);
  const [activeSection, setActiveSection] = useState<SectionId>("dashboard");
  const [selectedMonth, setSelectedMonth] = useState(currentMonthISO);
  const [transactions, setTransactions] = useState<SalonTransaction[]>([]);
  const [cashTransfers, setCashTransfers] = useState<SalonCashTransfer[]>([]);
  const [expensePayments, setExpensePayments] = useState<SalonExpensePayment[]>([]);
  const [loanMovements, setLoanMovements] = useState<SalonLoanMovement[]>([]);
  const [incomeForm, setIncomeForm] = useState<TransactionFormState>(defaultIncomeForm);
  const [expenseForm, setExpenseForm] = useState<TransactionFormState>(defaultExpenseForm);
  const [cashTransferForm, setCashTransferForm] = useState<CashTransferFormState>(
    defaultCashTransferForm
  );
  const [expensePaymentForm, setExpensePaymentForm] = useState<ExpensePaymentFormState>(
    defaultExpensePaymentForm
  );
  const [loanMovementForm, setLoanMovementForm] = useState<LoanMovementFormState>(
    defaultLoanMovementForm
  );
  const [expensePaymentDialogOpen, setExpensePaymentDialogOpen] = useState(false);
  const [collectionTarget, setCollectionTarget] = useState<SalonTransaction | null>(null);
  const [collectionMethod, setCollectionMethod] = useState("Efectivo");

  const loadSalonData = useCallback(
    async () => {
      if (!supabase) return false;

      setLoadingData(true);
      setLoadError(null);

      const [
        transactionsResult,
        transfersResult,
        expensePaymentsResult,
        loanMovementsResult,
      ] = await getPrettySalonData(supabase);

      setLoadingData(false);

      if (
        transactionsResult.error ||
        transfersResult.error ||
        expensePaymentsResult.error ||
        loanMovementsResult.error
      ) {
        const error =
          transactionsResult.error ??
          transfersResult.error ??
          expensePaymentsResult.error ??
          loanMovementsResult.error;
        setLoadError(
          `${error?.message ?? "No pude cargar los datos"}. Ejecuta supabase/pretty_salon.sql en tu proyecto de Supabase.`
        );
        return false;
      }

      setTransactions(
        ((transactionsResult.data as SalonTransactionRow[] | null) ?? []).map(normalizeTransactionRow)
      );
      setCashTransfers(
        ((transfersResult.data as SalonCashTransferRow[] | null) ?? []).map(normalizeCashTransferRow)
      );
      setExpensePayments(
        ((expensePaymentsResult.data as SalonExpensePaymentRow[] | null) ?? []).map(
          normalizeExpensePaymentRow
        )
      );
      setLoanMovements(
        ((loanMovementsResult.data as SalonLoanMovementRow[] | null) ?? []).map(
          normalizeLoanMovementRow
        )
      );
      return true;
    },
    [supabase]
  );

  const migrateLegacyTransactions = useCallback(
    async (currentUserId: string) => {
      if (!supabase) return;

      const legacyTransactions = loadLegacyTransactions(currentUserId);
      if (legacyTransactions.length === 0) return;

      const { count, error: countError } = await countPrettySalonTransactions(supabase);

      if (countError) {
        setMigrationNotice(
          "No pude revisar los datos remotos para migrar los registros locales."
        );
        return;
      }

      if ((count ?? 0) > 0) {
        setMigrationNotice(
          "Supabase ya tiene movimientos. Deje los registros locales en este navegador para evitar duplicados."
        );
        return;
      }

      const payload = legacyTransactions.map((item) =>
        toTransactionInsert(currentUserId, {
          kind: item.kind,
          date: item.date,
          concept: item.concept,
          category: item.category,
          amount: item.amount,
          paymentMethod: item.paymentMethod,
          status: item.status,
          contact: item.contact,
          notes: item.notes,
        })
      );

      const { error } = await insertPrettySalonTransactions(supabase, payload);

      if (error) {
        setMigrationNotice(
          `No pude migrar los registros locales a Supabase: ${error.message}`
        );
        return;
      }

      clearLegacyTransactions(currentUserId);
      setMigrationNotice(
        `Migre ${legacyTransactions.length} movimiento(s) locales reales a Supabase.`
      );
    },
    [supabase]
  );

  useEffect(() => {
    let cancelled = false;

    async function loadSession() {
      if (!supabase) {
        setChecking(false);
        return;
      }

      const { data } = await supabase.auth.getSession();
      const session = data.session;

      if (!session) {
        router.replace("/login");
        return;
      }

      setUserId(session.user.id);
      setEmail(session.user.email ?? null);
      await migrateLegacyTransactions(session.user.id);
      await loadSalonData();

      if (!cancelled) {
        setChecking(false);
      }
    }

    loadSession();

    return () => {
      cancelled = true;
    };
  }, [loadSalonData, migrateLegacyTransactions, router, supabase]);

  async function handleLogout() {
    if (!supabase) return;
    await supabase.auth.signOut();
    router.replace("/login");
  }

  function scrollToActionArea() {
    window.setTimeout(() => {
      actionAreaRef.current?.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
    }, 80);
  }

  function scrollToTop() {
    window.setTimeout(() => {
      window.scrollTo({ top: 0, behavior: "smooth" });
    }, 0);
  }

  function switchSection(section: SectionId, shouldScroll = true) {
    setActiveSection(section);

    if (!shouldScroll) return;

    if (section === "dashboard") {
      scrollToTop();
      return;
    }

    scrollToActionArea();
  }

  function returnToQuickAccess() {
    setActiveSection("dashboard");

    window.setTimeout(() => {
      quickAccessRef.current?.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
    }, 120);
  }

  function updateIncomeForm<K extends keyof TransactionFormState>(
    field: K,
    value: TransactionFormState[K]
  ) {
    setIncomeForm((current) => {
      const next = { ...current, [field]: value };
      return {
        ...next,
        status: resolveStatusForPayment(next.paymentMethod, next.status),
      };
    });
  }

  function updateExpenseForm<K extends keyof TransactionFormState>(
    field: K,
    value: TransactionFormState[K]
  ) {
    setExpenseForm((current) => {
      const next = { ...current, [field]: value };
      return {
        ...next,
        status: resolveStatusForPayment(next.paymentMethod, next.status),
      };
    });
  }

  function updateCashTransferForm<K extends keyof CashTransferFormState>(
    field: K,
    value: CashTransferFormState[K]
  ) {
    setCashTransferForm((current) => ({ ...current, [field]: value }));
  }

  function updateExpensePaymentForm<K extends keyof ExpensePaymentFormState>(
    field: K,
    value: ExpensePaymentFormState[K]
  ) {
    setExpensePaymentForm((current) => ({ ...current, [field]: value }));
  }

  function updateLoanMovementForm<K extends keyof LoanMovementFormState>(
    field: K,
    value: LoanMovementFormState[K]
  ) {
    setLoanMovementForm((current) => ({ ...current, [field]: value }));
  }

  function openExpensePaymentDialog() {
    setExpensePaymentForm((current) => ({
      ...current,
      date: current.date || todayISO(),
      paymentMethod: normalizeExpenseSettlementMethod(current.paymentMethod),
    }));
    setExpensePaymentDialogOpen(true);
  }

  function openCashAction(target: "transfer" | "loan") {
    switchSection("caja");

    window.setTimeout(() => {
      const targetRef = target === "transfer" ? cashTransferFormRef : loanMovementFormRef;
      targetRef.current?.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
    }, 120);
  }

  function openIncomeForm(paymentMethod = "Efectivo") {
    setIncomeForm((current) => ({
      ...current,
      paymentMethod,
      status: resolveStatusForPayment(paymentMethod, "paid"),
    }));
    switchSection("ingresos");
  }

  function openExpenseForm() {
    switchSection("gastos");
  }

  function handleMobileNavigation(section: SectionId) {
    if (section === "ingresos") {
      openIncomeForm("Efectivo");
      return;
    }

    if (section === "gastos") {
      openExpenseForm();
      return;
    }

    switchSection(section);
  }

  async function addTransaction(kind: TransactionKind, event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!supabase || !userId) return;

    const form = kind === "income" ? incomeForm : expenseForm;
    const amount = Number(form.amount);

    if (!form.concept.trim()) {
      alert("Agrega un concepto para guardar el movimiento.");
      return;
    }

    if (!Number.isFinite(amount) || amount <= 0) {
      alert("El monto debe ser mayor que cero.");
      return;
    }

    const next: Omit<SalonTransaction, "id"> = {
      kind,
      date: form.date || todayISO(),
      concept: form.concept.trim(),
      category: form.category,
      amount: Math.round(amount * 100) / 100,
      paymentMethod: form.paymentMethod,
      status: resolveStatusForPayment(form.paymentMethod, form.status),
      contact: form.contact.trim(),
      notes: form.notes.trim(),
    };

    setSavingKind(kind);

    const { data, error } = await createPrettySalonTransaction(
      supabase,
      toTransactionInsert(userId, next)
    );

    setSavingKind(null);

    if (error) {
      alert(error.message);
      return;
    }

    if (data) {
      setTransactions((current) => [
        normalizeTransactionRow(data as SalonTransactionRow),
        ...current,
      ]);
    } else {
      await loadSalonData();
    }

    if (kind === "income") {
      setIncomeForm(defaultIncomeForm());
      returnToQuickAccess();
    } else {
      setExpenseForm(defaultExpenseForm());
      returnToQuickAccess();
    }
  }

  async function addCashTransfer(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!supabase || !userId) return;

    const amount = Number(cashTransferForm.amount);

    if (!Number.isFinite(amount) || amount <= 0) {
      alert("El monto del traslado debe ser mayor que cero.");
      return;
    }

    if (cashTransferForm.fromMethod === cashTransferForm.toMethod) {
      alert("Elige metodos diferentes para mover el dinero.");
      return;
    }

    const next: Omit<SalonCashTransfer, "id"> = {
      date: cashTransferForm.date || todayISO(),
      fromMethod: cashTransferForm.fromMethod,
      toMethod: cashTransferForm.toMethod,
      amount: Math.round(amount * 100) / 100,
      notes: cashTransferForm.notes.trim(),
    };

    setSavingCashTransfer(true);

    const { data, error } = await createPrettySalonCashTransfer(
      supabase,
      toCashTransferInsert(userId, next)
    );

    setSavingCashTransfer(false);

    if (error) {
      alert(error.message);
      return;
    }

    if (data) {
      setCashTransfers((current) => [
        normalizeCashTransferRow(data as SalonCashTransferRow),
        ...current,
      ]);
    } else {
      await loadSalonData();
    }

    setCashTransferForm(defaultCashTransferForm());
    returnToQuickAccess();
  }

  async function addExpensePayment(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!supabase || !userId) return;

    const amount = Number(expensePaymentForm.amount);
    const roundedAmount = Math.round(amount * 100) / 100;

    if (!Number.isFinite(roundedAmount) || roundedAmount <= 0) {
      alert("El abono debe ser mayor que cero.");
      return;
    }

    if (roundedAmount > totalPendingExpenses + 0.001) {
      alert(`El abono supera lo pendiente por pagar: ${money.format(totalPendingExpenses)}.`);
      return;
    }

    const next: Omit<SalonExpensePayment, "id"> = {
      date: expensePaymentForm.date || todayISO(),
      paymentMethod: normalizeExpenseSettlementMethod(expensePaymentForm.paymentMethod),
      amount: roundedAmount,
      notes: expensePaymentForm.notes.trim(),
    };

    setSavingExpensePayment(true);

    const { data, error } = await createPrettySalonExpensePayment(
      supabase,
      toExpensePaymentInsert(userId, next)
    );

    setSavingExpensePayment(false);

    if (error) {
      alert(error.message);
      return;
    }

    if (data) {
      setExpensePayments((current) => [
        normalizeExpensePaymentRow(data as SalonExpensePaymentRow),
        ...current,
      ]);
    } else {
      await loadSalonData();
    }

    setExpensePaymentForm(defaultExpensePaymentForm());
    setExpensePaymentDialogOpen(false);
    returnToQuickAccess();
  }

  async function addLoanMovement(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!supabase || !userId) return;

    const amount = Number(loanMovementForm.amount);
    const roundedAmount = Math.round(amount * 100) / 100;

    if (!Number.isFinite(roundedAmount) || roundedAmount <= 0) {
      alert("El monto prestado debe ser mayor que cero.");
      return;
    }

    if (!loanMovementForm.borrower.trim()) {
      alert("Agrega quien tomo o repuso el dinero.");
      return;
    }

    const next: Omit<SalonLoanMovement, "id"> = {
      date: loanMovementForm.date || todayISO(),
      movementType: loanMovementForm.movementType,
      borrower: loanMovementForm.borrower.trim(),
      paymentMethod: normalizeCashMethod(loanMovementForm.paymentMethod),
      amount: roundedAmount,
      notes: loanMovementForm.notes.trim(),
    };

    setSavingLoanMovement(true);

    const { data, error } = await createPrettySalonLoanMovement(
      supabase,
      toLoanMovementInsert(userId, next)
    );

    setSavingLoanMovement(false);

    if (error) {
      alert(error.message);
      return;
    }

    if (data) {
      setLoanMovements((current) => [
        normalizeLoanMovementRow(data as SalonLoanMovementRow),
        ...current,
      ]);
    } else {
      await loadSalonData();
    }

    setLoanMovementForm(defaultLoanMovementForm());
    returnToQuickAccess();
  }

  async function deleteTransaction(id: string) {
    if (!supabase || !userId) return;

    setDeletingId(id);

    const { error } = await deletePrettySalonTransaction(supabase, id);

    setDeletingId(null);

    if (error) {
      alert(error.message);
      return;
    }

    setTransactions((current) => current.filter((item) => item.id !== id));
  }

  async function deleteCashTransfer(id: string) {
    if (!supabase || !userId) return;

    setDeletingCashTransferId(id);

    const { error } = await deletePrettySalonCashTransfer(supabase, id);

    setDeletingCashTransferId(null);

    if (error) {
      alert(error.message);
      return;
    }

    setCashTransfers((current) => current.filter((item) => item.id !== id));
  }

  async function deleteExpensePayment(id: string) {
    if (!supabase || !userId) return;

    setDeletingExpensePaymentId(id);

    const { error } = await deletePrettySalonExpensePayment(supabase, id);

    setDeletingExpensePaymentId(null);

    if (error) {
      alert(error.message);
      return;
    }

    setExpensePayments((current) => current.filter((item) => item.id !== id));
  }

  async function deleteLoanMovement(id: string) {
    if (!supabase || !userId) return;

    setDeletingLoanMovementId(id);

    const { error } = await deletePrettySalonLoanMovement(supabase, id);

    setDeletingLoanMovementId(null);

    if (error) {
      alert(error.message);
      return;
    }

    setLoanMovements((current) => current.filter((item) => item.id !== id));
  }

  function openCollectDialog(transaction: SalonTransaction) {
    if (transaction.kind !== "income" || transaction.status !== "pending") return;

    const suggestedMethod =
      collectionPaymentMethods.find((method) => method === normalizeCashMethod(transaction.paymentMethod)) ??
      "Efectivo";

    setCollectionTarget(transaction);
    setCollectionMethod(suggestedMethod);
  }

  async function collectPendingIncome() {
    if (!supabase || !userId || !collectionTarget) return;
    if (collectionTarget.kind !== "income" || collectionTarget.status !== "pending") return;

    const collectionNote = `Cobrado el ${formatDate(todayISO())} por ${collectionMethod}.`;
    const currentNotes = collectionTarget.notes.trim();
    const nextNotes = currentNotes ? `${currentNotes}\n${collectionNote}` : collectionNote;

    setCollectingId(collectionTarget.id);

    const { data, error } = await collectPrettySalonPendingIncome(
      supabase,
      collectionTarget.id,
      normalizeCashMethod(collectionMethod),
      nextNotes
    );

    setCollectingId(null);

    if (error) {
      alert(error.message);
      return;
    }

    if (data) {
      const updatedTransaction = normalizeTransactionRow(data as SalonTransactionRow);
      setTransactions((current) =>
        current.map((item) => (item.id === updatedTransaction.id ? updatedTransaction : item))
      );
    } else {
      await loadSalonData();
    }

    setCollectionTarget(null);
  }

  function startIncomeFromService(service: (typeof serviceCatalog)[number]) {
    setIncomeForm({
      ...defaultIncomeForm(),
      concept: service.name,
      category: "Servicios",
      amount: String(service.price),
      notes: `${service.duration} - costo estimado ${money.format(service.cost)}`,
    });
    openIncomeForm("Efectivo");
  }

  const sortedTransactions = useMemo(() => {
    return [...transactions].sort((a, b) => {
      if (a.date !== b.date) return b.date.localeCompare(a.date);
      return b.id.localeCompare(a.id);
    });
  }, [transactions]);

  const sortedCashTransfers = useMemo(() => {
    return [...cashTransfers].sort((a, b) => {
      if (a.date !== b.date) return b.date.localeCompare(a.date);
      return b.id.localeCompare(a.id);
    });
  }, [cashTransfers]);

  const sortedExpensePayments = useMemo(() => {
    return [...expensePayments].sort((a, b) => {
      if (a.date !== b.date) return b.date.localeCompare(a.date);
      return b.id.localeCompare(a.id);
    });
  }, [expensePayments]);

  const sortedLoanMovements = useMemo(() => {
    return [...loanMovements].sort((a, b) => {
      if (a.date !== b.date) return b.date.localeCompare(a.date);
      return b.id.localeCompare(a.id);
    });
  }, [loanMovements]);

  const monthOptions = useMemo(() => {
    return [
      ...new Set([
        selectedMonth,
        currentMonthISO(),
        ...transactions.map((item) => item.date.slice(0, 7)),
        ...cashTransfers.map((item) => item.date.slice(0, 7)),
        ...expensePayments.map((item) => item.date.slice(0, 7)),
        ...loanMovements.map((item) => item.date.slice(0, 7)),
      ]),
    ]
      .sort((a, b) => b.localeCompare(a));
  }, [cashTransfers, expensePayments, loanMovements, selectedMonth, transactions]);

  const monthlyTransactions = useMemo(() => {
    return sortedTransactions.filter((item) => item.date.startsWith(selectedMonth));
  }, [selectedMonth, sortedTransactions]);

  const monthlyCashTransfers = useMemo(() => {
    return sortedCashTransfers.filter((item) => item.date.startsWith(selectedMonth));
  }, [selectedMonth, sortedCashTransfers]);

  const monthlyExpensePayments = useMemo(() => {
    return sortedExpensePayments.filter((item) => item.date.startsWith(selectedMonth));
  }, [selectedMonth, sortedExpensePayments]);

  const monthlyLoanMovements = useMemo(() => {
    return sortedLoanMovements.filter((item) => item.date.startsWith(selectedMonth));
  }, [selectedMonth, sortedLoanMovements]);

  const expensePaymentAllocations = useMemo(() => {
    return allocateExpensePayments(expensePayments, transactions);
  }, [expensePayments, transactions]);

  const cashExpensePaymentAllocations = useMemo(() => {
    return allocateExpensePayments(
      expensePayments.filter((item) => !isDonationPayment(item.paymentMethod)),
      transactions
    );
  }, [expensePayments, transactions]);

  const paidIncome = useMemo(() => {
    return sumAmounts(
      monthlyTransactions.filter((item) => item.kind === "income" && item.status === "paid")
    );
  }, [monthlyTransactions]);

  const pendingIncome = useMemo(() => {
    return sumAmounts(
      monthlyTransactions.filter((item) => item.kind === "income" && item.status === "pending")
    );
  }, [monthlyTransactions]);

  const paidExpenses = useMemo(() => {
    const paidAtPurchase = sumAmounts(
      monthlyTransactions.filter((item) => item.kind === "expense" && item.status === "paid")
    );
    const paidByAbonos = monthlyExpensePayments
      .filter((item) => !isDonationPayment(item.paymentMethod))
      .reduce((total, item) => total + item.amount, 0);

    return paidAtPurchase + paidByAbonos;
  }, [monthlyExpensePayments, monthlyTransactions]);

  const pendingExpenses = useMemo(() => {
    return monthlyTransactions
      .filter((item) => item.kind === "expense" && item.status === "pending")
      .reduce((total, item) => {
        const paidAmount = expensePaymentAllocations.get(item.id) ?? 0;
        return total + Math.max(item.amount - paidAmount, 0);
      }, 0);
  }, [expensePaymentAllocations, monthlyTransactions]);

  const totalPendingExpenses = transactions
    .filter((item) => item.kind === "expense" && item.status === "pending")
    .reduce((total, item) => {
      const paidAmount = expensePaymentAllocations.get(item.id) ?? 0;
      return total + Math.max(item.amount - paidAmount, 0);
    }, 0);

  const netProfit = paidIncome - paidExpenses;
  const projectedProfit = paidIncome + pendingIncome - paidExpenses - pendingExpenses;
  const margin = paidIncome > 0 ? (netProfit / paidIncome) * 100 : 0;

  const incomeBreakdown = useMemo(() => {
    return buildBreakdown(
      monthlyTransactions.filter((item) => item.kind === "income" && item.status === "paid"),
      ["#00c2a8", "#70d6ff", "#f7d84a", "#b8f060", "#ff8aa1"]
    );
  }, [monthlyTransactions]);

  const expenseBreakdown = useMemo(() => {
    const paidExpensePortions = monthlyTransactions
      .filter((item) => item.kind === "expense")
      .map((item) => {
        if (item.status === "paid") return item;

        const paidAmount = Math.min(cashExpensePaymentAllocations.get(item.id) ?? 0, item.amount);
        return { ...item, amount: paidAmount };
      })
      .filter((item) => item.amount > 0);

    return buildBreakdown(paidExpensePortions, ["#ff5f7e", "#f7d84a", "#70d6ff", "#b8f060", "#00c2a8"]);
  }, [cashExpensePaymentAllocations, monthlyTransactions]);

  const pendingExpenseBreakdown = useMemo(() => {
    return buildValueBreakdown(
      monthlyTransactions
        .filter((item) => item.kind === "expense" && item.status === "pending")
        .map((item) => ({
          label: item.category,
          value: Math.max(item.amount - (expensePaymentAllocations.get(item.id) ?? 0), 0),
        })),
      ["#ffe06b", "#ff8aa1", "#70d6ff", "#b8f060", "#00c2a8"]
    );
  }, [expensePaymentAllocations, monthlyTransactions]);

  const pendingIncomeBreakdown = useMemo(() => {
    return buildValueBreakdown(
      monthlyTransactions
        .filter((item) => item.kind === "income" && item.status === "pending")
        .map((item) => ({ label: item.category, value: item.amount })),
      ["#ffe06b", "#70d6ff", "#00c2a8", "#f7d84a", "#ff8aa1"]
    );
  }, [monthlyTransactions]);

  const loanBreakdown = useMemo(() => {
    const grouped = new Map<string, number>();

    for (const item of monthlyLoanMovements) {
      const label = item.borrower.trim() || "Sin nombre";
      const value = item.movementType === "borrow" ? item.amount : -item.amount;
      grouped.set(label, (grouped.get(label) ?? 0) + value);
    }

    return buildValueBreakdown(
      [...grouped.entries()].map(([label, value]) => ({ label, value: Math.max(value, 0) })),
      ["#f7d84a", "#70d6ff", "#ff8aa1", "#00c2a8", "#b8f060"]
    );
  }, [monthlyLoanMovements]);

  const dailyTrend = useMemo(() => {
    return Array.from({ length: 10 }, (_, index) => {
      const date = dateDaysAgo(9 - index);
      const dayTransactions = transactions.filter(
        (item) => item.date === date && item.status === "paid"
      );
      const dayExpensePayments = expensePayments.filter(
        (item) => item.date === date && !isDonationPayment(item.paymentMethod)
      );
      const income = sumAmounts(dayTransactions.filter((item) => item.kind === "income"));
      const expense =
        sumAmounts(dayTransactions.filter((item) => item.kind === "expense")) +
        dayExpensePayments.reduce((total, item) => total + item.amount, 0);

      return {
        date,
        label: formatDay(date),
        income,
        expense,
      };
    });
  }, [expensePayments, transactions]);

  const trendMax = Math.max(
    1,
    ...dailyTrend.flatMap((item) => [item.income, item.expense])
  );

  const paymentBreakdown = useMemo(() => {
    const grouped = new Map<
      string,
      {
        method: string;
        income: number;
        expense: number;
        transferIn: number;
        transferOut: number;
        loanOut: number;
        loanIn: number;
      }
    >();

    function getMethod(method: string) {
      const key = normalizeCashMethod(method);
      const current = grouped.get(key) ?? {
        method: key,
        income: 0,
        expense: 0,
        transferIn: 0,
        transferOut: 0,
        loanOut: 0,
        loanIn: 0,
      };

      grouped.set(key, current);
      return current;
    }

    for (const item of monthlyTransactions.filter((tx) => tx.status === "paid")) {
      const current = getMethod(item.paymentMethod);

      if (item.kind === "income") {
        current.income += item.amount;
      } else {
        current.expense += item.amount;
      }

    }

    for (const item of monthlyExpensePayments.filter((payment) => !isDonationPayment(payment.paymentMethod))) {
      getMethod(item.paymentMethod).expense += item.amount;
    }

    for (const item of monthlyCashTransfers) {
      getMethod(item.fromMethod).transferOut += item.amount;
      getMethod(item.toMethod).transferIn += item.amount;
    }

    for (const item of monthlyLoanMovements) {
      if (item.movementType === "borrow") {
        getMethod(item.paymentMethod).loanOut += item.amount;
      } else {
        getMethod(item.paymentMethod).loanIn += item.amount;
      }
    }

    return [...grouped.values()]
      .map((item) => ({
        ...item,
        transferNet: item.transferIn - item.transferOut,
        loanNet: item.loanIn - item.loanOut,
        balance:
          item.income -
          item.expense +
          item.transferIn -
          item.transferOut +
          item.loanIn -
          item.loanOut,
      }))
      .sort((a, b) => b.balance - a.balance);
  }, [monthlyCashTransfers, monthlyExpensePayments, monthlyLoanMovements, monthlyTransactions]);

  const cashTransferVolume = useMemo(() => {
    return monthlyCashTransfers.reduce((total, item) => total + item.amount, 0);
  }, [monthlyCashTransfers]);

  const loanedBalance = useMemo(() => {
    return loanMovements.reduce((total, item) => {
      return total + (item.movementType === "borrow" ? item.amount : -item.amount);
    }, 0);
  }, [loanMovements]);

  const clientRows = useMemo(() => {
    const grouped = new Map<
      string,
      { name: string; visits: number; paid: number; pending: number; lastDate: string }
    >();

    for (const item of transactions.filter((tx) => tx.kind === "income" && tx.contact.trim())) {
      const name = item.contact.trim();
      const current = grouped.get(name) ?? {
        name,
        visits: 0,
        paid: 0,
        pending: 0,
        lastDate: item.date,
      };

      current.visits += 1;
      current.lastDate = item.date > current.lastDate ? item.date : current.lastDate;

      if (item.status === "paid") {
        current.paid += item.amount;
      } else {
        current.pending += item.amount;
      }

      grouped.set(name, current);
    }

    return [...grouped.values()].sort((a, b) => b.lastDate.localeCompare(a.lastDate));
  }, [transactions]);

  const monthlyReports = useMemo(() => {
    return monthOptions.map((month) => {
      const items = transactions.filter((item) => item.date.startsWith(month));
      const payments = expensePayments.filter(
        (item) => item.date.startsWith(month) && !isDonationPayment(item.paymentMethod)
      );
      const income = sumAmounts(
        items.filter((item) => item.kind === "income" && item.status === "paid")
      );
      const expenses =
        sumAmounts(items.filter((item) => item.kind === "expense" && item.status === "paid")) +
        payments.reduce((total, item) => total + item.amount, 0);
      const pendingIncomeForMonth = sumAmounts(
        items.filter((item) => item.kind === "income" && item.status === "pending")
      );
      const pendingExpensesForMonth = items
        .filter((item) => item.kind === "expense" && item.status === "pending")
        .reduce((total, item) => {
          const paidAmount = expensePaymentAllocations.get(item.id) ?? 0;
          return total + Math.max(item.amount - paidAmount, 0);
        }, 0);
      const pending = pendingIncomeForMonth + pendingExpensesForMonth;
      const profit = income - expenses;

      return {
        month,
        income,
        expenses,
        pending,
        profit,
        margin: income > 0 ? (profit / income) * 100 : 0,
      };
    });
  }, [expensePaymentAllocations, expensePayments, monthOptions, transactions]);


  return {
    actionAreaRef,
    quickAccessRef,
    cashTransferFormRef,
    loanMovementFormRef,
    checking,
    supabase,
    configError,
    loadingData,
    loadError,
    migrationNotice,
    savingKind,
    savingCashTransfer,
    savingExpensePayment,
    savingLoanMovement,
    deletingId,
    deletingCashTransferId,
    deletingExpensePaymentId,
    deletingLoanMovementId,
    collectingId,
    userId,
    email,
    activeSection,
    setActiveSection,
    selectedMonth,
    setSelectedMonth,
    transactions,
    cashTransfers,
    expensePayments,
    loanMovements,
    incomeForm,
    expenseForm,
    cashTransferForm,
    expensePaymentForm,
    loanMovementForm,
    expensePaymentDialogOpen,
    setExpensePaymentDialogOpen,
    collectionTarget,
    setCollectionTarget,
    collectionMethod,
    setCollectionMethod,
    loadSalonData,
    handleLogout,
    switchSection,
    returnToQuickAccess,
    updateIncomeForm,
    updateExpenseForm,
    updateCashTransferForm,
    updateExpensePaymentForm,
    updateLoanMovementForm,
    openExpensePaymentDialog,
    openCashAction,
    openIncomeForm,
    openExpenseForm,
    handleMobileNavigation,
    addTransaction,
    addCashTransfer,
    addExpensePayment,
    addLoanMovement,
    deleteTransaction,
    deleteCashTransfer,
    deleteExpensePayment,
    deleteLoanMovement,
    openCollectDialog,
    collectPendingIncome,
    startIncomeFromService,
    sortedTransactions,
    sortedCashTransfers,
    sortedExpensePayments,
    sortedLoanMovements,
    monthOptions,
    monthlyTransactions,
    monthlyCashTransfers,
    monthlyExpensePayments,
    monthlyLoanMovements,
    expensePaymentAllocations,
    cashExpensePaymentAllocations,
    paidIncome,
    pendingIncome,
    paidExpenses,
    pendingExpenses,
    totalPendingExpenses,
    netProfit,
    projectedProfit,
    margin,
    incomeBreakdown,
    expenseBreakdown,
    pendingExpenseBreakdown,
    pendingIncomeBreakdown,
    loanBreakdown,
    dailyTrend,
    trendMax,
    paymentBreakdown,
    cashTransferVolume,
    loanedBalance,
    clientRows,
    monthlyReports,
  };
}
