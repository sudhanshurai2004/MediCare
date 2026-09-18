import type { LanguageCode, ResultStatus, UrgencyLevel } from "./types";

export const languageOptions: Array<{ code: LanguageCode; label: string; nativeLabel: string }> = [
  { code: "en", label: "English", nativeLabel: "English" },
  { code: "hi", label: "Hindi", nativeLabel: "हिंदी" },
  { code: "ta", label: "Tamil", nativeLabel: "தமிழ்" },
  { code: "te", label: "Telugu", nativeLabel: "తెలుగు" },
  { code: "kn", label: "Kannada", nativeLabel: "ಕನ್ನಡ" },
  { code: "bn", label: "Bengali", nativeLabel: "বাংলা" },
  { code: "mr", label: "Marathi", nativeLabel: "मराठी" },
];

export const statusPresentation: Record<ResultStatus, { label: string; badge: string; dot: string }> = {
  NORMAL: {
    label: "Normal",
    badge: "border-emerald-200 bg-emerald-50 text-emerald-800",
    dot: "bg-emerald-500",
  },
  BORDERLINE: {
    label: "Borderline",
    badge: "border-amber-200 bg-amber-50 text-amber-900",
    dot: "bg-amber-500",
  },
  CRITICAL: {
    label: "Critical",
    badge: "border-rose-200 bg-rose-50 text-rose-800",
    dot: "bg-rose-500",
  },
};

export const urgencyPresentation: Record<UrgencyLevel, { label: string; description: string; panel: string; icon: string }> = {
  ROUTINE: {
    label: "Routine",
    description: "No immediate action is indicated by this summary. Keep the report for your usual healthcare follow-up.",
    panel: "border-emerald-200 bg-emerald-50 text-emerald-950",
    icon: "bg-emerald-500",
  },
  SEE_DOCTOR_SOON: {
    label: "See Doctor Soon",
    description: "Please arrange a clinician review in the near future, especially if you have symptoms or an existing condition.",
    panel: "border-amber-200 bg-amber-50 text-amber-950",
    icon: "bg-amber-500",
  },
  URGENT: {
    label: "Urgent",
    description: "Please seek prompt medical guidance. If there are severe or rapidly worsening symptoms, use local emergency services.",
    panel: "border-rose-200 bg-rose-50 text-rose-950",
    icon: "bg-rose-500",
  },
};

export function safeStatus(status: string): ResultStatus {
  return status === "NORMAL" || status === "CRITICAL" || status === "BORDERLINE" ? status : "BORDERLINE";
}

export function safeUrgency(urgency: string): UrgencyLevel {
  return urgency === "URGENT" || urgency === "SEE_DOCTOR_SOON" || urgency === "ROUTINE" ? urgency : "ROUTINE";
}

export function displayDate(value: string): string {
  if (!value || value === "Not found" || value === "Not clearly shown") {
    return "Not found";
  }
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return value;
  }
  return new Intl.DateTimeFormat("en-IN", { day: "numeric", month: "short", year: "numeric" }).format(date);
}

export function displayValue(value: string, unit: string): string {
  return !unit || unit === "Not found" ? value : `${value} ${unit}`;
}
