"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  getSupabaseBrowserClient,
  getSupabaseConfigError,
} from "@/lib/supabaseClient";
import { isSalonOnlyEmail } from "@/lib/moduleAccess";
import { createEmptyLoanForm } from "@/features/prestamos/constants";
import {
  createLoan as createLoanRecord,
  deleteLoan as deleteLoanRecord,
  getLoans,
  markLoanReturned,
  normalizeLoan,
  restoreLoan as restoreLoanRecord,
  updateLoan as updateLoanRecord,
} from "@/features/prestamos/services/loansService";
import type {
  LoanCategory,
  LoanFormState,
  LoanSummaryCounts,
  LoanTab,
  PersonalLoan,
  PersonalLoanRow,
} from "@/features/prestamos/types";

function matchesSearch(loan: PersonalLoan, search: string) {
  const term = search.trim().toLowerCase();
  if (!term) return true;

  return [loan.itemName, loan.borrowerName, loan.notes]
    .join(" ")
    .toLowerCase()
    .includes(term);
}

export function useLoans() {
  const router = useRouter();
  const supabase = useMemo(() => getSupabaseBrowserClient(), []);
  const configError = useMemo(() => getSupabaseConfigError(), []);

  const [checking, setChecking] = useState(true);
  const [userId, setUserId] = useState<string | null>(null);
  const [email, setEmail] = useState<string | null>(null);
  const [loans, setLoans] = useState<PersonalLoan[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [workingId, setWorkingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<LoanCategory | "Todas">("Todas");
  const [activeTab, setActiveTab] = useState<LoanTab>("active");
  const [formOpen, setFormOpen] = useState(false);
  const [form, setForm] = useState<LoanFormState>(createEmptyLoanForm);
  const [editingLoan, setEditingLoan] = useState<PersonalLoan | null>(null);

  const loadLoans = useCallback(
    async (currentUserId = userId) => {
      if (!supabase || !currentUserId) return;

      setLoading(true);
      setError(null);

      const { data, error: loadError } = await getLoans(supabase, currentUserId);

      setLoading(false);

      if (loadError) {
        setError(
          `${loadError.message}. Ejecuta supabase/personal_loans.sql en tu proyecto de Supabase.`
        );
        return;
      }

      setLoans(((data as PersonalLoanRow[] | null) ?? []).map(normalizeLoan));
    },
    [supabase, userId]
  );

  useEffect(() => {
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

      if (isSalonOnlyEmail(session.user.email)) {
        router.replace("/pretty-escritorio");
        return;
      }

      setUserId(session.user.id);
      setEmail(session.user.email ?? null);
      await loadLoans(session.user.id);
      setChecking(false);
    }

    loadSession();
  }, [loadLoans, router, supabase]);

  const activeLoans = useMemo(() => {
    return loans.filter((loan) => loan.status === "active");
  }, [loans]);

  const returnedLoans = useMemo(() => {
    return loans.filter((loan) => loan.status === "returned");
  }, [loans]);

  const unknownCategoryLoans = useMemo(() => {
    return activeLoans.filter((loan) => loan.category === "No lo sé");
  }, [activeLoans]);

  const summaryCounts = useMemo<LoanSummaryCounts>(() => {
    return {
      activeCount: activeLoans.length,
      activeBorrowersCount: new Set(activeLoans.map((loan) => loan.borrowerName.trim().toLowerCase())).size,
      unknownCount: unknownCategoryLoans.length,
      returnedCount: returnedLoans.length,
    };
  }, [activeLoans, returnedLoans, unknownCategoryLoans]);

  const visibleActiveLoans = useMemo(() => {
    return activeLoans.filter((loan) => {
      const categoryMatches =
        selectedCategory === "Todas" || loan.category === selectedCategory;
      return categoryMatches && matchesSearch(loan, search);
    });
  }, [activeLoans, search, selectedCategory]);

  const visibleUnknownLoans = useMemo(() => {
    return unknownCategoryLoans.filter((loan) => matchesSearch(loan, search));
  }, [search, unknownCategoryLoans]);

  const visibleReturnedLoans = useMemo(() => {
    return returnedLoans.filter((loan) => matchesSearch(loan, search));
  }, [returnedLoans, search]);

  const displayedLoans =
    activeTab === "history"
      ? visibleReturnedLoans
      : activeTab === "unknown"
        ? visibleUnknownLoans
        : visibleActiveLoans;

  function updateForm<K extends keyof LoanFormState>(
    field: K,
    value: LoanFormState[K]
  ) {
    setForm((current) => ({ ...current, [field]: value }));
  }

  function openCreateForm() {
    setEditingLoan(null);
    setForm(createEmptyLoanForm());
    setFormOpen(true);
  }

  function closeForm() {
    setEditingLoan(null);
    setForm(createEmptyLoanForm());
    setFormOpen(false);
  }

  function editLoan(loan: PersonalLoan) {
    setEditingLoan(loan);
    setForm({
      itemName: loan.itemName,
      borrowerName: loan.borrowerName,
      category: loan.category,
      loanDate: loan.loanDate,
      notes: loan.notes,
    });
    setFormOpen(true);
  }

  const saveLoan = useCallback(
    async (event: React.FormEvent<HTMLFormElement>) => {
      event.preventDefault();
      if (!supabase || !userId) return;

      if (!form.itemName.trim()) {
        alert("Escribe qué prestaste.");
        return;
      }

      if (!form.borrowerName.trim()) {
        alert("Escribe quién lo tiene.");
        return;
      }

      setSaving(true);

      const { error: saveError } = editingLoan
        ? await updateLoanRecord(supabase, editingLoan.id, userId, form)
        : await createLoanRecord(supabase, userId, form);

      setSaving(false);

      if (saveError) {
        alert(saveError.message);
        return;
      }

      await loadLoans(userId);
      closeForm();
    },
    [editingLoan, form, loadLoans, supabase, userId]
  );

  const markReturned = useCallback(
    async (loanId: string) => {
      if (!supabase || !userId) return;

      setWorkingId(loanId);
      const { error: returnError } = await markLoanReturned(supabase, loanId, userId);
      setWorkingId(null);

      if (returnError) {
        alert(returnError.message);
        return;
      }

      await loadLoans(userId);
    },
    [loadLoans, supabase, userId]
  );

  const restoreLoan = useCallback(
    async (loanId: string) => {
      if (!supabase || !userId) return;

      setWorkingId(loanId);
      const { error: restoreError } = await restoreLoanRecord(supabase, loanId, userId);
      setWorkingId(null);

      if (restoreError) {
        alert(restoreError.message);
        return;
      }

      await loadLoans(userId);
    },
    [loadLoans, supabase, userId]
  );

  const deleteLoan = useCallback(
    async (loanId: string) => {
      if (!supabase || !userId) return;

      const confirmed = window.confirm("¿Eliminar este registro?");
      if (!confirmed) return;

      setWorkingId(loanId);
      const { error: deleteError } = await deleteLoanRecord(supabase, loanId, userId);
      setWorkingId(null);

      if (deleteError) {
        alert(deleteError.message);
        return;
      }

      await loadLoans(userId);
    },
    [loadLoans, supabase, userId]
  );

  const changeLoanCategory = useCallback(
    async (loan: PersonalLoan, category: LoanCategory) => {
      if (!supabase || !userId) return;

      setWorkingId(loan.id);

      const { error: updateError } = await updateLoanRecord(supabase, loan.id, userId, {
        itemName: loan.itemName,
        borrowerName: loan.borrowerName,
        category,
        loanDate: loan.loanDate,
        notes: loan.notes,
      });

      setWorkingId(null);

      if (updateError) {
        alert(updateError.message);
        return;
      }

      await loadLoans(userId);
    },
    [loadLoans, supabase, userId]
  );

  const handleLogout = useCallback(async () => {
    if (!supabase) return;
    await supabase.auth.signOut();
    router.replace("/login");
  }, [router, supabase]);

  return {
    checking,
    supabase,
    configError,
    email,
    loading,
    saving,
    workingId,
    error,
    loans,
    activeLoans,
    returnedLoans,
    unknownCategoryLoans,
    displayedLoans,
    summaryCounts,
    search,
    setSearch,
    selectedCategory,
    setSelectedCategory,
    activeTab,
    setActiveTab,
    formOpen,
    form,
    editingLoan,
    updateForm,
    openCreateForm,
    closeForm,
    editLoan,
    saveLoan,
    loadLoans,
    markReturned,
    restoreLoan,
    deleteLoan,
    changeLoanCategory,
    handleLogout,
  };
}
