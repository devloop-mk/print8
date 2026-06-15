"use client";

import { useCallback, useEffect, useState } from "react";

const STORAGE_KEY = "print8-upload-token";

export function useUploadSession() {
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const createSession = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/upload/session", { method: "POST" });
      const data = await res.json();

      if (!res.ok || !data.token) {
        throw new Error(data.error || "Failed to create upload session");
      }

      sessionStorage.setItem(STORAGE_KEY, data.token);
      setToken(data.token);
      return data.token as string;
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Failed to create upload session";
      setError(message);
      setToken(null);
      sessionStorage.removeItem(STORAGE_KEY);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  const refreshSession = useCallback(async () => {
    sessionStorage.removeItem(STORAGE_KEY);
    setToken(null);
    return createSession();
  }, [createSession]);

  useEffect(() => {
    let cancelled = false;

    async function init() {
      const stored = sessionStorage.getItem(STORAGE_KEY);
      if (stored) {
        if (!cancelled) {
          setToken(stored);
          setLoading(false);
        }
        return;
      }

      await createSession();
    }

    init();
    return () => {
      cancelled = true;
    };
  }, [createSession]);

  return { token, loading, error, refreshSession };
}
