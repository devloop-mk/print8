'use client';

import { useEffect, useState } from 'react';
import type { ManagedSvgTemplateDefaultsPayload } from '@/lib/db/managed-svg-templates';

export type ManagedSvgDefaultsClientState = {
  defaults: Record<string, ManagedSvgTemplateDefaultsPayload>;
  versions: Record<string, string>;
};

const EMPTY_STATE: ManagedSvgDefaultsClientState = {
  defaults: {},
  versions: {},
};

let cachedState: ManagedSvgDefaultsClientState | null = null;
let inflight: Promise<ManagedSvgDefaultsClientState> | null = null;

async function fetchManagedSvgDefaultsState(): Promise<ManagedSvgDefaultsClientState> {
  if (cachedState) return cachedState;
  if (!inflight) {
    inflight = fetch('/api/public/managed-svg-defaults')
      .then(async (response) => {
        if (!response.ok) return EMPTY_STATE;
        const data = (await response.json()) as {
          templates?: Record<
            string,
            { defaults: ManagedSvgTemplateDefaultsPayload; updatedAt: string }
          >;
        };
        const templates = data.templates ?? {};
        const defaults = Object.fromEntries(
          Object.entries(templates).map(([id, entry]) => [id, entry.defaults]),
        );
        const versions = Object.fromEntries(
          Object.entries(templates)
            .filter(([, entry]) => entry.updatedAt)
            .map(([id, entry]) => [id, entry.updatedAt]),
        );
        return { defaults, versions };
      })
      .then((state) => {
        cachedState = state;
        return state;
      })
      .finally(() => {
        inflight = null;
      });
  }
  return inflight;
}

/** Client-side managed SVG defaults for gallery/search thumbnails. */
export function useManagedSvgDefaultsMap(): ManagedSvgDefaultsClientState {
  const [state, setState] = useState<ManagedSvgDefaultsClientState>(
    cachedState ?? EMPTY_STATE,
  );

  useEffect(() => {
    let cancelled = false;
    void fetchManagedSvgDefaultsState().then((next) => {
      if (!cancelled) setState(next);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  return state;
}

export function invalidateManagedSvgDefaultsMapCache() {
  cachedState = null;
}

export function patchManagedSvgDefaultsCache(
  templateId: string,
  defaults: ManagedSvgTemplateDefaultsPayload,
  updatedAt: string,
) {
  const base = cachedState ?? EMPTY_STATE;
  cachedState = {
    defaults: { ...base.defaults, [templateId]: defaults },
    versions: { ...base.versions, [templateId]: updatedAt },
  };
}
