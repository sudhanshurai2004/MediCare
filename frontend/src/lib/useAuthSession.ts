"use client";

import { useCallback, useEffect, useState } from "react";

import { authConfigurationMessage, isAuthConfigured } from "./amplify";
import { currentAuthenticatedUser } from "./auth";
import type { AuthUser } from "./types";

interface AuthSessionState {
  user: AuthUser | null;
  loading: boolean;
  configurationError: string | null;
  refresh: () => Promise<void>;
}

export function useAuthSession(): AuthSessionState {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [configurationError, setConfigurationError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    if (!isAuthConfigured()) {
      setUser(null);
      setConfigurationError(authConfigurationMessage());
      setLoading(false);
      return;
    }
    setLoading(true);
    setConfigurationError(null);
    const authenticatedUser = await currentAuthenticatedUser();
    setUser(authenticatedUser);
    setLoading(false);
  }, []);

  useEffect(() => {
    void refresh();
    const handleChange = () => {
      void refresh();
    };
    window.addEventListener("medbridge:auth-changed", handleChange);
    return () => window.removeEventListener("medbridge:auth-changed", handleChange);
  }, [refresh]);

  return { user, loading, configurationError, refresh };
}
