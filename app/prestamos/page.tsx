import { ModuleShell } from "@/components/layout/ModuleShell";
import { RemindersDashboard } from "@/features/recordatorios/components/RemindersDashboard";

export default function PrestamosPage() {
  return (
    <ModuleShell title="Recordatorios">
      <RemindersDashboard />
    </ModuleShell>
  );
}
