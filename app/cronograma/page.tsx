import { ModuleShell } from "@/components/layout/ModuleShell";
import { CronogramaDashboard } from "@/features/cronograma/components/CronogramaDashboard";

export const dynamic = "force-dynamic";

export default function CronogramaPage() {
  return (
    <ModuleShell title="Cronograma">
      <CronogramaDashboard />
    </ModuleShell>
  );
}
