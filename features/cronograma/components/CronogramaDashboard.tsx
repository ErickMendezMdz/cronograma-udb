"use client";

import { Button } from "@/components/ui/Button";
import { EventModal } from "@/features/cronograma/components/EventModal";
import { WeekNavigator } from "@/features/cronograma/components/WeekNavigator";
import { WeeklyCalendarGrid } from "@/features/cronograma/components/WeeklyCalendarGrid";
import { useCronograma } from "@/features/cronograma/hooks/useCronograma";

export function CronogramaDashboard() {
  const {
    checking,
    supabase,
    configError,
    headerRef,
    gridHeight,
    weekAnchor,
    setWeekAnchor,
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
  } = useCronograma();

  if (checking) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        Cargando...
      </div>
    );
  }

  if (!supabase) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-transparent p-4">
        <div className="w-full max-w-lg rounded-2xl border border-red-900 bg-slate-900/90 p-6 shadow-2xl shadow-black/30">
          <h1 className="text-xl font-semibold">Configuración incompleta</h1>
          <p className="mt-2 text-sm text-slate-300">
            {configError ??
              "Falta configurar las variables públicas de Supabase."}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="text-slate-100">
      <div
        ref={headerRef}
        className="rounded-2xl border border-slate-700/70 bg-slate-900/85 px-3 py-2 shadow-2xl shadow-black/20 backdrop-blur sm:px-5 sm:py-3"
      >
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <h4 className="truncate text-base font-semibold sm:text-xl">
              Cronograma
            </h4>
          </div>

          <WeekNavigator
            weekAnchor={weekAnchor}
            setWeekAnchor={setWeekAnchor}
            seedSubjects={seedSubjects}
          />

          <Button
            onClick={handleLogout}
            variant="secondary"
            className="px-3 py-2 text-xs sm:text-sm"
          >
            Salir
          </Button>
        </div>
      </div>

      <WeeklyCalendarGrid
        gridHeight={gridHeight}
        loadingData={loadingData}
        subjects={subjects}
        weekDays={weekDays}
        todayISO={todayISO}
        barsBySubject={barsBySubject}
        openAddModal={openAddModal}
        openEditModal={openEditModal}
      />

      {modalOpen && (
        <EventModal
          title="Agregar actividad"
          draft={draft}
          setDraft={setDraft}
          close={() => setModalOpen(false)}
          submit={saveEvent}
          submitLabel="Guardar"
        />
      )}

      {editOpen && editing && (
        <EventModal
          title="Editar actividad"
          draft={draft}
          setDraft={setDraft}
          close={() => {
            setEditOpen(false);
            setEditing(null);
          }}
          submit={updateEvent}
          submitLabel="Guardar cambios"
          secondaryAction={{
            label: "Eliminar",
            onClick: deleteEvent,
          }}
        />
      )}
    </div>
  );
}
