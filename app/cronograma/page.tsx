export const dynamic = "force-dynamic";

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
  date: string; // YYYY-MM-DD
  weight_percent: number | null;
};

function chipClass(t: UniEvent["type"]) {
  if (t === "evaluado_entrega") return "bg-red-600 text-white";
  if (t === "reunion") return "bg-yellow-300 text-black";
  return "bg-green-600 text-white";
}

// Color pro para “HOY”
const TODAY_HEAD = "bg-indigo-50 ring-1 ring-indigo-200";
const TODAY_CELL = "bg-indigo-50/60 ring-1 ring-inset ring-indigo-200";

export default function CronogramaPage() {
  const router = useRouter();

  const [checking, setChecking] = useState(true);
  const [email, setEmail] = useState<string | null>(null);

  const [weekAnchor, setWeekAnchor] = useState<Date>(() => new Date());
  const monday = useMemo(() => startOfWeekMonday(weekAnchor), [weekAnchor]);
  const weekLabel = useMemo(() => formatHeaderRange(monday), [monday]);

  // ✅ ISO del día actual (para resaltar columna)
  const todayISO = useMemo(() => formatISODate(new Date()), []);

  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [events, setEvents] = useState<UniEvent[]>([]);
  const [loadingData, setLoadingData] = useState(false);

  // Modal: agregar
  const [modalOpen, setModalOpen] = useState(false);
  const [modalSubjectId, setModalSubjectId] = useState<string>("");
  const [modalDate, setModalDate] = useState<string>("");
  const [title, setTitle] = useState("");
  const [type, setType] = useState<UniEvent["type"]>("teorica");
  const [weight, setWeight] = useState<string>("");

  // Modal: editar/borrar
  const [editOpen, setEditOpen] = useState(false);
  const [editing, setEditing] = useState<UniEvent | null>(null);
  const [editTitle, setEditTitle] = useState("");
  const [editType, setEditType] = useState<UniEvent["type"]>("teorica");
  const [editWeight, setEditWeight] = useState<string>("");

  // ✅ Bloquear scroll del fondo cuando haya modal (móvil friendly)
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

    const start = formatISODate(monday);
    const endExclusive = formatISODate(addDays(monday, 7));

    const { data: ev, error: e2 } = await supabase
      .from("uni_events")
      .select("id, subject_id, title, type, date, weight_percent")
      .gte("date", start)
      .lt("date", endExclusive);

    if (e2) {
      alert(e2.message);
      setLoadingData(false);
      return;
    }

    setEvents((ev ?? []) as UniEvent[]);
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

  function eventsForCell(subjectId: string, iso: string) {
    return events
      .filter((e) => e.subject_id === subjectId && e.date === iso)
      .sort((a, b) => a.title.localeCompare(b.title));
  }

  function openAddModal(subjectId: string, dateISO: string) {
    setModalSubjectId(subjectId);
    setModalDate(dateISO);
    setTitle("");
    setType("teorica");
    setWeight("");
    setModalOpen(true);
  }

  async function saveEvent() {
    if (!title.trim()) return alert("Poné un título.");

    const { data: sessionData } = await supabase.auth.getSession();
    const user = sessionData.session?.user;
    if (!user) return;

    const weightNum = weight.trim() ? Number(weight) : null;
    if (
      weightNum !== null &&
      (Number.isNaN(weightNum) || weightNum < 0 || weightNum > 100)
    ) {
      return alert("El % debe ser un número entre 0 y 100 (o vacío).");
    }

    const { error } = await supabase.from("uni_events").insert({
      owner_id: user.id,
      subject_id: modalSubjectId,
      title: title.trim(),
      type,
      date: modalDate,
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
    setEditOpen(true);
  }

  async function updateEvent() {
    if (!editing) return;
    if (!editTitle.trim()) return alert("Poné un título.");

    const weightNum = editWeight.trim() ? Number(editWeight) : null;
    if (
      weightNum !== null &&
      (Number.isNaN(weightNum) || weightNum < 0 || weightNum > 100)
    ) {
      return alert("El % debe ser un número entre 0 y 100 (o vacío).");
    }

    const { error } = await supabase
      .from("uni_events")
      .update({
        title: editTitle.trim(),
        type: editType,
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

  if (checking) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        Cargando...
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-2 sm:p-4">
      <div className="max-w-7xl mx-auto">
        {/* HEADER COMPACTO */}
        <div className="bg-white rounded-2xl shadow p-3 sm:p-5">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <h1 className="text-base sm:text-xl font-semibold truncate">
                Cronograma
              </h1>
              <p className="text-[11px] sm:text-sm text-gray-500 truncate">
                {weekLabel}
              </p>
              {email && (
                <p className="text-[11px] text-gray-400 truncate mt-0.5">
                  {email}
                </p>
              )}
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
            Tip: deslizá la tabla a los lados (como Excel). El día de hoy queda
            resaltado.
          </p>
        </div>

        {/* TABLA */}
        <div className="mt-3 bg-white rounded-2xl shadow overflow-hidden">
          <div className="overflow-x-auto [-webkit-overflow-scrolling:touch]">
            <table className="min-w-[760px] sm:min-w-[860px] w-full border-collapse">
              <thead>
                <tr className="bg-gray-100">
                  <th className="sticky left-0 bg-gray-100 z-20 text-left px-2 py-2 border-b w-20 sm:w-44 text-sm">
                    Materias
                  </th>

                  {weekDays.map((d) => (
                    <th
                      key={d.iso}
                      className={[
                        "px-1.5 py-2 border-b text-center min-w-24 sm:min-w-36",
                        d.iso === todayISO ? TODAY_HEAD : "",
                      ].join(" ")}
                    >
                      <div className="font-semibold text-xs sm:text-sm">
                        {d.dowLabel}
                      </div>
                      <div className="text-[10px] text-gray-500 capitalize">
                        {d.monthLabel}
                      </div>
                      <div className="text-xs sm:text-sm">{d.dayNum}</div>
                      {d.iso === todayISO && (
                        <div className="mt-1 text-[10px] font-semibold text-indigo-700">
                          HOY
                        </div>
                      )}
                    </th>
                  ))}
                </tr>
              </thead>

              <tbody>
                {loadingData ? (
                  <tr>
                    <td colSpan={8} className="p-6 text-center text-gray-500">
                      Cargando...
                    </td>
                  </tr>
                ) : subjects.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="p-6 text-center text-gray-500">
                      No hay materias. Dale a <b>“Cargar materias”</b>.
                    </td>
                  </tr>
                ) : (
                  subjects.map((s) => (
                    <tr key={s.id} className="border-t">
                      <td className="sticky left-0 bg-white z-10 px-2 py-2 border-r font-semibold text-sm">
                        {s.code}
                      </td>

                      {weekDays.map((d) => {
                        const cellEvents = eventsForCell(s.id, d.iso);
                        const visible = cellEvents.slice(0, 2);
                        const hiddenCount = Math.max(
                          0,
                          cellEvents.length - visible.length
                        );

                        return (
                          <td
                            key={d.iso}
                            className={[
                              "px-1.5 py-2 align-top border-r border-gray-100 cursor-pointer",
                              d.iso === todayISO
                                ? TODAY_CELL
                                : "hover:bg-gray-50",
                            ].join(" ")}
                            onClick={() => openAddModal(s.id, d.iso)}
                            title="Tocar para agregar"
                          >
                            <div className="min-h-[64px]">
                              <div className="flex flex-col gap-1">
                                {visible.map((e) => (
                                  <button
                                    key={e.id}
                                    type="button"
                                    onClick={(evt) => {
                                      evt.stopPropagation();
                                      openEditModal(e);
                                    }}
                                    className={[
                                      "rounded-md px-2 py-1 text-left font-medium",
                                      "text-[11px] leading-tight",
                                      "whitespace-normal break-words",
                                      chipClass(e.type),
                                    ].join(" ")}
                                    title="Editar / borrar"
                                  >
                                    {e.title}
                                    {e.weight_percent != null
                                      ? ` (${e.weight_percent}%)`
                                      : ""}
                                  </button>
                                ))}

                                {hiddenCount > 0 && (
                                  <button
                                    type="button"
                                    onClick={(evt) => {
                                      evt.stopPropagation();
                                      openEditModal(cellEvents[visible.length]);
                                    }}
                                    className="text-[11px] text-gray-600 text-left underline"
                                    title="Ver más"
                                  >
                                    +{hiddenCount} más
                                  </button>
                                )}
                              </div>
                            </div>
                          </td>
                        );
                      })}
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Leyenda */}
          <div className="p-3 border-t text-xs text-gray-600 flex flex-wrap gap-3">
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

      {/* ✅ MODAL (agregar) */}
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
              <button
                onClick={() => setModalOpen(false)}
                className="rounded-lg px-3 py-1 hover:bg-gray-100"
              >
                ✕
              </button>
            </div>

            <p className="text-sm text-gray-500 mt-1">
              Fecha: <b>{modalDate}</b>
            </p>

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
                <button
                  onClick={saveEvent}
                  className="flex-1 rounded-xl bg-black text-white py-3 font-medium"
                >
                  Guardar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ✅ MODAL (editar/borrar) */}
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

            <p className="text-sm text-gray-500 mt-1">
              Fecha: <b>{editing.date}</b>
            </p>

            <div className="mt-4 space-y-3">
              <div>
                <label className="text-sm font-medium">Título</label>
                <input
                  className="mt-1 w-full rounded-xl border p-3 outline-none focus:ring"
                  value={editTitle}
                  onChange={(e) => setEditTitle(e.target.value)}
                />
              </div>

              <div>
                <label className="text-sm font-medium">Tipo</label>
                <select
                  className="mt-1 w-full rounded-xl border p-3 outline-none focus:ring bg-white"
                  value={editType}
                  onChange={(e) =>
                    setEditType(e.target.value as UniEvent["type"])
                  }
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
                <button
                  onClick={deleteEvent}
                  className="flex-1 rounded-xl border py-3 font-medium hover:bg-gray-100"
                >
                  Eliminar
                </button>
                <button
                  onClick={updateEvent}
                  className="flex-1 rounded-xl bg-black text-white py-3 font-medium"
                >
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

