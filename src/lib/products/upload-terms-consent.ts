const STORAGE_KEY = 'print8:upload-terms-accepted';

/** Session-scoped acceptance of the upload IP/Terms confirmation modal. */
export function hasAcceptedUploadTerms(): boolean {
  if (typeof window === 'undefined') return false;
  try {
    return window.sessionStorage.getItem(STORAGE_KEY) === '1';
  } catch {
    return false;
  }
}

export function markUploadTermsAccepted(): void {
  if (typeof window === 'undefined') return;
  try {
    window.sessionStorage.setItem(STORAGE_KEY, '1');
  } catch {
    // Ignore storage errors (private mode, quota, etc.) — the modal will
    // simply be shown again, which is an acceptable fallback.
  }
}
