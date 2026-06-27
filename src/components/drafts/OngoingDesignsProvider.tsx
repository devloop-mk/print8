'use client';

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import {
  collectOngoingDesigns,
  DRAFTS_CHANGED_EVENT,
  type OngoingDesignItem,
} from '@/lib/drafts/ongoing-designs';

type OngoingDesignsContextValue = {
  items: OngoingDesignItem[];
  count: number;
  hydrated: boolean;
  refresh: () => void;
};

const OngoingDesignsContext = createContext<OngoingDesignsContextValue | null>(
  null,
);

export function OngoingDesignsProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [items, setItems] = useState<OngoingDesignItem[]>([]);
  const [hydrated, setHydrated] = useState(false);

  const refresh = useCallback(() => {
    setItems(collectOngoingDesigns());
  }, []);

  useEffect(() => {
    refresh();
    setHydrated(true);

    const onStorage = (event: StorageEvent) => {
      if (
        event.key === null ||
        event.key.startsWith('print8-')
      ) {
        refresh();
      }
    };

    window.addEventListener('storage', onStorage);
    window.addEventListener(DRAFTS_CHANGED_EVENT, refresh);
    return () => {
      window.removeEventListener('storage', onStorage);
      window.removeEventListener(DRAFTS_CHANGED_EVENT, refresh);
    };
  }, [refresh]);

  const value = useMemo(
    () => ({
      items,
      count: items.length,
      hydrated,
      refresh,
    }),
    [hydrated, items, refresh],
  );

  return (
    <OngoingDesignsContext.Provider value={value}>
      {children}
    </OngoingDesignsContext.Provider>
  );
}

export function useOngoingDesigns() {
  const context = useContext(OngoingDesignsContext);
  if (!context) {
    throw new Error('useOngoingDesigns must be used within OngoingDesignsProvider');
  }
  return context;
}
