export type LanguageCode = "en" | "hi" | "ta" | "te" | "kn" | "bn" | "mr";

export type ResultStatus = "NORMAL" | "BORDERLINE" | "CRITICAL";
export type UrgencyLevel = "ROUTINE" | "SEE_DOCTOR_SOON" | "URGENT";

export interface PatientInfo {
  name: string;
  age: string;
  sex: string;
  lab_name: string;
  report_date: string;
}

export interface LabResult {
  test_name: string;
  value: string;
  unit: string;
  reference_range: string;
  status: ResultStatus;
  explanation: string;
}

export interface Trend {
  test_name: string;
  previous_value: string;
  current_value: string;
  unit: string;
  previous_report_date: string;
  change: string;
  direction: "UP" | "DOWN" | "UNCHANGED" | string;
  message: string;
}

export interface ReportAnalysis {
  patient_info: PatientInfo;
  results: LabResult[];
  summary: string;
  urgency: UrgencyLevel;
  recommendations: string[];
  disclaimer: string;
  trends: Trend[];
  translation_notice?: string;
}

export interface UploadReportResponse {
  reportId: string;
  status: "UPLOADED";
  createdAt: string;
  message: string;
}

export interface AnalyzeReportResponse {
  reportId: string;
  status: "COMPLETED";
  language: LanguageCode;
  languageUsed: LanguageCode;
  createdAt: string;
  completedAt: string;
  analysis: ReportAnalysis;
}

export interface HistoryReport {
  reportId: string;
  status: "UPLOADED" | "ANALYZING" | "COMPLETED" | "FAILED" | string;
  createdAt: string;
  completedAt: string;
  fileName: string;
  language: LanguageCode;
  urgency: UrgencyLevel;
  patientInfo: PatientInfo;
  summary: string;
  results: Omit<LabResult, "explanation">[];
  trends: Trend[];
}

export interface HistoryResponse {
  reports: HistoryReport[];
  nextToken: string | null;
  count: number;
}

export interface AuthUser {
  userId: string;
  username: string;
}
