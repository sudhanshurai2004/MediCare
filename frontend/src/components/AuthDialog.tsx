"use client";

import { FormEvent, useEffect, useState } from "react";

import {
  AuthenticationError,
  confirmEmailCode,
  friendlyAuthenticationError,
  resendEmailVerificationCode,
  signInWithEmail,
  signUpWithEmail,
} from "@/lib/auth";
import { authConfigurationMessage, isAuthConfigured } from "@/lib/amplify";

export function openAuthenticationDialog(): void {
  if (typeof window !== "undefined") {
    window.dispatchEvent(new Event("medbridge:open-auth"));
  }
}

type Mode = "sign-in" | "sign-up" | "confirm";

interface AuthDialogProps {
  onAuthenticated?: () => void;
}

export function AuthDialog({ onAuthenticated }: AuthDialogProps) {
  const [open, setOpen] = useState(false);
  const [mode, setMode] = useState<Mode>("sign-in");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [passwordConfirmation, setPasswordConfirmation] = useState("");
  const [code, setCode] = useState("");
  const [notice, setNotice] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [resending, setResending] = useState(false);

  useEffect(() => {
    const showDialog = () => {
      setOpen(true);
      setError("");
      setNotice("");
    };
    window.addEventListener("medbridge:open-auth", showDialog);
    return () => window.removeEventListener("medbridge:open-auth", showDialog);
  }, []);

  useEffect(() => {
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setOpen(false);
      }
    };
    if (open) {
      window.addEventListener("keydown", closeOnEscape);
      return () => window.removeEventListener("keydown", closeOnEscape);
    }
    return undefined;
  }, [open]);

  const switchMode = (nextMode: Mode) => {
    setMode(nextMode);
    setError("");
    setNotice("");
  };

  const handleSignIn = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError("");
    setNotice("");
    setSubmitting(true);
    try {
      const result = await signInWithEmail(email, password);
      if (result.signedIn) {
        setOpen(false);
        setPassword("");
        onAuthenticated?.();
        return;
      }
      if (result.nextStep === "CONFIRM_SIGN_UP") {
        setMode("confirm");
        setNotice("Enter the verification code sent to your email before signing in.");
        return;
      }
      setError("Your account needs an additional Cognito step before it can sign in.");
    } catch (reason) {
      const authError = friendlyAuthenticationError(reason);
      if (authError.code === "UserNotConfirmedException") {
        setMode("confirm");
        setNotice("Enter the verification code sent to your email.");
      } else {
        setError(authError.message);
      }
    } finally {
      setSubmitting(false);
    }
  };

  const handleSignUp = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError("");
    setNotice("");
    if (password !== passwordConfirmation) {
      setError("The two passwords do not match.");
      return;
    }
    setSubmitting(true);
    try {
      const result = await signUpWithEmail(email, password);
      if (result.complete) {
        setMode("sign-in");
        setNotice("Your account is ready. Please sign in.");
      } else {
        setMode("confirm");
        setNotice("We sent a verification code to your email. Enter it to activate your account.");
      }
    } catch (reason) {
      setError(friendlyAuthenticationError(reason).message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleConfirmation = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError("");
    setNotice("");
    setSubmitting(true);
    try {
      await confirmEmailCode(email, code);
      setPassword("");
      setCode("");
      setMode("sign-in");
      setNotice("Email verified. You can now sign in securely.");
    } catch (reason) {
      setError(friendlyAuthenticationError(reason).message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleResendCode = async () => {
    setError("");
    setNotice("");
    if (!email.trim()) {
      setError("Enter your email address before requesting a new code.");
      return;
    }
    setResending(true);
    try {
      await resendEmailVerificationCode(email);
      setNotice("A new verification code has been sent to your email.");
    } catch (reason) {
      setError(friendlyAuthenticationError(reason).message);
    } finally {
      setResending(false);
    }
  };

  if (!open) {
    return null;
  }

  const unavailable = !isAuthConfigured();
  const title = mode === "sign-up" ? "Create your private account" : mode === "confirm" ? "Verify your email" : "Sign in to MedBridge";

  return (
    <div className="fixed inset-0 z-[70] flex items-end justify-center bg-slate-950/45 p-4 backdrop-blur-sm sm:items-center" role="presentation" onMouseDown={() => setOpen(false)}>
      <section
        aria-labelledby="auth-dialog-title"
        aria-modal="true"
        className="w-full max-w-md rounded-[2rem] bg-white p-6 shadow-2xl sm:p-8"
        role="dialog"
        onMouseDown={(event) => event.stopPropagation()}
      >
        <div className="mb-6 flex items-start justify-between gap-4">
          <div>
            <span className="mb-3 inline-flex h-11 w-11 items-center justify-center rounded-2xl bg-blue-100 text-xl" aria-hidden="true">🔐</span>
            <h2 id="auth-dialog-title" className="text-2xl font-extrabold tracking-tight text-ink">{title}</h2>
            <p className="mt-1 text-sm leading-6 text-slate-600">Your reports stay tied to your own secure account.</p>
          </div>
          <button type="button" onClick={() => setOpen(false)} className="rounded-xl p-2 text-slate-500 transition hover:bg-slate-100 hover:text-slate-800 focus-visible:outline focus-visible:outline-2 focus-visible:outline-medblue" aria-label="Close sign in dialog">
            <svg aria-hidden="true" className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4"><path d="m6 6 12 12M18 6 6 18" /></svg>
          </button>
        </div>

        {unavailable ? (
          <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm leading-6 text-amber-950">
            <strong className="block">Configuration needed</strong>
            {authConfigurationMessage()}
          </div>
        ) : (
          <>
            {notice && <p className="mb-4 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-900">{notice}</p>}
            {error && <p role="alert" className="mb-4 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-medium text-rose-900">{error}</p>}

            {mode !== "confirm" && (
              <div className="mb-5 grid grid-cols-2 rounded-xl bg-slate-100 p-1" role="tablist" aria-label="Account action">
                <button type="button" role="tab" aria-selected={mode === "sign-in"} onClick={() => switchMode("sign-in")} className={`rounded-lg px-3 py-2.5 text-sm font-bold transition ${mode === "sign-in" ? "bg-white text-medblue shadow-sm" : "text-slate-600 hover:text-slate-900"}`}>Sign in</button>
                <button type="button" role="tab" aria-selected={mode === "sign-up"} onClick={() => switchMode("sign-up")} className={`rounded-lg px-3 py-2.5 text-sm font-bold transition ${mode === "sign-up" ? "bg-white text-medblue shadow-sm" : "text-slate-600 hover:text-slate-900"}`}>Create account</button>
              </div>
            )}

            {mode === "sign-in" && (
              <form className="space-y-4" onSubmit={handleSignIn}>
                <label className="block text-sm font-bold text-slate-800">Email address
                  <input autoComplete="email" autoFocus required type="email" value={email} onChange={(event) => setEmail(event.target.value)} className="mt-1.5 w-full rounded-xl border border-slate-300 px-4 py-3 text-base outline-none transition focus:border-medblue focus:ring-4 focus:ring-blue-100" placeholder="you@example.com" />
                </label>
                <label className="block text-sm font-bold text-slate-800">Password
                  <input autoComplete="current-password" required minLength={10} type="password" value={password} onChange={(event) => setPassword(event.target.value)} className="mt-1.5 w-full rounded-xl border border-slate-300 px-4 py-3 text-base outline-none transition focus:border-medblue focus:ring-4 focus:ring-blue-100" placeholder="Your password" />
                </label>
                <button disabled={submitting} type="submit" className="inline-flex w-full items-center justify-center rounded-xl bg-medblue px-5 py-3.5 text-base font-extrabold text-white shadow-lg shadow-blue-700/20 transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60">
                  {submitting ? "Signing in…" : "Sign in securely"}
                </button>
              </form>
            )}

            {mode === "sign-up" && (
              <form className="space-y-4" onSubmit={handleSignUp}>
                <label className="block text-sm font-bold text-slate-800">Email address
                  <input autoComplete="email" autoFocus required type="email" value={email} onChange={(event) => setEmail(event.target.value)} className="mt-1.5 w-full rounded-xl border border-slate-300 px-4 py-3 text-base outline-none transition focus:border-medblue focus:ring-4 focus:ring-blue-100" placeholder="you@example.com" />
                </label>
                <label className="block text-sm font-bold text-slate-800">Create password
                  <input autoComplete="new-password" required minLength={10} type="password" value={password} onChange={(event) => setPassword(event.target.value)} className="mt-1.5 w-full rounded-xl border border-slate-300 px-4 py-3 text-base outline-none transition focus:border-medblue focus:ring-4 focus:ring-blue-100" placeholder="10+ characters, with a symbol" />
                </label>
                <label className="block text-sm font-bold text-slate-800">Confirm password
                  <input autoComplete="new-password" required minLength={10} type="password" value={passwordConfirmation} onChange={(event) => setPasswordConfirmation(event.target.value)} className="mt-1.5 w-full rounded-xl border border-slate-300 px-4 py-3 text-base outline-none transition focus:border-medblue focus:ring-4 focus:ring-blue-100" placeholder="Repeat your password" />
                </label>
                <p className="text-xs leading-5 text-slate-500">Use at least 10 characters with upper and lower case letters, a number, and a symbol.</p>
                <button disabled={submitting} type="submit" className="inline-flex w-full items-center justify-center rounded-xl bg-medblue px-5 py-3.5 text-base font-extrabold text-white shadow-lg shadow-blue-700/20 transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60">
                  {submitting ? "Creating account…" : "Create secure account"}
                </button>
              </form>
            )}

            {mode === "confirm" && (
              <form className="space-y-4" onSubmit={handleConfirmation}>
                <label className="block text-sm font-bold text-slate-800">Email address
                  <input autoComplete="email" autoFocus required type="email" value={email} onChange={(event) => setEmail(event.target.value)} className="mt-1.5 w-full rounded-xl border border-slate-300 px-4 py-3 text-base outline-none transition focus:border-medblue focus:ring-4 focus:ring-blue-100" placeholder="you@example.com" />
                </label>
                <label className="block text-sm font-bold text-slate-800">Verification code
                  <input autoComplete="one-time-code" required inputMode="numeric" value={code} onChange={(event) => setCode(event.target.value)} className="mt-1.5 w-full rounded-xl border border-slate-300 px-4 py-3 text-base tracking-[0.2em] outline-none transition focus:border-medblue focus:ring-4 focus:ring-blue-100" placeholder="123456" />
                </label>
                <button disabled={submitting} type="submit" className="inline-flex w-full items-center justify-center rounded-xl bg-medblue px-5 py-3.5 text-base font-extrabold text-white shadow-lg shadow-blue-700/20 transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60">
                  {submitting ? "Verifying…" : "Verify email"}
                </button>
                <button type="button" disabled={resending || submitting} onClick={() => void handleResendCode()} className="w-full text-sm font-bold text-medblue underline-offset-4 hover:underline disabled:cursor-not-allowed disabled:opacity-60">{resending ? "Sending a new code…" : "Send a new code"}</button>
                <button type="button" onClick={() => switchMode("sign-in")} className="w-full text-sm font-bold text-medblue underline-offset-4 hover:underline">Back to sign in</button>
              </form>
            )}
          </>
        )}
      </section>
    </div>
  );
}

export function authErrorMessage(error: unknown): string {
  return error instanceof AuthenticationError ? error.message : friendlyAuthenticationError(error).message;
}
