"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { getSupabaseBrowserClient, getSupabaseConfigError } from "@/lib/supabaseClient";
import { isSalonOnlyEmail } from "@/lib/moduleAccess";
import {
  addPurchase as addPurchaseRecord,
  closeCase as closeCaseRecord,
  createAccount as createAccountRecord,
  createAllocation as createAllocationRecord,
  createCard as createCardRecord,
  createPayment as createPaymentRecord,
  createSharedCase,
  deleteAllocation as deleteAllocationRecord,
  deleteParticipant as deleteParticipantRecord,
  deletePayment as deletePaymentRecord,
  deletePurchase as deletePurchaseRecord,
  loadReminderData,
  updateCard as updateCardRecord,
  updateParticipantName as updateParticipantNameRecord,
  updatePurchaseDescription as updatePurchaseDescriptionRecord,
} from "@/features/recordatorios/services/remindersService";
import type {
  CreditCard,
  NewAllocationInput,
  NewCaseInput,
  NewPaymentInput,
  NewPurchaseInput,
  SavingsAccount,
  SharedCase,
} from "@/features/recordatorios/types";

export function useSharedPurchases() {
  const router = useRouter();
  const supabase = useMemo(() => getSupabaseBrowserClient(), []);
  const configError = useMemo(() => getSupabaseConfigError(), []);
  const [checking, setChecking] = useState(true);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);
  const [email, setEmail] = useState<string | null>(null);
  const [cards, setCards] = useState<CreditCard[]>([]);
  const [accounts, setAccounts] = useState<SavingsAccount[]>([]);
  const [cases, setCases] = useState<SharedCase[]>([]);
  const [error, setError] = useState<string | null>(null);

  const reload = useCallback(async (ownerId = userId) => {
    if (!supabase || !ownerId) return;
    setLoading(true);
    setError(null);
    const result = await loadReminderData(supabase, ownerId);
    setLoading(false);
    if (result.error || !result.data) {
      setError(`${result.error?.message ?? "No se pudieron cargar los datos"}. Ejecuta supabase/recordatorios_compras.sql en Supabase.`);
      return;
    }
    setCards(result.data.cards);
    setAccounts(result.data.accounts);
    setCases(result.data.cases);
  }, [supabase, userId]);

  useEffect(() => {
    async function start() {
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
      await reload(session.user.id);
      setChecking(false);
    }
    start();
  }, [reload, router, supabase]);

  const run = useCallback(async (operation: () => Promise<{ error: { message: string } | null }>) => {
    setSaving(true);
    const result = await operation();
    setSaving(false);
    if (result.error) {
      setError(result.error.message);
      return false;
    }
    await reload();
    return true;
  }, [reload]);

  const createCard = useCallback(async (input: Omit<CreditCard, "id" | "active">) => {
    if (!supabase || !userId) return false;
    return run(() => createCardRecord(supabase, userId, input));
  }, [run, supabase, userId]);

  const createAccount = useCallback(async (name: string) => {
    if (!supabase || !userId) return false;
    return run(() => createAccountRecord(supabase, userId, name));
  }, [run, supabase, userId]);

  const updateCard = useCallback(async (
    cardId: string,
    input: Omit<CreditCard, "id" | "active">
  ) => {
    if (!supabase || !userId) return false;
    return run(() => updateCardRecord(supabase, userId, cardId, input));
  }, [run, supabase, userId]);

  const createCase = useCallback(async (input: NewCaseInput) => {
    if (!supabase || !userId) return false;
    return run(() => createSharedCase(supabase, userId, input));
  }, [run, supabase, userId]);

  const addPurchase = useCallback(async (sharedCase: SharedCase, input: NewPurchaseInput) => {
    if (!supabase || !userId) return false;
    return run(() => addPurchaseRecord(supabase, userId, sharedCase, input));
  }, [run, supabase, userId]);

  const createPayment = useCallback(async (input: NewPaymentInput) => {
    if (!supabase || !userId) return false;
    return run(() => createPaymentRecord(supabase, userId, input));
  }, [run, supabase, userId]);

  const createAllocation = useCallback(async (input: NewAllocationInput) => {
    if (!supabase || !userId) return false;
    return run(() => createAllocationRecord(supabase, userId, input));
  }, [run, supabase, userId]);

  const deletePayment = useCallback(async (paymentId: string) => {
    if (!supabase || !userId) return false;
    return run(() => deletePaymentRecord(supabase, userId, paymentId));
  }, [run, supabase, userId]);

  const deleteAllocation = useCallback(async (allocationId: string) => {
    if (!supabase || !userId) return false;
    return run(() => deleteAllocationRecord(supabase, userId, allocationId));
  }, [run, supabase, userId]);

  const deletePurchase = useCallback(async (purchaseId: string) => {
    if (!supabase || !userId) return false;
    return run(() => deletePurchaseRecord(supabase, userId, purchaseId));
  }, [run, supabase, userId]);

  const updatePurchaseDescription = useCallback(async (
    purchaseId: string,
    description: string
  ) => {
    if (!supabase || !userId) return false;
    return run(() => updatePurchaseDescriptionRecord(
      supabase,
      userId,
      purchaseId,
      description
    ));
  }, [run, supabase, userId]);

  const updateParticipantName = useCallback(async (
    participantId: string,
    name: string
  ) => {
    if (!supabase || !userId) return false;
    return run(() => updateParticipantNameRecord(
      supabase,
      userId,
      participantId,
      name
    ));
  }, [run, supabase, userId]);

  const deleteParticipant = useCallback(async (participantId: string) => {
    if (!supabase || !userId) return false;
    return run(() => deleteParticipantRecord(supabase, userId, participantId));
  }, [run, supabase, userId]);

  const toggleClosed = useCallback(async (sharedCase: SharedCase) => {
    if (!supabase || !userId) return false;
    return run(() => closeCaseRecord(supabase, userId, sharedCase.id, sharedCase.status === "active"));
  }, [run, supabase, userId]);

  const logout = useCallback(async () => {
    if (!supabase) return;
    await supabase.auth.signOut();
    router.replace("/login");
  }, [router, supabase]);

  return {
    checking, loading, saving, supabase, configError, email, cards, accounts,
    cases, error, setError, createCard, createAccount, updateCard, createCase, addPurchase,
    createPayment, createAllocation, deletePayment, deleteAllocation,
    deletePurchase, updatePurchaseDescription, updateParticipantName,
    deleteParticipant, toggleClosed, logout,
  };
}
