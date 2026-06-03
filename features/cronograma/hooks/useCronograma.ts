"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  getSupabaseBrowserClient,
  getSupabaseConfigError,
} from "@/lib/supabaseClient";
import { isSalonOnlyEmail } from "@/lib/moduleAccess";
import {
  addDays,
  DOW_ES,
  formatISODate,
  startOfWeekMonday,
} from "@/lib/week";
import {
  createCronogramaEvent,
  deleteCronogramaEvent,
  loadCronogramaWeek,
  seedSubjectsIfEmpty,
  updateCronogramaEvent,
} from "@/features/cronograma/services/cronogramaService";
import type {
  CalendarBar,
  EventDraft,
  Subject,
  UniEvent,
  UniEventType,
} from "@/features/cronograma/types";

export function chipClass(type: UniEventType) {
  if (type === "evaluado_entrega") return "bg-rose-700 text-rose-50";
  if (type === "reunion") return "bg-amber-400 text-slate-950";
  return "bg-emerald-700 text-emerald-50";
}

function clamp(n: number, min: number, max: number) {
  return Math.max(min, Math.min(max, n));
}

function dayIndexFromMonday(iso: string, monday: Date) {
  const [y, m, d] = iso.split("-").map(Number);
  const dt = new Date(y, m - 1, d);
  const ms = dt.getTime() - monday.getTime();
  return Math.floor(ms / (1000 * 60 * 60 * 24));
}

function assignLanes(bars: Omit<CalendarBar, "lane">[]): CalendarBar[] {
  const sorted = [...bars].sort((a, b) =>
    a.startIdx !== b.startIdx ? a.startIdx - b.startIdx : a.endIdx - b.endIdx
  );

  const laneEnds: number[] = [];
  const out: CalendarBar[] = [];

  for (const bar of sorted) {
    let lane = 0;
    while (true) {
      if (laneEnds[lane] == null || laneEnds[lane] < bar.startIdx) {
        laneEnds[lane] = bar.endIdx;
        out.push({ ...bar, lane });
        break;
      }
      lane++;
    }
  }
  return out;
}

function emptyDraft(): EventDraft {
  return {
    subjectId: "",
    title: "",
    type: "teorica",
    startDate: "",
    endDate: "",
    weight: "",
  };
}

function draftFromEvent(event: UniEvent): EventDraft {
  return {
    subjectId: event.subject_id,
    title: event.title,
    type: event.type,
    startDate: event.date,
    endDate: event.end_date ?? event.date,
    weight: event.weight_percent != null ? String(event.weight_percent) : "",
  };
}

function parseWeight(value: string) {
  const weightNum = value.trim() ? Number(value) : null;
  if (
    weightNum !== null &&
    (Number.isNaN(weightNum) || weightNum < 0 || weightNum > 100)
  ) {
    return { weight: null, error: "El % debe ser un número entre 0 y 100 (o vacío)." };
  }

  return { weight: weightNum, error: null };
}

export function useCronograma() {
  const router = useRouter();
  const supabase = useMemo(() => getSupabaseBrowserClient(), []);
  const configError = useMemo(() => getSupabaseConfigError(), []);
  const headerRef = useRef<HTMLDivElement | null>(null);

  const [gridHeight, setGridHeight] = useState<number>(520);
  const [checking, setChecking] = useState(true);
  const [weekAnchor, setWeekAnchor] = useState<Date>(() => new Date());
  const monday = useMemo(() => startOfWeekMonday(weekAnchor), [weekAnchor]);
  const todayISO = useMemo(() => formatISODate(new Date()), []);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [events, setEvents] = useState<UniEvent[]>([]);
  const [loadingData, setLoadingData] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [editing, setEditing] = useState<UniEvent | null>(null);
  const [draft, setDraft] = useState<EventDraft>(emptyDraft);

  useEffect(() => {
    const recalc = () => {
      const headerH = headerRef.current?.getBoundingClientRect().height ?? 0;
      const vh = window.innerHeight;
      setGridHeight(Math.max(360, vh - headerH - 16));
    };

    recalc();
    window.addEventListener("resize", recalc);
    return () => window.removeEventListener("resize", recalc);
  }, []);

  useEffect(() => {
    if (modalOpen || editOpen) {
      const prev = document.body.style.overflow;
      document.body.style.overflow = "hidden";
      return () => {
        document.body.style.overflow = prev;
      };
    }
  }, [modalOpen, editOpen]);

  const loadWeekData = useCallback(
    async (weekStart = monday) => {
      if (!supabase) return;

      setLoadingData(true);
      const result = await loadCronogramaWeek(supabase, weekStart);

      if (result.error || !result.subjects || !result.events) {
        alert(result.error ?? "No se pudieron cargar los datos.");
        setLoadingData(false);
        return;
      }

      setSubjects(result.subjects);
      setEvents(result.events);
      setLoadingData(false);
    },
    [monday, supabase]
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

      setChecking(false);
    }
    loadSession();
  }, [router, supabase]);

  useEffect(() => {
    if (!checking) {
      void Promise.resolve().then(() => loadWeekData(monday));
    }
  }, [checking, loadWeekData, monday]);

  const weekDays = useMemo(() => {
    return Array.from({ length: 7 }).map((_, i) => {
      const day = addDays(monday, i);
      return {
        iso: formatISODate(day),
        dowLabel: DOW_ES[i],
        dayNum: day.getDate(),
        monthLabel: day.toLocaleDateString("es-SV", { month: "short" }),
      };
    });
  }, [monday]);

  const barsBySubject = useMemo(() => {
    const map = new Map<string, CalendarBar[]>();

    for (const subject of subjects) {
      const list: Omit<CalendarBar, "lane">[] = events
        .filter((event) => event.subject_id === subject.id)
        .map((event) => {
          const startIdx = clamp(dayIndexFromMonday(event.date, monday), 0, 6);
          const endIdx = clamp(
            dayIndexFromMonday(event.end_date ?? event.date, monday),
            0,
            6
          );
          return {
            ...event,
            startIdx: Math.min(startIdx, endIdx),
            endIdx: Math.max(startIdx, endIdx),
          };
        });

      map.set(subject.id, assignLanes(list));
    }

    return map;
  }, [events, monday, subjects]);

  const openAddModal = useCallback((subjectId: string, iso: string) => {
    setDraft({
      subjectId,
      title: "",
      type: "teorica",
      startDate: iso,
      endDate: iso,
      weight: "",
    });
    setModalOpen(true);
  }, []);

  const openEditModal = useCallback((event: UniEvent) => {
    setEditing(event);
    setDraft(draftFromEvent(event));
    setEditOpen(true);
  }, []);

  const saveEvent = useCallback(async () => {
    if (!supabase) return alert(configError ?? "Falta configurar Supabase.");
    if (!draft.title.trim()) return alert("Poné un título.");

    const end = draft.endDate || draft.startDate;
    if (end < draft.startDate) {
      return alert("La fecha 'Hasta' no puede ser menor al inicio.");
    }

    const { data: sessionData } = await supabase.auth.getSession();
    const user = sessionData.session?.user;
    if (!user) return;

    const { weight, error } = parseWeight(draft.weight);
    if (error) return alert(error);

    const { error: insertError } = await createCronogramaEvent(
      supabase,
      user.id,
      { ...draft, endDate: end },
      weight
    );

    if (insertError) return alert(insertError.message);

    setModalOpen(false);
    await loadWeekData(monday);
  }, [configError, draft, loadWeekData, monday, supabase]);

  const updateEvent = useCallback(async () => {
    if (!supabase) return alert(configError ?? "Falta configurar Supabase.");
    if (!editing) return;
    if (!draft.title.trim()) return alert("Poné un título.");

    const end = draft.endDate || draft.startDate;
    if (end < draft.startDate) {
      return alert("La fecha 'Hasta' no puede ser menor al inicio.");
    }

    const { weight, error } = parseWeight(draft.weight);
    if (error) return alert(error);

    const { error: updateError } = await updateCronogramaEvent(
      supabase,
      editing.id,
      { ...draft, endDate: end },
      weight
    );

    if (updateError) return alert(updateError.message);

    setEditOpen(false);
    setEditing(null);
    await loadWeekData(monday);
  }, [configError, draft, editing, loadWeekData, monday, supabase]);

  const deleteEvent = useCallback(async () => {
    if (!supabase) return alert(configError ?? "Falta configurar Supabase.");
    if (!editing) return;
    const ok = confirm(`¿Eliminar "${editing.title}"?`);
    if (!ok) return;

    const { error } = await deleteCronogramaEvent(supabase, editing.id);
    if (error) return alert(error.message);

    setEditOpen(false);
    setEditing(null);
    await loadWeekData(monday);
  }, [configError, editing, loadWeekData, monday, supabase]);

  const seedSubjects = useCallback(async () => {
    if (!supabase) return alert(configError ?? "Falta configurar Supabase.");

    try {
      const res = await seedSubjectsIfEmpty(supabase);
      if (res.seeded) alert("Materias cargadas ✅");
      await loadWeekData(monday);
    } catch (e: unknown) {
      alert(e instanceof Error ? e.message : "Error sembrando materias");
    }
  }, [configError, loadWeekData, monday, supabase]);

  const handleLogout = useCallback(async () => {
    if (!supabase) return;
    await supabase.auth.signOut();
    router.replace("/login");
  }, [router, supabase]);

  return {
    checking,
    supabase,
    configError,
    headerRef,
    gridHeight,
    weekAnchor,
    setWeekAnchor,
    monday,
    todayISO,
    subjects,
    loadingData,
    modalOpen,
    setModalOpen,
    editOpen,
    setEditOpen,
    editing,
    setEditing,
    draft,
    setDraft,
    weekDays,
    barsBySubject,
    openAddModal,
    openEditModal,
    saveEvent,
    updateEvent,
    deleteEvent,
    seedSubjects,
    handleLogout,
  };
}
