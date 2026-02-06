"use client";

export const dynamic = "force-dynamic";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";
import { seedSubjectsIfEmpty } from "@/lib/seedSubjects";
import {
  addDays,
  DOW_ES,
  formatHeaderRange,
  formatISODate,
  startOfWeekMonday,
} from "@/lib/week";

type Subject = {
  id: string;
  code: string;
  name: string | null;
  order_index: number;
};

type UniEvent = {
  id: string;
  subject_id: string;
  title: string;
  type: "evaluado_entrega" | "reunion" | "teorica";
  date: string; // start YYYY-MM-DD
  end_date: string; // end YYYY-MM-DD
  weight_percent: number | null;
};

function chipClass(t: UniEvent["type"]) {
  if (t === "evaluado_entrega") return "bg-red-600 text-white";
  if (t === "reunion") return "bg-yellow-300 text-black";
  return "bg-green-600 text-white";
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

type Bar = UniEvent & {
  startIdx: number; // 0..6
  endIdx: number; // 0..6
  lane: number; // 0..n
};

function assignLanes(bars: Omit<Bar, "lane">[]): Bar[] {
  const sorted = [...bars].sort((a, b) =>
    a.startIdx !== b.startIdx ? a.startIdx - b.startIdx : a.endIdx - b.endIdx
  );

  const laneEnds: number[] = [];
  const out: Bar[] = [];

  for (const b of sorted) {
    let lane = 0;
    while (true) {
      if (laneEnds[lane] == null || laneEnds[lane] < b.startIdx) {
        laneEnds[lane] = b.endIdx;
        out.push({ ...(b as any), lane });
        break;
      }
      lane++;
    }
  }
  return out;
}

const TODAY_HEAD = "bg-indigo-50 ring-1 ring-indigo-200";
const TODAY_CELL = "bg-indigo-50/60 ring-1 ring-inset ring-indigo-200";

export default function CronogramaPage() {
  const router = useRouter();

  const [checking, setChecking] = useState(true);
  const [email, setEmail] = useState<string | null>(null);

  const [weekAnchor, setWeekAnchor] = useState<Date>(() => new Date());
  const monday = useMemo(() => startOfWeekMonday(weekAnchor), [weekAnchor]);
  const weekLabel = useMemo(() => formatHeaderRange(monday), [monday]);
  const todayISO = useMemo(() => formatISODate(new Date()), []);

  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [events, setEvents] = useState<UniEvent[]>([]);
  const [loadingData, setLoadingData] = useState(false);

  // Modal agregar
  const [modalOpen, setModalOpen] = useState(false);
  const [modalSubjectId, setModalSubjectId] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [title, setTitle] = useState("");
  const [type, setType] = useState<UniEvent["type"]>("teorica");
  const [weight, setWeight] = useState<string>("");

  // Modal editar
  const [editOpen, setEditOpen] = useState(false);
  const [editing, setEditing] = useState<UniEvent | null>(null);
  const [editTitle, setEditTitle] = useState("");
  const [editType, setEditType] = useState<UniEvent["type"]>("teorica");
  const [editWeight, setEditWeight] = useState<string>("");
  const [editStart, setEditStart] = useState("");
  const [editEnd, setEditEnd] = useState("");

  // bloquear scroll cuando hay modal (móvil)
  useEffect(() => {
    if (modalOpen || editOpen) {
      const prev = document.body.style.overflow;
      document.body.style.overflow = "hidden";
      return () => {
        document.body.style.overflow = prev;
      };
    }
  }, [modalOpen, editOpen]);

  useEffect(() => {
    async function loadSession() {
      const { data } = await supabase.auth.getSession();
      const session = data.session;

      if (!session) {
        router.replace("/login");
        return;
      }

      setEmail(session.user.email ?? null);
      setChecking(false);
    }
    loadSession();
  }, [router]);

  async function handleLogout() {
    await supabase.auth.signOut();
    router.replace("/login");
  }

  async function loadWeekData() {
    setLoadingData(true);

    const { data: subj, error: e1 } = await supabase
      .from("uni_subjects")
      .select("id, code, name, order_index")
      .order("order_index", { ascending: true });

    if (e1) {
      alert(e1.message);
      setLoadingData(false);
      return;
    }
    setSubjects((subj ?? []) as Subject[]);

    // traer eventos que SOLAPAN con la semana
    const start = formatISODate(monday);
    const endExclusive = formatISODate(addDays(monday, 7));

    const { data: ev, error: e2 } = await supabase
      .from("uni_events")
      .select("id, subject_id, title, type, date, end_date, weight_percent")
      .lt("date", endExclusive)
      .gte("end_date", start);

    if (e2) {
      alert(e2.message);
      setLoadingData(false);
      return;
    }

    const normalized = (ev ?? []).map((x: any) => ({
      ...x,
      end_date: x.end_date ?? x.date,
    }));

    setEvents(normalized as UniEvent[]);
    setLoadingData(false);
  }

  useEffect(() => {
    if (!checking) loadWeekData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [checking, monday.getTime()]);

  const weekDays = useMemo(() => {
    return Array.from({ length: 7 }).map((_, i) => {
      const d = addDays(monday, i);
      return {
        iso: formatISODate(d),
        dowLabel: DOW_ES[i],
        dayNum: d.getDate(),
        monthLabel: d.toLocaleDateString("es-SV", { month: "short" }),
      };
    });
  }, [monday]);

  function openAddModal(subjectId: string, iso: string) {
    setModalSubjectId(subjectId);
    setStartDate(iso);
    setEndDate(iso);
    setTitle("");
    setType("teorica");
    setWeight("");
    setModalOpen(true);
  }

  async function saveEvent() {
    if (!title.trim()) return alert("Poné un título.");

    const end = endDate || startDate;
    if (end < startDate) return alert("La fecha 'Hasta' no puede ser menor al inicio.");

    const { data: sessionData } = await supabase.auth.getSession();
    const user = sessionData.session?.user;
    if (!user) return;

    const weightNum = weight.trim() ? Number(weight) : null;
    if (weightNum !== null && (Number.isNaN(weightNum) || weightNum < 0 || weightNum > 100)) {
      return alert("El % debe ser un número entre 0 y 100 (o vacío).");
    }

    const { error } = await supabase.from("uni_events").insert({
      owner_id: user.id,
      subject_id: modalSubjectId,
      title: title.trim(),
      type,
      date: startDate,
      end_date: end,
      weight_percent: weightNum,
    });

    if (error) return alert(error.message);

    setModalOpen(false);
    await loadWeekData();
  }

  function openEditModal(ev: UniEvent) {
    setEditing(ev);
    setEditTitle(ev.title);
    setEditType(ev.type);
    setEditWeight(ev.weight_percent != null ? String(ev.weight_percent) : "");
    setEditStart(ev.date);
    setEditEnd(ev.end_date ?? ev.date);
    setEditOpen(true);
  }

  async function updateEvent() {
    if (!editing) return;

    if (!editTitle.trim()) return alert("Poné un título.");
    const end = editEnd || editStart;
    if (end < editStart) return alert("La fecha 'Hasta' no puede ser menor al inicio.");

    const weightNum = editWeight.trim() ? Number(editWeight) : null;
    if (weightNum !== null && (Number.isNaN(weightNum) || weightNum < 0 || weightNum > 100)) {
      return alert("El % debe ser un número entre 0 y 100 (o vacío).");
    }

    const { error } = await supabase
      .from("uni_events")
      .update({
        title: editTitle.trim(),
        type: editType,
        date: editStart,
        end_date: end,
        weight_percent: weightNum,
      })
      .eq("id", editing.id);

    if (error) return alert(error.message);

    setEditOpen(false);
    setEditing(null);
    await loadWeekData();
  }

  async function deleteEvent() {
    if (!editing) return;
    const ok = confirm(`¿Eliminar "${editing.title}"?`);
    if (!ok) return;

    const { error } = await supabase.from("uni_events").delete().eq("id", editing.id);
    if (error) return alert(error.message);

    setEditOpen(false);
    setEditing(null);
    await loadWeekData();
  }

  async function seedSubjects() {
    try {
      const res = await seedSubjectsIfEmpty();
      if (res.seeded) alert("Materias cargadas ✅");
      await loadWeekData();
    } catch (e: any) {
      alert(e.message ?? "Error sembrando materias");
    }
  }

  const barsBySubject = useMemo(() => {
    const map = new Map<string, Bar[]>();

    for (const s of subjects) {
      const list = events
        .filter((e) => e.subject_id === s.id)
        .map((e) => {
          const startIdx = clamp(dayIndexFromMonday(e.date, monday), 0, 6);
          const endIdx = clamp(dayIndexFromMonday(e.end_date ?? e.date, monday), 0, 6);
          return {
            ...e,
            startIdx: Math.min(startIdx, endIdx),
            endIdx: Math.max(startIdx, endIdx),
          };
        });

      const withLanes = assignLanes(list as any);
      map.set(s.id, withLanes);
    }

    return map;
  }, [events, subjects, monday]);

  if (checking) {
    return <div className="min-h-screen flex items-center justify-center">Cargando...</div>;
  }

  // Ajustes visuales
  const subjectColWidth = 120; // px
  const dayMinWidth = 140; // px (podés bajar a 120 si querés más “compacto”)
  const laneHeight = 30; // px
  const baseRowHeight = 110; // px

  return (
    <div className="min-h-screen bg-gray-50 p-2 sm:p-4">
      <div className="max-w-7xl mx-auto">
        {/* HEADER */}
        <div className="bg-white rounded-2xl shadow p-3 sm:p-5">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <h1 className="text-base sm:text-xl font-semibold truncate">Cronograma</h1>
              <p className="text-[11px] sm:text-sm text-gray-500 truncate">{weekLabel}</p>
              {email && <p className="text-[11px] text-gray-400 truncate mt-0.5">{email}</p>}
            </div>

            <button
              onClick={handleLogout}
              className="rounded-xl border px-3 py-2 text-xs sm:text-sm font-medium hover:bg-gray-100"
            >
              Salir
            </button>
          </div>

          <div className="mt-2 flex gap-2 overflow-x-auto pb-1">
            <button
              onClick={() => setWeekAnchor(addDays(weekAnchor, -7))}
              className="shrink-0 rounded-xl border px-3 py-2 text-xs font-medium hover:bg-gray-100"
            >
              ← Semana
            </button>
            <button
              onClick={() => setWeekAnchor(new Date())}
              className="shrink-0 rounded-xl border px-3 py-2 text-xs font-medium hover:bg-gray-100"
            >
              Hoy
            </button>
            <button
              onClick={() => setWeekAnchor(addDays(weekAnchor, 7))}
              className="shrink-0 rounded-xl border px-3 py-2 text-xs font-medium hover:bg-gray-100"
            >
              Semana →
            </button>
            <button
              onClick={seedSubjects}
              className="shrink-0 rounded-xl bg-black text-white px-3 py-2 text-xs font-medium"
            >
              Cargar materias
            </button>
          </div>

          <p className="mt-1 text-[11px] text-gray-500">
            Tip: deslizá horizontal (como Excel). Tocá celda vacía = agregar. Tocá barra = editar/borrar.
          </p>
        </div>

        {/* GRID */}
        <div className="mt-3 bg-white rounded-2xl shadow overflow-hidden">
          <div className="overflow-x-auto [-webkit-overflow-scrolling:touch]">
            <div style={{ minWidth: subjectColWidth + 7 * dayMinWidth }}>
              {/* Header grid */}
              <div
                className="grid bg-gray-100 border-b border-gray-300"
                style={{
                  gridTemplateColumns: `${subjectColWidth}px repeat(7, minmax(${dayMinWidth}px, 1fr))`,
                }}
              >
                <div className="sticky left-0 z-20 bg-gray-100 px-3 py-4 font-semibold border-r border-gray-300">
                  Materias
                </div>

                {weekDays.map((d) => (
                  <div
                    key={d.iso}
                    className={[
                      "px-2 py-3 text-center border-l border-gray-300",
                      d.iso === todayISO ? TODAY_HEAD : "",
                    ].join(" ")}
                  >
                    <div className="font-semibold text-xs sm:text-sm">{d.dowLabel}</div>
                    <div className="text-[10px] text-gray-500 capitalize">{d.monthLabel}</div>
                    <div className="text-xs sm:text-sm">{d.dayNum}</div>
                    {d.iso === todayISO && (
                      <div className="mt-1 text-[10px] font-semibold text-indigo-700">HOY</div>
                    )}
                  </div>
                ))}
              </div>

              {/* Body */}
              {loadingData ? (
                <div className="p-6 text-center text-gray-500">Cargando...</div>
              ) : subjects.length === 0 ? (
                <div className="p-6 text-center text-gray-500">
                  No hay materias. Dale a <b>“Cargar materias”</b>.
                </div>
              ) : (
                subjects.map((s) => {
                  const bars = barsBySubject.get(s.id) ?? [];
                  const maxLane = bars.reduce((acc, b) => Math.max(acc, b.lane), -1);
                  const rowHeight = Math.max(baseRowHeight, (maxLane + 1) * laneHeight + 28);

                  return (
                    <div key={s.id} className="relative border-b border-gray-300" style={{ height: rowHeight }}>
                      {/* Grid base */}
                      <div
                        className="grid"
                        style={{
                          height: rowHeight,
                          gridTemplateColumns: `${subjectColWidth}px repeat(7, minmax(${dayMinWidth}px, 1fr))`,
                        }}
                      >
                        {/* Materia */}
                        <div className="sticky left-0 z-10 bg-white px-3 py-4 border-r border-gray-300 border-b border-gray-300 font-semibold h-full">
  {s.code}
</div>


                        {/* 7 celdas */}
                        {weekDays.map((d) => (
                          <div
                            key={d.iso}
                            className={[
                              "border-l border-gray-200 hover:bg-gray-50 cursor-pointer",
                              d.iso === todayISO ? TODAY_CELL : "",
                            ].join(" ")}
                            onClick={() => openAddModal(s.id, d.iso)}
                            title="Agregar actividad"
                          />
                        ))}
                      </div>

                      {/* Overlay barras ABSOLUTO */}
                      <div
  className="pointer-events-none absolute inset-0"
  style={{
    left: subjectColWidth,
    right: 0,
  }}
>
  {bars.map((b) => {
    const startCol = b.startIdx + 1;
    const endCol = b.endIdx + 2;
    const top = 12 + b.lane * laneHeight;

    return (
      <div
        key={b.id}
        className="absolute left-0 right-0"
        style={{
          top,
          display: "grid",
          gridTemplateColumns: `repeat(7, minmax(${dayMinWidth}px, 1fr))`,
        }}
      >






                              <button
                                type="button"
                                onClick={(evt) => {
                                  evt.stopPropagation();
                                  openEditModal(b);
                                }}
                                className={[
                                  "pointer-events-auto",
                                  "rounded-lg px-3 py-2 text-left font-semibold",
                                  "text-[12px] leading-tight",
                                  "whitespace-normal break-words",
                                  "shadow-sm",
                                  chipClass(b.type),
                                ].join(" ")}
                                style={{ gridColumn: `${startCol} / ${endCol}` }}
                                title="Editar / borrar"
                              >
                                {b.title}
                                {b.weight_percent != null ? ` (${b.weight_percent}%)` : ""}
                              </button>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* Leyenda */}
          <div className="p-3 border-t border-gray-300 text-xs text-gray-600 flex flex-wrap gap-3">
            <span className="flex items-center gap-2">
              <span className="w-3 h-3 rounded bg-red-600 inline-block" />
              Evaluado/Entrega
            </span>
            <span className="flex items-center gap-2">
              <span className="w-3 h-3 rounded bg-yellow-300 inline-block" />
              Reunión
            </span>
            <span className="flex items-center gap-2">
              <span className="w-3 h-3 rounded bg-green-600 inline-block" />
              Teórica
            </span>
            <span className="flex items-center gap-2">
              <span className="w-3 h-3 rounded bg-indigo-200 inline-block" />
              Hoy
            </span>
          </div>
        </div>
      </div>

      {/* MODAL agregar */}
      {modalOpen && (
        <div
          className="fixed inset-0 z-[9999] bg-black/50 flex items-end sm:items-center justify-center p-3 sm:p-4"
          onClick={() => setModalOpen(false)}
        >
          <div
            className="bg-white rounded-2xl shadow w-[calc(100vw-24px)] sm:w-full sm:max-w-md max-h-[85vh] overflow-y-auto p-5"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold">Agregar actividad</h2>
              <button onClick={() => setModalOpen(false)} className="rounded-lg px-3 py-1 hover:bg-gray-100">
                ✕
              </button>
            </div>

            <div className="mt-4 space-y-3">
              <div>
                <label className="text-sm font-medium">Título</label>
                <input
                  className="mt-1 w-full rounded-xl border p-3 outline-none focus:ring"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Ej: Parcial 1"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-sm font-medium">Desde</label>
                  <input
                    type="date"
                    className="mt-1 w-full rounded-xl border p-3 outline-none focus:ring"
                    value={startDate}
                    onChange={(e) => {
                      const v = e.target.value;
                      setStartDate(v);
                      if (endDate < v) setEndDate(v);
                    }}
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">Hasta</label>
                  <input
                    type="date"
                    className="mt-1 w-full rounded-xl border p-3 outline-none focus:ring"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                  />
                </div>
              </div>

              <div>
                <label className="text-sm font-medium">Tipo</label>
                <select
                  className="mt-1 w-full rounded-xl border p-3 outline-none focus:ring bg-white"
                  value={type}
                  onChange={(e) => setType(e.target.value as UniEvent["type"])}
                >
                  <option value="evaluado_entrega">Evaluado / Entrega (Rojo)</option>
                  <option value="reunion">Reunión (Amarillo)</option>
                  <option value="teorica">Teórica (Verde)</option>
                </select>
              </div>

              <div>
                <label className="text-sm font-medium">% (opcional)</label>
                <input
                  className="mt-1 w-full rounded-xl border p-3 outline-none focus:ring"
                  value={weight}
                  onChange={(e) => setWeight(e.target.value)}
                  placeholder="Ej: 20"
                  inputMode="numeric"
                />
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  onClick={() => setModalOpen(false)}
                  className="flex-1 rounded-xl border py-3 font-medium hover:bg-gray-100"
                >
                  Cancelar
                </button>
                <button onClick={saveEvent} className="flex-1 rounded-xl bg-black text-white py-3 font-medium">
                  Guardar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL editar */}
      {editOpen && editing && (
        <div
          className="fixed inset-0 z-[9999] bg-black/50 flex items-end sm:items-center justify-center p-3 sm:p-4"
          onClick={() => {
            setEditOpen(false);
            setEditing(null);
          }}
        >
          <div
            className="bg-white rounded-2xl shadow w-[calc(100vw-24px)] sm:w-full sm:max-w-md max-h-[85vh] overflow-y-auto p-5"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold">Editar actividad</h2>
              <button
                onClick={() => {
                  setEditOpen(false);
                  setEditing(null);
                }}
                className="rounded-lg px-3 py-1 hover:bg-gray-100"
              >
                ✕
              </button>
            </div>

            <div className="mt-4 space-y-3">
              <div>
                <label className="text-sm font-medium">Título</label>
                <input
                  className="mt-1 w-full rounded-xl border p-3 outline-none focus:ring"
                  value={editTitle}
                  onChange={(e) => setEditTitle(e.target.value)}
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-sm font-medium">Desde</label>
                  <input
                    type="date"
                    className="mt-1 w-full rounded-xl border p-3 outline-none focus:ring"
                    value={editStart}
                    onChange={(e) => {
                      const v = e.target.value;
                      setEditStart(v);
                      if (editEnd < v) setEditEnd(v);
                    }}
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">Hasta</label>
                  <input
                    type="date"
                    className="mt-1 w-full rounded-xl border p-3 outline-none focus:ring"
                    value={editEnd}
                    onChange={(e) => setEditEnd(e.target.value)}
                  />
                </div>
              </div>

              <div>
                <label className="text-sm font-medium">Tipo</label>
                <select
                  className="mt-1 w-full rounded-xl border p-3 outline-none focus:ring bg-white"
                  value={editType}
                  onChange={(e) => setEditType(e.target.value as UniEvent["type"])}
                >
                  <option value="evaluado_entrega">Evaluado / Entrega (Rojo)</option>
                  <option value="reunion">Reunión (Amarillo)</option>
                  <option value="teorica">Teórica (Verde)</option>
                </select>
              </div>

              <div>
                <label className="text-sm font-medium">% (opcional)</label>
                <input
                  className="mt-1 w-full rounded-xl border p-3 outline-none focus:ring"
                  value={editWeight}
                  onChange={(e) => setEditWeight(e.target.value)}
                  placeholder="Ej: 20"
                  inputMode="numeric"
                />
              </div>

              <div className="flex gap-2 pt-2">
                <button onClick={deleteEvent} className="flex-1 rounded-xl border py-3 font-medium hover:bg-gray-100">
                  Eliminar
                </button>
                <button onClick={updateEvent} className="flex-1 rounded-xl bg-black text-white py-3 font-medium">
                  Guardar cambios
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
