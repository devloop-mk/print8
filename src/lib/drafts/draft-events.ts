export const DRAFTS_CHANGED_EVENT = 'print8-drafts-changed';
export const DESIGN_SAVED_EVENT = 'print8-design-saved';

export function dispatchDraftsChanged() {
  if (typeof window === 'undefined') return;
  window.dispatchEvent(new Event(DRAFTS_CHANGED_EVENT));
}

export function dispatchDesignSaved() {
  if (typeof window === 'undefined') return;
  window.dispatchEvent(new Event(DESIGN_SAVED_EVENT));
}
