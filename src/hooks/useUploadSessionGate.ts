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
    if (session.token || session.loading) return;
    if (!turnstileToken) return;

    let cancelled = false;
    setCreating(true);
    session
      .createSession(turnstileToken)
      .then((created) => {
        if (!cancelled && !created) setTurnstileToken('');
      })
      .finally(() => {
        if (!cancelled) setCreating(false);
      });

    return () => {
      cancelled = true;
    };
  }, [
    session.turnstileRequired,
    session.token,
    session.loading,
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

  const loading =
    session.loading ||
    creating ||
    (session.turnstileRequired && !session.token && Boolean(turnstileToken));

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
