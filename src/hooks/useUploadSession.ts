"use client";

import { useEffect, useState } from "react";

export function useUploadSession() {
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    async function init() {
      try {
        const stored = sessionStorage.getItem("print8-upload-token");
        if (stored) {
          if (!cancelled) setToken(stored);
          return;
        }

        const res = await fetch("/api/upload/session", { method: "POST" });
        const data = await res.json();
        if (res.ok && data.token) {
          sessionStorage.setItem("print8-upload-token", data.token);
          if (!cancelled) setToken(data.token);
        }
      } catch {
        // session creation failed
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    init();
    return () => {
      cancelled = true;
    };
  }, []);

  return { token, loading };
}
