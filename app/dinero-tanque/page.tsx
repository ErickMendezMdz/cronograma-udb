import { ModuleShell } from "@/components/layout/ModuleShell";
import { DineroTanqueDashboard } from "@/features/dinero-tanque/components/DineroTanqueDashboard";

export default function DineroTanquePage() {
  return (
    <ModuleShell title="Dinero Tanque">
      <DineroTanqueDashboard />
    </ModuleShell>
  );
}
