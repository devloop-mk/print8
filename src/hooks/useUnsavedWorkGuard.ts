'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { useRouter } from '@/i18n/navigation';
import { toInternalHref } from '@/i18n/internal-path';
import { useTranslations } from 'next-intl';

type PendingNavigation = {
  href?: string;
  action: 'href' | 'back' | 'reload';
};

export function useUnsavedWorkGuard({
  isDirty,
  onSave,
}: {
  isDirty: boolean;
  onSave: () => Promise<boolean> | boolean;
}) {
  const router = useRouter();
  const t = useTranslations('unsavedWork');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveNotice, setSaveNotice] = useState<string | null>(null);
  const [pendingNavigation, setPendingNavigation] =
    useState<PendingNavigation | null>(null);
  const bypassRef = useRef(false);
  const isDirtyRef = useRef(isDirty);

  isDirtyRef.current = isDirty;

  const proceedNavigation = useCallback(
    (navigation: PendingNavigation | null) => {
      bypassRef.current = true;
      setDialogOpen(false);
      setPendingNavigation(null);
      setSaveNotice(null);

      if (!navigation) return;

      if (navigation.action === 'href' && navigation.href) {
        router.push(toInternalHref(navigation.href));
        return;
      }

      if (navigation.action === 'back') {
        window.history.go(-2);
        return;
      }

      if (navigation.action === 'reload') {
        window.location.reload();
      }
    },
    [router],
  );

  const openDialog = useCallback((navigation: PendingNavigation) => {
    setSaveNotice(null);
    setPendingNavigation(navigation);
    setDialogOpen(true);
  }, []);

  const requestLeave = useCallback(
    (href?: string) => {
      if (!isDirtyRef.current || bypassRef.current) {
        if (href) {
          bypassRef.current = true;
          router.push(toInternalHref(href));
        }
        return;
      }

      openDialog({
        action: 'href',
        href: href ? toInternalHref(href) : undefined,
      });
    },
    [openDialog, router],
  );

  const allowNavigation = useCallback(() => {
    bypassRef.current = true;
    setDialogOpen(false);
    setPendingNavigation(null);
    setSaveNotice(null);
  }, []);

  const cancelNavigation = useCallback(() => {
    setDialogOpen(false);
    setPendingNavigation(null);
    setSaveNotice(null);
  }, []);

  const handleSave = useCallback(async () => {
    setSaving(true);
    try {
      const saved = await onSave();
      if (!saved) return;
      setSaveNotice(t('saved'));
      window.setTimeout(() => {
        cancelNavigation();
      }, 900);
    } finally {
      setSaving(false);
    }
  }, [cancelNavigation, onSave, t]);

  const handleLeaveWithoutSaving = useCallback(() => {
    proceedNavigation(pendingNavigation);
  }, [pendingNavigation, proceedNavigation]);

  useEffect(() => {
    if (!isDirty) return;

    const onBeforeUnload = (event: BeforeUnloadEvent) => {
      if (bypassRef.current) return;
      event.preventDefault();
      event.returnValue = '';
    };

    window.addEventListener('beforeunload', onBeforeUnload);
    return () => window.removeEventListener('beforeunload', onBeforeUnload);
  }, [isDirty]);

  useEffect(() => {
    if (!isDirty) return;

    const onDocumentClick = (event: MouseEvent) => {
      if (bypassRef.current) return;

      const target = event.target;
      if (!(target instanceof Element)) return;

      const anchor = target.closest('a[href]');
      if (!anchor || anchor.getAttribute('target') === '_blank') return;

      const href = anchor.getAttribute('href');
      if (!href || href.startsWith('#') || href.startsWith('mailto:') || href.startsWith('tel:')) {
        return;
      }

      const url = new URL(href, window.location.href);
      if (url.origin !== window.location.origin) return;

      const nextPath = `${url.pathname}${url.search}${url.hash}`;
      const currentPath = `${window.location.pathname}${window.location.search}${window.location.hash}`;
      if (nextPath === currentPath) return;

      event.preventDefault();
      event.stopPropagation();
      openDialog({ action: 'href', href: toInternalHref(`${url.pathname}${url.search}`) });
    };

    document.addEventListener('click', onDocumentClick, true);
    return () => document.removeEventListener('click', onDocumentClick, true);
  }, [isDirty, openDialog]);

  useEffect(() => {
    if (!isDirty) return;

    window.history.pushState({ unsavedWorkGuard: true }, '', window.location.href);

    const onPopState = () => {
      if (bypassRef.current) {
        bypassRef.current = false;
        return;
      }

      window.history.pushState({ unsavedWorkGuard: true }, '', window.location.href);
      openDialog({ action: 'back' });
    };

    window.addEventListener('popstate', onPopState);
    return () => window.removeEventListener('popstate', onPopState);
  }, [isDirty, openDialog]);

  return {
    dialogOpen,
    saving,
    saveNotice,
    requestLeave,
    allowNavigation,
    cancelNavigation,
    handleSave,
    handleLeaveWithoutSaving,
  };
}
