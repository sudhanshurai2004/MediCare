import { safeStatus, statusPresentation } from "@/lib/presentation";

interface StatusBadgeProps {
  status: string;
  compact?: boolean;
}

export function StatusBadge({ status, compact = false }: StatusBadgeProps) {
  const presentation = statusPresentation[safeStatus(status)];
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full border font-extrabold ${compact ? "px-2.5 py-1 text-xs" : "px-3 py-1.5 text-sm"} ${presentation.badge}`}>
      <span className={`h-2 w-2 rounded-full ${presentation.dot}`} aria-hidden="true" />
      {presentation.label}
    </span>
  );
}
