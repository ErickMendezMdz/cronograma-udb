import { ModuleShell } from "@/components/layout/ModuleShell";
import { PrettySalonDashboard } from "@/features/pretty-salon/components/PrettySalonDashboard";

export default function PrettyEscritorioPage() {
  return (
    <ModuleShell title="Pretty Salon" chrome={false} className="bg-[#101113] p-0" contentClassName="mt-0">
      <PrettySalonDashboard />
    </ModuleShell>
  );
}
