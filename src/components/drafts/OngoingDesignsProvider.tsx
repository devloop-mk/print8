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
  DESIGN_SAVED_EVENT,
  DRAFTS_CHANGED_EVENT,
} from '@/lib/drafts/draft-events';
import {
  collectOngoingDesigns,
  deleteOngoingDesign,
  type OngoingDesignItem,
} from '@/lib/drafts/ongoing-designs';

type OngoingDesignsContextValue = {
  items: OngoingDesignItem[];
  count: number;
  hydrated: boolean;
  saveHintVisible: boolean;
  refresh: () => void;
  remove: (id: string) => void;
  dismissSaveHint: () => void;
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
  const [saveHintVisible, setSaveHintVisible] = useState(false);
  const [saveHintToken, setSaveHintToken] = useState(0);

  const refresh = useCallback(() => {
    setItems(collectOngoingDesigns());
  }, []);

  const dismissSaveHint = useCallback(() => {
    setSaveHintVisible(false);
  }, []);

  const remove = useCallback(
    (id: string) => {
      deleteOngoingDesign(id);
      refresh();
    },
    [refresh],
  );

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

    const onDesignSaved = () => {
      refresh();
      setSaveHintToken((token) => token + 1);
      setSaveHintVisible(true);
    };

    window.addEventListener('storage', onStorage);
    window.addEventListener(DRAFTS_CHANGED_EVENT, refresh);
    window.addEventListener(DESIGN_SAVED_EVENT, onDesignSaved);
    return () => {
      window.removeEventListener('storage', onStorage);
      window.removeEventListener(DRAFTS_CHANGED_EVENT, refresh);
      window.removeEventListener(DESIGN_SAVED_EVENT, onDesignSaved);
    };
  }, [refresh]);

  useEffect(() => {
    if (!saveHintVisible) return;
    const timer = window.setTimeout(() => setSaveHintVisible(false), 9000);
    return () => window.clearTimeout(timer);
  }, [saveHintVisible, saveHintToken]);

  const value = useMemo(
    () => ({
      items,
      count: items.length,
      hydrated,
      saveHintVisible,
      refresh,
      remove,
      dismissSaveHint,
    }),
    [
      dismissSaveHint,
      hydrated,
      items,
      refresh,
      remove,
      saveHintVisible,
    ],
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
