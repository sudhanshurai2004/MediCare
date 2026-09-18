"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";

import { openAuthenticationDialog } from "@/components/AuthDialog";
import { StatusBadge } from "@/components/StatusBadge";
import { authenticatedApiRequest, isApiConfigured } from "@/lib/api";
import { displayDate, displayValue, safeUrgency, urgencyPresentation } from "@/lib/presentation";
import type { HistoryReport, HistoryResponse } from "@/lib/types";
import { useAuthSession } from "@/lib/useAuthSession";

function trendSymbol(direction: string): string {
  if (direction === "UP") return "↑";
  if (direction === "DOWN") return "↓";
  return "→";
}

function reportDate(report: HistoryReport): string {
  const fromReport = report.patientInfo.report_date;
  return fromReport && fromReport !== "Not found" ? displayDate(fromReport) : displayDate(report.createdAt);
}

export default function HistoryPage() {
  const { user, loading: authLoading, configurationError } = useAuthSession();
  const [reports, setReports] = useState<HistoryReport[]>([]);
  const [nextToken, setNextToken] = useState<string | null>(null);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [error, setError] = useState("");

  const loadHistory = useCallback(async (token: string | null = null, append = false) => {
    if (!user) return;
    if (!isApiConfigured()) {
      setError("The API is not configured yet. Add NEXT_PUBLIC_API_URL from the SAM stack outputs.");
      return;
    }
    setLoadingHistory(true);
    setError("");
    try {
      const query = new URLSearchParams({ limit: "20" });
      if (token) query.set("nextToken", token);
      const response = await authenticatedApiRequest<HistoryResponse>(`/reports?${query.toString()}`);
      setReports((current) => (append ? [...current, ...response.reports] : response.reports));
      setNextToken(response.nextToken);
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Your report history could not be loaded. Please try again.");
    } finally {
      setLoadingHistory(false);
    }
  }, [user]);

  useEffect(() => {
    if (user) {
      void loadHistory();
    } else {
      setReports([]);
      setNextToken(null);
    }
  }, [user, loadHistory]);

  return (
    <div className="min-h-[calc(100vh-180px)] pb-16">
      <section className="border-b border-blue-100 bg-white">
        <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
          <p className="text-sm font-extrabold uppercase tracking-[0.16em] text-teal">Your private timeline</p>
          <div className="mt-3 flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between"><div><h1 className="text-3xl font-black tracking-tight text-ink sm:text-4xl">Report history &amp; trends</h1><p className="mt-3 max-w-2xl text-lg leading-7 text-slate-600">Keep past reports together and see numerical changes only when MedBridge can match the same test and unit.</p></div><Link href="/upload" className="inline-flex w-fit items-center gap-2 rounded-xl bg-medblue px-5 py-3 text-sm font-extrabold text-white shadow-md shadow-blue-700/20 transition hover:bg-blue-700">Upload another report <span aria-hidden="true">→</span></Link></div>
        </div>
      </section>

      <div className="mx-auto max-w-7xl px-4 py-9 sm:px-6 lg:px-8">
        {configurationError && <div className="rounded-2xl border border-amber-200 bg-amber-50 p-5 text-sm leading-6 text-amber-950"><strong className="block">Set up Cognito first</strong>{configurationError}</div>}
        {!authLoading && !user && !configurationError && <section className="mx-auto max-w-xl rounded-[1.8rem] border border-blue-100 bg-white p-8 text-center shadow-soft"><span className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-blue-100 text-2xl" aria-hidden="true">🗂️</span><h2 className="mt-5 text-2xl font-extrabold text-ink">Your reports will appear here</h2><p className="mt-3 leading-7 text-slate-600">Sign in to see only the reports uploaded to your own MedBridge account.</p><button type="button" onClick={openAuthenticationDialog} className="mt-6 rounded-xl bg-medblue px-5 py-3 text-sm font-extrabold text-white transition hover:bg-blue-700">Sign in securely</button></section>}
        {authLoading && <div className="grid gap-5 lg:grid-cols-2"><div className="h-72 animate-pulse rounded-[1.6rem] bg-white" /><div className="h-72 animate-pulse rounded-[1.6rem] bg-white" /></div>}
        {user && (
          <>
            {error && <div role="alert" className="mb-5 flex flex-col gap-3 rounded-2xl border border-rose-200 bg-rose-50 p-4 text-sm font-semibold leading-6 text-rose-900 sm:flex-row sm:items-center sm:justify-between"><span>{error}</span><button type="button" onClick={() => void loadHistory()} className="w-fit rounded-lg border border-rose-300 bg-white px-3 py-2 text-xs font-extrabold text-rose-800">Try again</button></div>}
            {!loadingHistory && !error && reports.length === 0 && <section className="mx-auto max-w-xl rounded-[1.8rem] border border-blue-100 bg-white p-8 text-center shadow-soft"><span className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-blue-100 text-2xl" aria-hidden="true">🧪</span><h2 className="mt-5 text-2xl font-extrabold text-ink">No reports yet</h2><p className="mt-3 leading-7 text-slate-600">Upload your first JPG or PNG lab report to begin a private history and track comparable values over time.</p><Link href="/upload" className="mt-6 inline-flex rounded-xl bg-medblue px-5 py-3 text-sm font-extrabold text-white transition hover:bg-blue-700">Upload your first report</Link></section>}
            <div className="grid gap-5 lg:grid-cols-2">
              {reports.map((report) => {
                const urgency = urgencyPresentation[safeUrgency(report.urgency)];
                const normalCount = report.results.filter((result) => result.status === "NORMAL").length;
                const borderlineCount = report.results.filter((result) => result.status === "BORDERLINE").length;
                const criticalCount = report.results.filter((result) => result.status === "CRITICAL").length;
                return (
                  <article key={report.reportId} className="overflow-hidden rounded-[1.6rem] border border-blue-100 bg-white shadow-soft">
                    <div className="flex flex-wrap items-start justify-between gap-3 border-b border-slate-100 p-5"><div className="min-w-0"><p className="text-sm font-extrabold uppercase tracking-[0.12em] text-teal">{reportDate(report)}</p><h2 className="mt-1 truncate text-xl font-extrabold text-ink" title={report.fileName}>{report.patientInfo.name !== "Not found" ? report.patientInfo.name : report.fileName}</h2><p className="mt-1 text-sm font-medium text-slate-500">{report.patientInfo.lab_name !== "Not found" ? report.patientInfo.lab_name : "Lab report"} · {report.patientInfo.age}</p></div><span className={`inline-flex shrink-0 items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-extrabold ${urgency.panel}`}><span className={`h-2 w-2 rounded-full ${urgency.icon}`} />{urgency.label}</span></div>
                    {report.status !== "COMPLETED" ? <div className="p-5"><p className="rounded-xl bg-slate-50 px-4 py-3 text-sm font-semibold text-slate-600">{report.status === "FAILED" ? "Analysis was not completed. You can upload the image again from the upload page." : report.status === "ANALYZING" ? "This report is being analyzed. Refresh shortly to see the result." : "This report is securely uploaded and ready to analyze."}</p></div> : <><div className="p-5"><p className="max-h-[72px] overflow-hidden text-sm leading-6 text-slate-700">{report.summary}</p><div className="mt-4 flex flex-wrap gap-2"><span className="rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-extrabold text-emerald-800">{normalCount} normal</span><span className="rounded-full bg-amber-50 px-2.5 py-1 text-xs font-extrabold text-amber-900">{borderlineCount} borderline</span>{criticalCount > 0 && <span className="rounded-full bg-rose-50 px-2.5 py-1 text-xs font-extrabold text-rose-800">{criticalCount} critical</span>}</div></div>{report.trends.length > 0 && <div className="border-t border-violet-100 bg-violet-50/60 p-5"><p className="text-xs font-extrabold uppercase tracking-[0.13em] text-violet-700">Matched trend{report.trends.length > 1 ? "s" : ""}</p><div className="mt-3 space-y-3">{report.trends.slice(0, 3).map((trend, index) => <div key={`${trend.test_name}-${index}`} className="rounded-xl border border-violet-100 bg-white p-3"><div className="flex flex-wrap items-center gap-2"><span className="grid h-7 w-7 place-items-center rounded-lg bg-violet-100 font-black text-violet-700" aria-hidden="true">{trendSymbol(trend.direction)}</span><span className="font-extrabold text-ink">{trend.test_name}</span><span className="text-xs font-bold text-slate-500">{displayValue(trend.previous_value, trend.unit)} → {displayValue(trend.current_value, trend.unit)}</span></div><p className="mt-2 text-xs leading-5 text-slate-600">{trend.message}</p></div>)}</div></div>}<div className="border-t border-slate-100 p-5"><details><summary className="cursor-pointer text-sm font-extrabold text-medblue">View {report.results.length} extracted result{report.results.length === 1 ? "" : "s"}</summary><ul className="mt-4 space-y-2">{report.results.map((result, index) => <li key={`${result.test_name}-${index}`} className="flex items-center justify-between gap-3 rounded-xl bg-slate-50 px-3 py-2.5"><span className="min-w-0 truncate text-sm font-bold text-slate-700">{result.test_name}</span><span className="shrink-0 text-sm font-extrabold text-ink">{displayValue(result.value, result.unit)}</span><StatusBadge status={result.status} compact /></li>)}</ul></details></div></>}</article>
                );
              })}
            </div>
            {loadingHistory && <div className="mt-6 flex items-center justify-center gap-3 rounded-2xl border border-blue-100 bg-white p-5 text-sm font-bold text-medblue"><span className="h-5 w-5 animate-spin rounded-full border-2 border-blue-200 border-t-medblue" />Loading your private history…</div>}
            {!loadingHistory && nextToken && <div className="mt-7 text-center"><button type="button" onClick={() => void loadHistory(nextToken, true)} className="rounded-xl border border-medblue bg-white px-5 py-3 text-sm font-extrabold text-medblue transition hover:bg-blue-50">Load older reports</button></div>}
            {reports.length > 0 && <p className="mx-auto mt-8 max-w-3xl text-center text-xs leading-5 text-slate-500">Trend cards compare only similarly named tests with compatible units. A number changing over time does not establish the reason for the change or replace clinical advice.</p>}
          </>
        )}
      </div>
    </div>
  );
}
