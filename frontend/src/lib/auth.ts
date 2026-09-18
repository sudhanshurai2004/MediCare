"use client";

import {
  confirmSignUp,
  fetchAuthSession,
  getCurrentUser,
  resendSignUpCode,
  signIn,
  signOut,
  signUp,
} from "aws-amplify/auth";

import { authConfigurationMessage, configureAmplify } from "./amplify";
import type { AuthUser } from "./types";

export class AuthenticationError extends Error {
  code?: string;

  constructor(message: string, code?: string) {
    super(message);
    this.name = "AuthenticationError";
    this.code = code;
  }
}

function requireConfiguration(): void {
  if (!configureAmplify()) {
    throw new AuthenticationError(authConfigurationMessage(), "ConfigurationException");
  }
}

function errorDetails(error: unknown): { code?: string; message: string } {
  if (typeof error === "object" && error !== null) {
    const candidate = error as { name?: unknown; message?: unknown };
    return {
      code: typeof candidate.name === "string" ? candidate.name : undefined,
      message: typeof candidate.message === "string" ? candidate.message : "Authentication could not be completed.",
    };
  }
  return { message: "Authentication could not be completed." };
}

export function friendlyAuthenticationError(error: unknown): AuthenticationError {
  if (error instanceof AuthenticationError) {
    return error;
  }
  const { code, message } = errorDetails(error);
  const knownMessages: Record<string, string> = {
    UserNotFoundException: "We could not find an account with that email address.",
    NotAuthorizedException: "That email or password is incorrect.",
    UserNotConfirmedException: "Please enter the verification code sent to your email.",
    UsernameExistsException: "An account already exists with that email address. Please sign in instead.",
    CodeMismatchException: "That verification code is not correct. Please check the email and try again.",
    ExpiredCodeException: "That verification code has expired. Request a new code and try again.",
    InvalidPasswordException: "Use at least 10 characters with upper and lower case letters, a number, and a symbol.",
    LimitExceededException: "Too many attempts were made. Please wait a few minutes and try again.",
    PasswordResetRequiredException: "Your password needs to be reset in Cognito before you can sign in.",
  };
  return new AuthenticationError(knownMessages[code ?? ""] ?? message, code);
}

function announceAuthChange(): void {
  if (typeof window !== "undefined") {
    window.dispatchEvent(new Event("medbridge:auth-changed"));
  }
}

export async function currentAuthenticatedUser(): Promise<AuthUser | null> {
  if (!configureAmplify()) {
    return null;
  }
  try {
    const user = await getCurrentUser();
    return { userId: user.userId, username: user.username };
  } catch {
    return null;
  }
}

export async function getIdToken(): Promise<string> {
  requireConfiguration();
  try {
    const session = await fetchAuthSession();
    const token = session.tokens?.idToken?.toString();
    if (!token) {
      throw new AuthenticationError("Your session has expired. Please sign in again.", "SessionExpired");
    }
    return token;
  } catch (error) {
    if (error instanceof AuthenticationError) {
      throw error;
    }
    throw friendlyAuthenticationError(error);
  }
}

export async function signInWithEmail(email: string, password: string): Promise<{ signedIn: boolean; nextStep?: string }> {
  requireConfiguration();
  try {
    const result = await signIn({ username: email.trim().toLowerCase(), password });
    if (result.isSignedIn) {
      announceAuthChange();
    }
    return { signedIn: result.isSignedIn, nextStep: result.nextStep.signInStep };
  } catch (error) {
    throw friendlyAuthenticationError(error);
  }
}

export async function signUpWithEmail(email: string, password: string): Promise<{ complete: boolean; nextStep?: string }> {
  requireConfiguration();
  try {
    const result = await signUp({
      username: email.trim().toLowerCase(),
      password,
      options: {
        userAttributes: { email: email.trim().toLowerCase() },
      },
    });
    return { complete: result.isSignUpComplete, nextStep: result.nextStep.signUpStep };
  } catch (error) {
    throw friendlyAuthenticationError(error);
  }
}

export async function confirmEmailCode(email: string, code: string): Promise<void> {
  requireConfiguration();
  try {
    await confirmSignUp({ username: email.trim().toLowerCase(), confirmationCode: code.trim() });
  } catch (error) {
    throw friendlyAuthenticationError(error);
  }
}

export async function resendEmailVerificationCode(email: string): Promise<void> {
  requireConfiguration();
  try {
    await resendSignUpCode({ username: email.trim().toLowerCase() });
  } catch (error) {
    throw friendlyAuthenticationError(error);
  }
}

export async function signOutCurrentUser(): Promise<void> {
  requireConfiguration();
  try {
    await signOut();
    announceAuthChange();
  } catch (error) {
    throw friendlyAuthenticationError(error);
  }
}

export function requestAuthenticationDialog(): void {
  if (typeof window !== "undefined") {
    window.dispatchEvent(new Event("medbridge:open-auth"));
  }
}
