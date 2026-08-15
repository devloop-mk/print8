'use client';

import { useCallback, useEffect, useState } from 'react';
import { isTurnstileActiveOnClient } from '@/lib/security/turnstile-public';

const STORAGE_KEY = 'print8-upload-token';

export function useUploadSession() {
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const turnstileRequired = isTurnstileActiveOnClient();

  const createSession = useCallback(async (turnstileToken?: string) => {
    setLoading(true);
    setError(null);

    try {
      const res = await fetch('/api/upload/session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(
          turnstileToken ? { turnstileToken } : {},
        ),
      });
      const data = await res.json();

      if (!res.ok || !data.token) {
        throw new Error(data.error || 'Failed to create upload session');
      }

      sessionStorage.setItem(STORAGE_KEY, data.token);
      setToken(data.token);
      return data.token as string;
    } catch (err) {
      const message =
        err instanceof Error ? err.message : 'Failed to create upload session';
      setError(message);
      setToken(null);
      sessionStorage.removeItem(STORAGE_KEY);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  const refreshSession = useCallback(
    async (turnstileToken?: string) => {
      sessionStorage.removeItem(STORAGE_KEY);
      setToken(null);
      return createSession(turnstileToken);
    },
    [createSession],
  );

  useEffect(() => {
    let cancelled = false;

    async function init() {
      const stored = sessionStorage.getItem(STORAGE_KEY);
      if (stored) {
        try {
          const validRes = await fetch('/api/upload/session/validate', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ token: stored }),
          });
          const validData = (await validRes.json()) as { valid?: boolean };
          if (validData.valid) {
            if (!cancelled) {
              setToken(stored);
              setLoading(false);
            }
            return;
          }
        } catch {
          // fall through and create a fresh session
        }
        sessionStorage.removeItem(STORAGE_KEY);
      }

      if (turnstileRequired) {
        if (!cancelled) setLoading(false);
        return;
      }

      await createSession();
    }

    init();
    return () => {
      cancelled = true;
    };
  }, [createSession, turnstileRequired]);

  return {
    token,
    loading,
    error,
    turnstileRequired,
    createSession,
    refreshSession,
  };
}
