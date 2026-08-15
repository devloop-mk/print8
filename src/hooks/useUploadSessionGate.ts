'use client';

import { useCallback, useEffect, useState } from 'react';
import { useUploadSession } from '@/hooks/useUploadSession';

/**
 * Upload session + Turnstile gate when NEXT_PUBLIC_TURNSTILE_SITE_KEY is set.
 * Renders TurnstileWidget via pendingTurnstile; pass setTurnstileToken from the widget callback.
 */
export function useUploadSessionGate() {
  const session = useUploadSession();
  const [turnstileToken, setTurnstileToken] = useState('');
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    if (!session.turnstileRequired) return;
    if (session.token) return;
    if (!turnstileToken) return;

    let cancelled = false;
    setCreating(true);
    session
      .createSession(turnstileToken)
      .then((created) => {
        if (!cancelled && !created) setTurnstileToken('');
      })
      .finally(() => {
        // Always clear — a prior effect cleanup can cancel the promise handlers
        // when session.loading flips during createSession, which previously left
        // creating stuck true and the upload UI spinning forever.
        setCreating(false);
      });

    return () => {
      cancelled = true;
    };
  }, [
    session.turnstileRequired,
    session.token,
    session.createSession,
    turnstileToken,
  ]);

  const refreshSession = useCallback(
    async (verifiedToken?: string) => {
      if (session.turnstileRequired) {
        if (verifiedToken) {
          setCreating(true);
          try {
            return await session.createSession(verifiedToken);
          } finally {
            setCreating(false);
          }
        }
        setTurnstileToken('');
        return null;
      }
      return session.refreshSession();
    },
    [session],
  );

  const pendingTurnstile =
    session.turnstileRequired &&
    !session.token &&
    !session.loading &&
    !creating &&
    !turnstileToken;

  const loading = session.turnstileRequired
    ? creating || (session.loading && !turnstileToken)
    : session.loading;
  return {
    token: session.token,
    loading,
    error: session.error,
    turnstileRequired: session.turnstileRequired,
    pendingTurnstile,
    setTurnstileToken,
    refreshSession,
  };
}
