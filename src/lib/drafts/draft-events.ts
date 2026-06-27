export const DRAFTS_CHANGED_EVENT = 'print8-drafts-changed';

export function dispatchDraftsChanged() {
  if (typeof window === 'undefined') return;
  window.dispatchEvent(new Event(DRAFTS_CHANGED_EVENT));
}
