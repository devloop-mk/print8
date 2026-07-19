import { Resend } from 'resend';

/** Shared brand tokens for transactional HTML emails. */
export const EMAIL_BRAND = {
  primary: '#2f7cb2',
  primaryDark: '#225376',
  ink: '#0f172a',
  muted: '#64748b',
  border: '#e2e8f0',
  surface: '#f8fafc',
  white: '#ffffff',
  accent: '#e85d04',
} as const;

const DEFAULT_FROM = 'Print 8 <orders@print8.mk>';

let resendSingleton: Resend | null | undefined;

/** Lazily construct one Resend client per process (serverless-friendly). */
export function getResendClient(): Resend | null {
  if (resendSingleton !== undefined) return resendSingleton;
  const apiKey = process.env.RESEND_API_KEY;
  resendSingleton = apiKey ? new Resend(apiKey) : null;
  return resendSingleton;
}

export function getEmailFromAddress(fallback = DEFAULT_FROM): string {
  return process.env.EMAIL_FROM?.trim() || fallback;
}

export function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}
