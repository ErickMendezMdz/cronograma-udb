import { ModuleShell } from "@/components/layout/ModuleShell";
import { LoansDashboard } from "@/features/prestamos/components/LoansDashboard";

export default function PrestamosPage() {
  return (
    <ModuleShell title="Cosas Prestadas">
      <LoansDashboard />
    </ModuleShell>
  );
}
