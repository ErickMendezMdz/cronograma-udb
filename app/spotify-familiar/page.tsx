import { ModuleShell } from "@/components/layout/ModuleShell";
import { SpotifyFamilyDashboard } from "@/features/spotify-familiar/components/SpotifyFamilyDashboard";

export default function SpotifyFamiliarPage() {
  return (
    <ModuleShell title="Spotify Familiar">
      <SpotifyFamilyDashboard />
    </ModuleShell>
  );
}
