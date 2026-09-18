import Link from "next/link";

const steps = [
  {
    number: "01",
    title: "Snap your report",
    body: "Take a clear photo or upload a JPG/PNG from Dr. Lal PathLabs, Thyrocare, SRL, or your local lab.",
    icon: (
      <svg aria-hidden="true" className="h-8 w-8" viewBox="0 0 32 32" fill="none" stroke="currentColor" strokeWidth="2"><rect x="5" y="8" width="22" height="17" rx="3" /><path d="M11 8 13 5h6l2 3M10 20l4-4 3 3 2-2 3 3M22 13h.01" /></svg>
    ),
  },
  {
    number: "02",
    title: "AI reads the details",
    body: "MedBridge securely reads tables, values, and lab reference ranges, then checks each result carefully.",
    icon: (
      <svg aria-hidden="true" className="h-8 w-8" viewBox="0 0 32 32" fill="none" stroke="currentColor" strokeWidth="2"><path d="M16 5a11 11 0 1 0 11 11A11 11 0 0 0 16 5Z" /><path d="M16 10v6l4 2M7 25l-2 3M25 25l2 3M5 16H2M30 16h-3" /></svg>
    ),
  },
  {
    number: "03",
    title: "Understand, together",
    body: "See calm colour-coded results and a simple summary in the language your family is most comfortable reading.",
    icon: (
      <svg aria-hidden="true" className="h-8 w-8" viewBox="0 0 32 32" fill="none" stroke="currentColor" strokeWidth="2"><path d="M6 7h20v14H13l-6 5V7Z" /><path d="M11 12h10M11 16h7" /></svg>
    ),
  },
];

const supportedLanguages = ["English", "हिंदी", "தமிழ்", "తెలుగు", "ಕನ್ನಡ", "বাংলা", "मराठी"];

export default function HomePage() {
  return (
    <>
      <section className="relative overflow-hidden bg-white">
        <div className="absolute inset-x-0 top-0 h-[490px] bg-[radial-gradient(circle_at_18%_16%,rgba(126,211,233,0.35),transparent_27%),radial-gradient(circle_at_85%_20%,rgba(171,215,255,0.55),transparent_31%),linear-gradient(180deg,#effaff_0%,#ffffff_78%)]" />
        <div className="relative mx-auto grid max-w-7xl items-center gap-12 px-4 pb-20 pt-16 sm:px-6 sm:pt-24 lg:grid-cols-[1.1fr_0.9fr] lg:px-8 lg:pb-28">
          <div className="max-w-3xl">
            <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-blue-200 bg-white/80 px-4 py-2 text-sm font-bold text-medblue shadow-sm">
              <span className="grid h-5 w-5 place-items-center rounded-full bg-medblue text-xs text-white">✦</span>
              Built for Indian lab reports
            </div>
            <h1 className="max-w-3xl text-4xl font-black leading-[1.08] tracking-tight text-ink sm:text-5xl lg:text-6xl">
              <span lang="hi">Mummy ki Report Samjho</span><br />
              <span className="text-medblue">without the Google panic.</span>
            </h1>
            <p className="mt-6 max-w-2xl text-lg leading-8 text-slate-600 sm:text-xl">
              Upload a lab report and get an easy, colour-coded explanation of values like HbA1c, TSH, SGPT, MCV and ESR — in a language your family understands.
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-center">
              <Link href="/upload" className="inline-flex min-h-14 items-center justify-center gap-3 rounded-2xl bg-medblue px-7 py-4 text-base font-extrabold text-white shadow-lg shadow-blue-700/25 transition hover:-translate-y-0.5 hover:bg-blue-700 hover:shadow-xl">
                Upload a lab report
                <svg aria-hidden="true" className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4"><path d="M5 12h14M13 6l6 6-6 6" /></svg>
              </Link>
              <a href="#how-it-works" className="inline-flex min-h-14 items-center justify-center rounded-2xl border border-blue-200 bg-white px-7 py-4 text-base font-extrabold text-medblue transition hover:border-medblue hover:bg-blue-50">
                See how it works
              </a>
            </div>
            <div className="mt-8 flex flex-wrap gap-x-5 gap-y-3 text-sm font-semibold text-slate-600">
              <span className="inline-flex items-center gap-2"><span className="text-emerald-600">●</span> Private S3 storage</span>
              <span className="inline-flex items-center gap-2"><span className="text-emerald-600">●</span> Secure sign-in</span>
              <span className="inline-flex items-center gap-2"><span className="text-emerald-600">●</span> No app download</span>
            </div>
          </div>

          <div className="mx-auto w-full max-w-md lg:justify-self-end">
            <div className="float-soft relative rounded-[2rem] border border-white bg-white p-4 shadow-lift sm:p-5">
              <div className="absolute -right-4 -top-5 rounded-2xl border border-emerald-100 bg-white px-3 py-2 shadow-soft">
                <p className="text-[10px] font-extrabold uppercase tracking-[0.12em] text-slate-500">Report status</p>
                <p className="mt-0.5 text-sm font-extrabold text-emerald-700">Clear overview</p>
              </div>
              <div className="rounded-[1.45rem] bg-slate-50 p-5">
                <div className="flex items-center justify-between border-b border-slate-200 pb-4">
                  <div className="flex items-center gap-3">
                    <span className="grid h-10 w-10 place-items-center rounded-xl bg-blue-100 text-lg">🧪</span>
                    <div><p className="font-extrabold text-ink">Family health report</p><p className="text-xs text-slate-500">Simple, not scary</p></div>
                  </div>
                  <span className="rounded-full bg-blue-100 px-2.5 py-1 text-xs font-bold text-medblue">Hindi</span>
                </div>
                <div className="space-y-3 py-5">
                  <div className="rounded-xl border border-emerald-100 bg-white px-3 py-3"><div className="flex justify-between gap-3"><span className="font-bold text-slate-700">Haemoglobin</span><span className="font-extrabold text-emerald-700">13.4 g/dL</span></div><div className="mt-2 h-1.5 overflow-hidden rounded-full bg-emerald-100"><div className="h-full w-[71%] rounded-full bg-emerald-500" /></div></div>
                  <div className="rounded-xl border border-amber-100 bg-white px-3 py-3"><div className="flex justify-between gap-3"><span className="font-bold text-slate-700">HbA1c</span><span className="font-extrabold text-amber-700">6.1%</span></div><div className="mt-2 h-1.5 overflow-hidden rounded-full bg-amber-100"><div className="h-full w-[84%] rounded-full bg-amber-500" /></div></div>
                  <div className="rounded-xl border border-emerald-100 bg-white px-3 py-3"><div className="flex justify-between gap-3"><span className="font-bold text-slate-700">TSH</span><span className="font-extrabold text-emerald-700">2.8 mIU/L</span></div><div className="mt-2 h-1.5 overflow-hidden rounded-full bg-emerald-100"><div className="h-full w-[56%] rounded-full bg-emerald-500" /></div></div>
                </div>
                <div className="rounded-xl bg-blue-50 px-4 py-3 text-sm font-semibold leading-6 text-blue-950">“रिपोर्ट को आराम से समझें, और जरूरत हो तो डॉक्टर से बात करें।”</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section id="how-it-works" className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-2xl text-center">
          <p className="text-sm font-extrabold uppercase tracking-[0.16em] text-teal">Simple by design</p>
          <h2 className="mt-3 text-3xl font-black tracking-tight text-ink sm:text-4xl">Three calm steps to clarity</h2>
          <p className="mt-4 text-lg leading-7 text-slate-600">No medical dictionary. No scattered search results. Just a clearer starting point for the next conversation.</p>
        </div>
        <div className="mt-12 grid gap-5 md:grid-cols-3">
          {steps.map((step) => (
            <article key={step.number} className="group rounded-[1.7rem] border border-blue-100 bg-white p-7 shadow-soft transition duration-200 hover:-translate-y-1 hover:shadow-lift">
              <div className="flex items-start justify-between gap-4"><span className="grid h-14 w-14 place-items-center rounded-2xl bg-blue-50 text-medblue transition group-hover:bg-medblue group-hover:text-white">{step.icon}</span><span className="text-sm font-black tracking-[0.18em] text-blue-200">{step.number}</span></div>
              <h3 className="mt-7 text-xl font-extrabold text-ink">{step.title}</h3>
              <p className="mt-3 leading-7 text-slate-600">{step.body}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="bg-ink py-16 text-white">
        <div className="mx-auto grid max-w-7xl gap-10 px-4 sm:px-6 lg:grid-cols-[1fr_auto] lg:items-center lg:px-8">
          <div>
            <p className="text-sm font-extrabold uppercase tracking-[0.16em] text-cyan-200">For every generation</p>
            <h2 className="mt-3 max-w-3xl text-3xl font-black tracking-tight sm:text-4xl">The right words, in the language that feels like home.</h2>
            <div className="mt-6 flex flex-wrap gap-2.5">
              {supportedLanguages.map((language) => <span key={language} className="rounded-full border border-white/15 bg-white/10 px-3.5 py-2 text-sm font-bold">{language}</span>)}
            </div>
          </div>
          <Link href="/upload" className="inline-flex min-h-14 items-center justify-center rounded-2xl bg-white px-7 py-4 text-base font-extrabold text-medblue transition hover:bg-blue-50">Start with a report</Link>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="flex items-start gap-4 rounded-2xl border border-amber-200 bg-amber-50 p-5 text-amber-950">
          <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-amber-200/70 font-black" aria-hidden="true">!</span>
          <div><h2 className="font-extrabold">A helpful explanation, not a diagnosis</h2><p className="mt-1 text-sm leading-6">MedBridge helps you understand what is printed on a report. It cannot replace a doctor’s assessment. For severe symptoms or an emergency, seek urgent medical care instead of waiting for an online explanation.</p></div>
        </div>
      </section>
    </>
  );
}
