type PrettyMetricCardProps = {
  label: string;
  value: string;
  detail: string;
  accent: string;
};

export function PrettyMetricCard({
  label,
  value,
  detail,
  accent,
}: PrettyMetricCardProps) {
  return (
    <article className="min-w-0 rounded-lg border border-[#30333a] bg-[#181a1e] p-4 shadow-lg shadow-black/15">
      <div className="flex items-start justify-between gap-3">
        <p className="text-sm text-[#a9b0ba]">{label}</p>
        <span className="h-3 w-3 rounded-sm" style={{ backgroundColor: accent }} />
      </div>
      <p className="mt-4 break-words text-2xl font-semibold text-[#f7f9fb] sm:text-3xl">
        {value}
      </p>
      <p className="mt-2 text-sm text-[#a9b0ba]">{detail}</p>
    </article>
  );
}
