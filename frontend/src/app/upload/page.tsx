"use client";

import Link from "next/link";
import { ChangeEvent, DragEvent, useEffect, useRef, useState } from "react";

import { openAuthenticationDialog } from "@/components/AuthDialog";
import { StatusBadge } from "@/components/StatusBadge";
import { UrgencyBanner } from "@/components/UrgencyBanner";
import { authenticatedApiRequest, isApiConfigured } from "@/lib/api";
import { displayDate, displayValue, languageOptions } from "@/lib/presentation";
import type { AnalyzeReportResponse, LanguageCode, UploadReportResponse } from "@/lib/types";
import { useAuthSession } from "@/lib/useAuthSession";

const MAX_IMAGE_BYTES = 7 * 1024 * 1024;
const acceptedTypes = ["image/jpeg", "image/jpg", "image/png"];

function imageAsBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error("The image could not be read. Please choose it again."));
    reader.onload = () => {
      if (typeof reader.result !== "string") {
        reject(new Error("The image could not be read. Please choose it again."));
        return;
      }
      const commaIndex = reader.result.indexOf(",");
      resolve(commaIndex >= 0 ? reader.result.slice(commaIndex + 1) : reader.result);
    };
    reader.readAsDataURL(file);
  });
}

function trendIcon(direction: string): string {
  if (direction === "UP") return "↑";
  if (direction === "DOWN") return "↓";
  return "→";
}

export default function UploadPage() {
  const inputRef = useRef<HTMLInputElement>(null);
  const previewUrlRef = useRef<string | null>(null);
  const { user, loading: authLoading, configurationError } = useAuthSession();
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [language, setLanguage] = useState<LanguageCode>("en");
  const [uploadedReportId, setUploadedReportId] = useState<string | null>(null);
  const [result, setResult] = useState<AnalyzeReportResponse | null>(null);
  const [isWorking, setIsWorking] = useState(false);
  const [progress, setProgress] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    return () => {
      if (previewUrlRef.current) {
        URL.revokeObjectURL(previewUrlRef.current);
      }
    };
  }, []);

  const clearFile = () => {
    if (previewUrlRef.current) {
      URL.revokeObjectURL(previewUrlRef.current);
      previewUrlRef.current = null;
    }
    setFile(null);
    setPreviewUrl(null);
    setUploadedReportId(null);
    setResult(null);
    setError("");
    setProgress("");
    if (inputRef.current) {
      inputRef.current.value = "";
    }
  };

  const chooseFile = (candidate: File | undefined) => {
    if (!candidate) return;
    setError("");
    setResult(null);
    setUploadedReportId(null);
    setProgress("");
    if (!acceptedTypes.includes(candidate.type)) {
      clearFile();
      setError("Please choose a JPG or PNG image. PDF and HEIC files are not supported on this upload route.");
      return;
    }
    if (candidate.size === 0) {
      clearFile();
      setError("That image is empty. Please choose a clear report photo.");
      return;
    }
    if (candidate.size > MAX_IMAGE_BYTES) {
      clearFile();
      setError("This image is larger than 7 MB. Please crop it or upload a smaller JPG/PNG.");
      return;
    }
    if (previewUrlRef.current) {
      URL.revokeObjectURL(previewUrlRef.current);
    }
    const objectUrl = URL.createObjectURL(candidate);
    previewUrlRef.current = objectUrl;
    setFile(candidate);
    setPreviewUrl(objectUrl);
  };

  const onInputChange = (event: ChangeEvent<HTMLInputElement>) => chooseFile(event.target.files?.[0]);

  const onDrop = (event: DragEvent<HTMLLabelElement>) => {
    event.preventDefault();
    chooseFile(event.dataTransfer.files?.[0]);
  };

  const analyze = async () => {
    setError("");
    if (!file) {
      setError("Choose a clear JPG or PNG lab report before starting the analysis.");
      return;
    }
    if (!user) {
      setError("Please sign in or create an account before uploading a private health report.");
      openAuthenticationDialog();
      return;
    }
    if (!isApiConfigured()) {
      setError("The API is not configured yet. Add the SAM ApiUrl to NEXT_PUBLIC_API_URL and restart the frontend.");
      return;
    }

    setIsWorking(true);
    try {
      let reportId = uploadedReportId;
      if (!reportId) {
        setProgress("Securing your report image…");
        const imageBase64 = await imageAsBase64(file);
        const uploaded = await authenticatedApiRequest<UploadReportResponse>("/reports", {
          method: "POST",
          body: JSON.stringify({
            fileName: file.name,
            contentType: file.type,
            imageBase64,
          }),
        });
        reportId = uploaded.reportId;
        setUploadedReportId(reportId);
      }

      setProgress("Reading values, tables, and reference ranges…");
      const analyzed = await authenticatedApiRequest<AnalyzeReportResponse>(`/reports/${encodeURIComponent(reportId)}/analyze`, {
        method: "POST",
        body: JSON.stringify({ language }),
      });
      setResult(analyzed);
      setProgress("");
      window.setTimeout(() => document.getElementById("analysis-results")?.scrollIntoView({ behavior: "smooth", block: "start" }), 50);
    } catch (reason) {
      setProgress("");
      setError(reason instanceof Error ? reason.message : "The report could not be analyzed. Please try again.");
    } finally {
      setIsWorking(false);
    }
  };

  const patient = result?.analysis.patient_info;

  return (
    <div className="pb-16">
      <section className="border-b border-blue-100 bg-white">
        <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
          <p className="text-sm font-extrabold uppercase tracking-[0.16em] text-teal">Private report interpreter</p>
          <div className="mt-3 flex flex-col justify-between gap-5 md:flex-row md:items-end">
            <div><h1 className="text-3xl font-black tracking-tight text-ink sm:text-4xl">Upload a lab report</h1><p className="mt-3 max-w-2xl text-lg leading-7 text-slate-600">Choose a clear JPG or PNG. We read the report, not your guesses, and show a careful plain-language overview.</p></div>
            <Link href="/history" className="inline-flex w-fit items-center gap-2 rounded-xl border border-blue-200 px-4 py-3 text-sm font-extrabold text-medblue transition hover:bg-blue-50">View report history <span aria-hidden="true">→</span></Link>
          </div>
        </div>
      </section>

      <div className="mx-auto max-w-7xl px-4 py-9 sm:px-6 lg:px-8">
        {configurationError && (
          <div className="mb-6 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm leading-6 text-amber-950"><strong className="block">Set up Cognito first</strong>{configurationError}</div>
        )}
        {!authLoading && !user && !configurationError && (
          <div className="mb-6 flex flex-col gap-3 rounded-2xl border border-blue-200 bg-blue-50 p-4 sm:flex-row sm:items-center sm:justify-between"><p className="text-sm font-semibold leading-6 text-blue-950">Sign in before upload so the report and its history stay private to you.</p><button type="button" onClick={openAuthenticationDialog} className="rounded-xl bg-medblue px-4 py-2.5 text-sm font-extrabold text-white transition hover:bg-blue-700">Sign in securely</button></div>
        )}

        <section className="rounded-[1.8rem] border border-blue-100 bg-white p-5 shadow-soft sm:p-8">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between"><div><h2 className="text-xl font-extrabold text-ink">1. Choose your summary language</h2><p className="mt-1 text-sm leading-6 text-slate-600">Numbers and test names stay visible; the summary and next steps are translated for your family.</p></div><span className="text-sm font-bold text-slate-500">Selected: {languageOptions.find((item) => item.code === language)?.label}</span></div>
          <div className="mt-5 flex flex-wrap gap-2.5" role="group" aria-label="Summary language">
            {languageOptions.map((option) => (
              <button key={option.code} type="button" onClick={() => setLanguage(option.code)} aria-pressed={language === option.code} className={`rounded-xl border px-4 py-3 text-base font-extrabold transition ${language === option.code ? "border-medblue bg-medblue text-white shadow-md shadow-blue-700/20" : "border-slate-200 bg-white text-slate-700 hover:border-blue-300 hover:bg-blue-50"}`}>
                {option.nativeLabel}
              </button>
            ))}
          </div>

          <div className="mt-9 border-t border-slate-100 pt-8"><h2 className="text-xl font-extrabold text-ink">2. Add your report image</h2><p className="mt-1 text-sm leading-6 text-slate-600">For the clearest result, include the test name, result, unit and reference-range columns in one bright, upright photo.</p></div>
          {!file ? (
            <label onDragOver={(event) => event.preventDefault()} onDrop={onDrop} className="mt-5 flex min-h-64 cursor-pointer flex-col items-center justify-center rounded-[1.5rem] border-2 border-dashed border-blue-200 bg-blue-50/40 px-6 text-center transition hover:border-medblue hover:bg-blue-50">
              <span className="grid h-16 w-16 place-items-center rounded-2xl bg-white text-medblue shadow-soft" aria-hidden="true"><svg className="h-8 w-8" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9"><path d="M12 16V4m0 0L7.5 8.5M12 4l4.5 4.5M5 15.5v3A2.5 2.5 0 0 0 7.5 21h9a2.5 2.5 0 0 0 2.5-2.5v-3" /></svg></span>
              <span className="mt-4 text-lg font-extrabold text-ink">Drop your report here</span>
              <span className="mt-1 text-sm font-medium text-slate-600">or tap to browse JPG and PNG files up to 7 MB</span>
              <input ref={inputRef} onChange={onInputChange} className="sr-only" type="file" accept="image/jpeg,image/jpg,image/png" />
            </label>
          ) : (
            <div className="mt-5 grid gap-5 rounded-[1.5rem] border border-slate-200 bg-slate-50 p-4 sm:grid-cols-[190px_1fr] sm:p-5">
              {previewUrl && <img src={previewUrl} alt="Preview of selected lab report" className="h-48 w-full rounded-xl border border-slate-200 bg-white object-contain sm:h-52" />}
              <div className="flex min-w-0 flex-col justify-center"><span className="mb-3 inline-flex w-fit items-center gap-2 rounded-full bg-emerald-100 px-3 py-1.5 text-xs font-extrabold text-emerald-800"><span className="h-2 w-2 rounded-full bg-emerald-500" /> Ready to analyze</span><h3 className="truncate text-lg font-extrabold text-ink" title={file.name}>{file.name}</h3><p className="mt-1 text-sm text-slate-600">{(file.size / (1024 * 1024)).toFixed(1)} MB · {file.type === "image/png" ? "PNG" : "JPG"}</p><button type="button" onClick={clearFile} disabled={isWorking} className="mt-5 w-fit rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm font-extrabold text-slate-700 transition hover:border-rose-200 hover:bg-rose-50 hover:text-rose-700 disabled:opacity-60">Choose another image</button></div>
            </div>
          )}

          {error && <p role="alert" className="mt-5 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-semibold leading-6 text-rose-900">{error}</p>}
          {progress && <div className="mt-5 flex items-center gap-3 rounded-xl border border-blue-100 bg-blue-50 px-4 py-3 text-sm font-bold text-blue-950" role="status"><span className="h-5 w-5 animate-spin rounded-full border-2 border-blue-200 border-t-medblue" aria-hidden="true" />{progress}</div>}

          <div className="mt-7 flex flex-col gap-4 border-t border-slate-100 pt-6 sm:flex-row sm:items-center sm:justify-between"><p className="max-w-xl text-xs leading-5 text-slate-500">By analyzing, you confirm you have permission to upload this report. MedBridge is an educational aid and does not diagnose or replace a clinician.</p><button type="button" onClick={() => void analyze()} disabled={!file || isWorking || authLoading} className="inline-flex min-h-14 shrink-0 items-center justify-center gap-3 rounded-2xl bg-medblue px-6 text-base font-extrabold text-white shadow-lg shadow-blue-700/20 transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"><span>{isWorking ? "Analyzing report…" : "Analyze report"}</span>{isWorking ? <span className="h-5 w-5 animate-spin rounded-full border-2 border-white/40 border-t-white" aria-hidden="true" /> : <span aria-hidden="true">→</span>}</button></div>
        </section>

        {result && patient && (
          <section id="analysis-results" className="scroll-mt-28 pt-10" aria-live="polite">
            <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between"><div><p className="text-sm font-extrabold uppercase tracking-[0.16em] text-teal">Your report overview</p><h2 className="mt-2 text-3xl font-black tracking-tight text-ink">Here is the simple view</h2></div><p className="text-sm font-semibold text-slate-500">Analyzed {displayDate(result.completedAt)}</p></div>
            {result.languageUsed !== result.language && <div className="mb-5 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-semibold text-amber-950">Translation is temporarily unavailable, so this view is shown in English.</div>}
            {result.analysis.translation_notice && <div className="mb-5 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-semibold text-amber-950">{result.analysis.translation_notice}</div>}

            <div className="grid gap-5 xl:grid-cols-[0.82fr_1.18fr]">
              <article className="rounded-[1.6rem] border border-blue-100 bg-white p-6 shadow-soft"><div className="flex items-center gap-3"><span className="grid h-11 w-11 place-items-center rounded-2xl bg-blue-100 text-xl" aria-hidden="true">👤</span><div><p className="text-sm font-extrabold uppercase tracking-[0.12em] text-slate-500">Patient information</p><h3 className="text-xl font-extrabold text-ink">{patient.name}</h3></div></div><dl className="mt-6 grid grid-cols-2 gap-x-4 gap-y-5 text-sm"><div><dt className="font-bold text-slate-500">Age</dt><dd className="mt-1 font-extrabold text-slate-800">{patient.age}</dd></div><div><dt className="font-bold text-slate-500">Sex</dt><dd className="mt-1 font-extrabold text-slate-800">{patient.sex}</dd></div><div><dt className="font-bold text-slate-500">Laboratory</dt><dd className="mt-1 font-extrabold text-slate-800">{patient.lab_name}</dd></div><div><dt className="font-bold text-slate-500">Report date</dt><dd className="mt-1 font-extrabold text-slate-800">{displayDate(patient.report_date)}</dd></div></dl></article>
              <UrgencyBanner urgency={result.analysis.urgency} />
            </div>

            <article className="mt-5 rounded-[1.6rem] border border-blue-100 bg-white p-5 shadow-soft sm:p-7"><div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between"><div><p className="text-sm font-extrabold uppercase tracking-[0.15em] text-teal">In plain language</p><h3 className="mt-1 text-2xl font-extrabold text-ink">Summary</h3></div><span className="w-fit rounded-full bg-blue-50 px-3 py-1.5 text-xs font-extrabold text-medblue">{languageOptions.find((option) => option.code === result.languageUsed)?.nativeLabel ?? "English"}</span></div><p className="mt-5 whitespace-pre-line text-base leading-8 text-slate-700">{result.analysis.summary}</p></article>

            <article className="mt-5 overflow-hidden rounded-[1.6rem] border border-blue-100 bg-white shadow-soft"><div className="flex flex-col gap-2 border-b border-slate-100 p-5 sm:flex-row sm:items-center sm:justify-between sm:p-7"><div><p className="text-sm font-extrabold uppercase tracking-[0.15em] text-teal">Every listed result</p><h3 className="mt-1 text-2xl font-extrabold text-ink">Values and reference ranges</h3></div><span className="text-sm font-semibold text-slate-500">Green = normal · Yellow = borderline · Red = critical</span></div>{result.analysis.results.length > 0 ? <div className="overflow-x-auto"><table className="min-w-[820px] w-full text-left"><thead className="bg-slate-50 text-xs font-extrabold uppercase tracking-[0.1em] text-slate-500"><tr><th className="px-6 py-4">Test</th><th className="px-6 py-4">Your value</th><th className="px-6 py-4">Lab range</th><th className="px-6 py-4">Status</th><th className="px-6 py-4">What it means</th></tr></thead><tbody className="divide-y divide-slate-100">{result.analysis.results.map((labResult, index) => <tr key={`${labResult.test_name}-${index}`} className="align-top hover:bg-blue-50/30"><td className="px-6 py-5 font-extrabold text-ink">{labResult.test_name}</td><td className="px-6 py-5 font-bold text-slate-800">{displayValue(labResult.value, labResult.unit)}</td><td className="px-6 py-5 text-sm font-medium text-slate-600">{labResult.reference_range}</td><td className="px-6 py-5"><StatusBadge status={labResult.status} /></td><td className="max-w-md px-6 py-5 text-sm leading-6 text-slate-600">{labResult.explanation}</td></tr>)}</tbody></table></div> : <p className="p-7 text-slate-600">No clearly measurable results were found. Please review the original report with a clinician.</p>}</article>

            {result.analysis.trends.length > 0 && <article className="mt-5 rounded-[1.6rem] border border-violet-100 bg-violet-50/50 p-5 shadow-soft sm:p-7"><div className="flex items-center gap-3"><span className="grid h-11 w-11 place-items-center rounded-2xl bg-violet-100 text-xl" aria-hidden="true">↗</span><div><p className="text-sm font-extrabold uppercase tracking-[0.15em] text-violet-700">Across your reports</p><h3 className="text-2xl font-extrabold text-ink">Trend tracking</h3></div></div><div className="mt-5 grid gap-3">{result.analysis.trends.map((trend, index) => <div key={`${trend.test_name}-${index}`} className="rounded-2xl border border-violet-100 bg-white p-4"><div className="flex flex-wrap items-center gap-2"><span className="grid h-8 w-8 place-items-center rounded-lg bg-violet-100 font-black text-violet-700" aria-hidden="true">{trendIcon(trend.direction)}</span><span className="font-extrabold text-ink">{trend.test_name}</span><span className="text-sm font-bold text-slate-500">{trend.previous_value} → {trend.current_value} {trend.unit === "Not found" ? "" : trend.unit}</span></div><p className="mt-2 text-sm leading-6 text-slate-700">{trend.message}</p></div>)}</div><p className="mt-4 text-xs font-medium leading-5 text-violet-900">Trends compare numbers in uploaded reports. They do not establish why a number changed or whether treatment should change.</p></article>}

            <div className="mt-5 grid gap-5 lg:grid-cols-2"><article className="rounded-[1.6rem] border border-emerald-100 bg-white p-6 shadow-soft"><div className="flex items-center gap-3"><span className="grid h-11 w-11 place-items-center rounded-2xl bg-emerald-100 text-xl" aria-hidden="true">✓</span><h3 className="text-2xl font-extrabold text-ink">Helpful next steps</h3></div><ol className="mt-5 space-y-4">{result.analysis.recommendations.map((recommendation, index) => <li key={`${recommendation}-${index}`} className="flex gap-3 text-sm leading-6 text-slate-700"><span className="grid h-6 w-6 shrink-0 place-items-center rounded-full bg-emerald-100 text-xs font-extrabold text-emerald-800">{index + 1}</span><span>{recommendation}</span></li>)}</ol></article><article className="rounded-[1.6rem] border border-amber-200 bg-amber-50 p-6 shadow-soft"><div className="flex items-center gap-3"><span className="grid h-11 w-11 place-items-center rounded-2xl bg-amber-200/70 text-xl" aria-hidden="true">!</span><h3 className="text-2xl font-extrabold text-amber-950">Medical disclaimer</h3></div><p className="mt-5 text-sm leading-7 text-amber-950">{result.analysis.disclaimer}</p></article></div>
          </section>
        )}
      </div>
    </div>
  );
}
