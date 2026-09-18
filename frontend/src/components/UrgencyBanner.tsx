import { safeUrgency, urgencyPresentation } from "@/lib/presentation";

interface UrgencyBannerProps {
  urgency: string;
}

export function UrgencyBanner({ urgency }: UrgencyBannerProps) {
  const presentation = urgencyPresentation[safeUrgency(urgency)];
  return (
    <section className={`flex items-start gap-4 rounded-2xl border p-4 sm:p-5 ${presentation.panel}`} aria-label={`Urgency: ${presentation.label}`}>
      <span className={`mt-0.5 grid h-10 w-10 shrink-0 place-items-center rounded-xl text-white ${presentation.icon}`} aria-hidden="true">
        {safeUrgency(urgency) === "ROUTINE" ? "✓" : safeUrgency(urgency) === "URGENT" ? "!" : "!"}
      </span>
      <div>
        <p className="text-sm font-extrabold uppercase tracking-[0.12em] opacity-75">Urgency indicator</p>
        <h3 className="mt-0.5 text-xl font-extrabold">{presentation.label}</h3>
        <p className="mt-1 text-sm leading-6">{presentation.description}</p>
      </div>
    </section>
  );
}
