import { NextResponse, type NextRequest } from 'next/server';
import type { EmailOtpType } from '@supabase/supabase-js';
import {
  getRequestOrigin,
  OAUTH_NEXT_COOKIE,
  resolveLocaleFromOAuthPath,
  sanitizeOAuthNextPath,
} from '@/lib/auth/oauth';
import { routing, type Locale } from '@/i18n/routing';
import { customersDb } from '@/lib/db/customers';
import { localePath } from '@/lib/seo/site';
import { createSupabaseRouteHandlerClient } from '@/lib/supabase/server-auth';

function oauthLoginRedirect(
  origin: string,
  locale: Locale,
  reason: string,
): NextResponse {
  return NextResponse.redirect(
    new URL(
      `${localePath(locale, '/account/login')}?oauth=failed&reason=${reason}`,
      origin,
    ),
  );
}

function emailConfirmFailedRedirect(origin: string, locale: Locale): NextResponse {
  return NextResponse.redirect(
    new URL(`${localePath(locale, '/account/login')}?email=confirm_failed`, origin),
  );
}

function isSignupConfirmation(
  searchParams: URLSearchParams,
): boolean {
  return (
    searchParams.get('auth') === 'signup' ||
    searchParams.get('type') === 'signup'
  );
}

function isPasswordRecovery(
  searchParams: URLSearchParams,
  otpType: string | null,
): boolean {
  return (
    searchParams.get('type') === 'recovery' || otpType === 'recovery'
  );
}

function buildPostAuthRedirectPath(
  origin: string,
  locale: Locale,
  searchParams: URLSearchParams,
  nextCookie: string | undefined,
  nextParam: string | null,
  otpType: string | null = null,
): string {
  if (isPasswordRecovery(searchParams, otpType)) {
    return new URL(
      localePath(locale, '/account/reset-password'),
      origin,
    ).pathname;
  }

  if (isSignupConfirmation(searchParams)) {
    return new URL(`${localePath(locale, '/account')}?email=confirmed`, origin).pathname;
  }

  return sanitizeOAuthNextPath(nextCookie ?? nextParam, locale);
}

async function syncCustomerProfile(user: {
  id: string;
  email?: string | null;
  user_metadata?: Record<string, unknown>;
}) {
  if (!user.id || !user.email) return;

  const metadata = user.user_metadata;
  const fullName =
    typeof metadata?.full_name === 'string'
      ? metadata.full_name
      : typeof metadata?.name === 'string'
        ? metadata.name
        : null;

  const customer = await customersDb.ensureProfile({
    id: user.id,
    email: user.email,
    fullName,
  });
  await customersDb.linkPastOrders(customer.id, customer.email);
}

export async function GET(request: NextRequest) {
  const origin = getRequestOrigin(request);
  const { searchParams } = request.nextUrl;
  const code = searchParams.get('code');
  const tokenHash = searchParams.get('token_hash');
  const otpType = searchParams.get('type');
  const nextParam = searchParams.get('next');
  const nextCookie = request.cookies.get(OAUTH_NEXT_COOKIE)?.value;
  const locale = resolveLocaleFromOAuthPath(
    nextCookie ?? nextParam ?? localePath(routing.defaultLocale, '/account'),
  );

  const providerError = searchParams.get('error');
  if (providerError) {
    console.error(
      '[auth/callback] OAuth provider error:',
      providerError,
      searchParams.get('error_description'),
    );
    return oauthLoginRedirect(origin, locale, 'provider');
  }

  if (!code && !tokenHash) {
    return NextResponse.redirect(
      new URL(`${localePath(locale, '/account/login')}?oauth=missing_code`, origin),
    );
  }

  const targetPath = buildPostAuthRedirectPath(
    origin,
    locale,
    searchParams,
    nextCookie,
    nextParam,
    otpType,
  );

  const supabase = await createSupabaseRouteHandlerClient();

  if (code) {
    const { data, error } = await supabase.auth.exchangeCodeForSession(code);

    if (error) {
      if (isSignupConfirmation(searchParams)) {
        console.error('[auth/callback] signup exchange failed:', error.message);
        return emailConfirmFailedRedirect(origin, locale);
      }

      const reason =
        error.message.toLowerCase().includes('flow state') ||
        error.message.toLowerCase().includes('code verifier')
          ? 'pkce'
          : 'exchange';
      console.error('[auth/callback] exchangeCodeForSession failed:', error.message);
      return oauthLoginRedirect(origin, locale, reason);
    }

    const response = NextResponse.redirect(new URL(targetPath, origin));
    response.cookies.delete(OAUTH_NEXT_COOKIE);

    if (data.user) {
      try {
        await syncCustomerProfile(data.user);
      } catch (profileError) {
        console.error('[auth/callback] customer profile sync failed:', profileError);
      }
    }

    return response;
  }

  if (tokenHash && otpType) {
    const { data, error } = await supabase.auth.verifyOtp({
      token_hash: tokenHash,
      type: otpType as EmailOtpType,
    });

    if (error) {
      console.error('[auth/callback] verifyOtp failed:', error.message);
      return emailConfirmFailedRedirect(origin, locale);
    }

    const response = NextResponse.redirect(new URL(targetPath, origin));
    response.cookies.delete(OAUTH_NEXT_COOKIE);

    if (data.user) {
      try {
        await syncCustomerProfile(data.user);
      } catch (profileError) {
        console.error('[auth/callback] customer profile sync failed:', profileError);
      }
    }

    return response;
  }

  return emailConfirmFailedRedirect(origin, locale);
}
