type PrettyEmptyStateProps = {
  message: string;
  className?: string;
};

export function PrettyEmptyState({ message, className = "" }: PrettyEmptyStateProps) {
  return (
    <div
      className={[
        "rounded-lg border border-dashed border-[#3a3f48] p-6 text-sm text-[#aeb5bf]",
        className,
      ].join(" ")}
    >
      {message}
    </div>
  );
}
