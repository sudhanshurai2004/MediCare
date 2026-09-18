import type { Metadata } from "next";

import { Navbar } from "@/components/Navbar";

import "./globals.css";

export const metadata: Metadata = {
  title: {
    default: "MedBridge — Understand your lab report",
    template: "%s | MedBridge",
  },
  description: "A private, AI-assisted Indian lab report interpreter with clear language and trend tracking.",
  applicationName: "MedBridge",
  robots: { index: false, follow: false },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-mist text-ink antialiased">
        <Navbar />
        <main>{children}</main>
        <footer className="border-t border-blue-100 bg-white">
          <div className="mx-auto flex max-w-7xl flex-col gap-3 px-4 py-7 text-sm text-slate-600 sm:px-6 md:flex-row md:items-center md:justify-between lg:px-8">
            <p><span className="font-extrabold text-ink">MedBridge</span> makes report language easier to understand, not medical decisions.</p>
            <p className="font-medium">Private by design · Your reports stay in your account</p>
          </div>
        </footer>
      </body>
    </html>
  );
}
