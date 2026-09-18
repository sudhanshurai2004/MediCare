"use client";

import Link from "next/link";
import { useState } from "react";

import { AuthDialog, openAuthenticationDialog } from "@/components/AuthDialog";
import { BrandMark } from "@/components/BrandMark";
import { signOutCurrentUser } from "@/lib/auth";
import { useAuthSession } from "@/lib/useAuthSession";

const navItems = [
  { href: "/", label: "How it works" },
  { href: "/upload", label: "Upload report" },
  { href: "/history", label: "My history" },
];

export function Navbar() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [signingOut, setSigningOut] = useState(false);
  const [signOutError, setSignOutError] = useState("");
  const { user, loading, refresh } = useAuthSession();

  const handleSignOut = async () => {
    setSigningOut(true);
    setSignOutError("");
    try {
      await signOutCurrentUser();
      await refresh();
    } catch (error) {
      setSignOutError(error instanceof Error ? error.message : "Could not sign out. Please try again.");
    } finally {
      setSigningOut(false);
    }
  };

  return (
    <header className="sticky top-0 z-50 border-b border-blue-100/80 bg-white/90 backdrop-blur-lg">
      <div className="mx-auto flex min-h-[76px] max-w-7xl items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
        <BrandMark />
        <nav className="hidden items-center gap-1 md:flex" aria-label="Primary navigation">
          {navItems.map((item) => (
            <Link key={item.href} href={item.href} className="rounded-xl px-4 py-2.5 text-sm font-bold text-slate-600 transition hover:bg-blue-50 hover:text-medblue">
              {item.label}
            </Link>
          ))}
        </nav>
        <div className="hidden items-center gap-3 md:flex">
          {loading ? (
            <span className="h-10 w-24 animate-pulse rounded-xl bg-slate-100" aria-label="Loading account" />
          ) : user ? (
            <>
              <span className="max-w-[150px] truncate text-sm font-semibold text-slate-600" title={user.username}>{user.username}</span>
              <button type="button" disabled={signingOut} onClick={handleSignOut} className="rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-bold text-slate-700 transition hover:border-slate-300 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60">
                {signingOut ? "Signing out…" : "Sign out"}
              </button>
            </>
          ) : (
            <button type="button" onClick={openAuthenticationDialog} className="rounded-xl border border-medblue px-4 py-2.5 text-sm font-extrabold text-medblue transition hover:bg-blue-50">
              Sign in
            </button>
          )}
          <Link href="/upload" className="rounded-xl bg-medblue px-5 py-2.5 text-sm font-extrabold text-white shadow-md shadow-blue-700/20 transition hover:bg-blue-700">
            Analyze a report
          </Link>
        </div>
        <button type="button" className="rounded-xl p-2.5 text-slate-700 hover:bg-slate-100 md:hidden" onClick={() => setMenuOpen((open) => !open)} aria-expanded={menuOpen} aria-controls="mobile-navigation" aria-label="Toggle navigation">
          <svg aria-hidden="true" className="h-6 w-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d={menuOpen ? "m6 6 12 12M18 6 6 18" : "M4 7h16M4 12h16M4 17h16"} /></svg>
        </button>
      </div>
      {signOutError && <p role="alert" className="mx-auto max-w-7xl px-4 pb-3 text-right text-xs font-semibold text-rose-700 sm:px-6 lg:px-8">{signOutError}</p>}
      {menuOpen && (
        <div id="mobile-navigation" className="border-t border-blue-100 bg-white px-4 py-3 shadow-lg md:hidden">
          <nav className="mx-auto grid max-w-7xl gap-1" aria-label="Mobile navigation">
            {navItems.map((item) => (
              <Link key={item.href} href={item.href} onClick={() => setMenuOpen(false)} className="rounded-xl px-4 py-3 text-base font-bold text-slate-700 hover:bg-blue-50 hover:text-medblue">
                {item.label}
              </Link>
            ))}
            {user ? (
              <button type="button" disabled={signingOut} onClick={handleSignOut} className="mt-1 rounded-xl border border-slate-200 px-4 py-3 text-left text-base font-bold text-slate-700 disabled:opacity-60">
                {signingOut ? "Signing out…" : "Sign out"}
              </button>
            ) : (
              <button type="button" onClick={() => { setMenuOpen(false); openAuthenticationDialog(); }} className="mt-1 rounded-xl border border-medblue px-4 py-3 text-left text-base font-bold text-medblue">
                Sign in or create account
              </button>
            )}
          </nav>
        </div>
      )}
      <AuthDialog onAuthenticated={() => void refresh()} />
    </header>
  );
}
