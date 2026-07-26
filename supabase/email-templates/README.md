# Supabase Auth (email + Google)

## Google sign-in

1. **Google Cloud Console** → APIs & Services → Credentials → Create **OAuth client ID** (Web application)
   - Authorized JavaScript origins: `https://print8.mk`, `http://localhost:3000`
   - Authorized redirect URIs: `https://YOUR_PROJECT_REF.supabase.co/auth/v1/callback`
     (copy exact URL from Supabase → Authentication → Providers → Google)
2. **Supabase** → Authentication → **Providers** → **Google** → Enable
   - Paste Client ID and Client Secret from Google
3. **Supabase** → Authentication → **URL configuration**
   - Site URL: `https://print8.mk` (no trailing slash)
   - Redirect URLs (add each exactly — no query strings needed):
     - `https://print8.mk/auth/callback`
     - `https://www.print8.mk/auth/callback`
     - `http://localhost:3000/auth/callback`
     - Or wildcards: `https://print8.mk/**`, `https://www.print8.mk/**`
4. App callback route: `https://print8.mk/auth/callback` (handled by Next.js)

Users sign in on **Login** and **Register** via “Continue with Google”. Loyalty `customers` rows are created by the auth trigger (run `add-customer-on-auth-signup-trigger.sql` if not already).

Optional SQL update for Google `name` metadata: `migrations/auth-trigger-google-name-metadata.sql`

**Do not enable** “OAuth Server” (third-party apps using Print 8 as IdP) — that is unrelated to Google login.

---

# Supabase Auth email templates

Supabase sends signup verification, password reset, and email-change emails itself (not via Brevo API).
Customize them in the dashboard:

**Authentication → Email Templates**

## SMTP & URLs

- Under **SMTP**, use Brevo so these mails come from `orders@print8.mk`
- Set **Authentication → URL configuration → Site URL** to `https://print8.mk`
- Add redirect URLs for local dev: `http://localhost:3000/**`

## Confirm signup

1. Open **Confirm signup**
2. Subject: `Потврдете е-пошта — Print 8`
3. Copy the HTML from `confirm-signup.html` into the **Body (HTML)** field
4. Keep Supabase variables: `{{ .ConfirmationURL }}`, `{{ .SiteURL }}`, `{{ .Email }}`

Signup from the site sets `emailRedirectTo` to `/auth/callback?auth=signup`, so verified users land on the account page with a confirmation notice. If older emails still redirect to the homepage, the app forwards `?code=` / `?token_hash=` to `/auth/callback` automatically.

## Reset password

1. Open **Reset password** (sometimes labeled **Recovery** in older dashboards)
2. Subject: `Ресетирајте лозинка — Print 8`
3. Copy the HTML from `reset-password.html` into **Body (HTML)**
4. Variables used: `{{ .ConfirmationURL }}`, `{{ .Email }}`

## Change email address

1. Open **Change email address**
2. Subject: `Потврдете новата е-пошта — Print 8`
3. Copy the HTML from `change-email.html` into **Body (HTML)**
4. Variables used: `{{ .ConfirmationURL }}`, `{{ .Email }}`, `{{ .NewEmail }}`

With **Secure email change** enabled, Supabase may send this template twice (to the old and new address). The same HTML works for both.

## Language

All templates in this folder are **Macedonian only** (site default locale). Supabase does not know which language the user registered in, so one template is used for everyone.

Options for English signups:

- Keep MK as default (most customers)
- Add a short bilingual line in the footer only
- Send auth mail via a Supabase Auth Hook + Brevo API with locale from signup metadata (custom code)

## Tips

- Button `href` must stay `{{ .ConfirmationURL }}` — do not wrap or alter the variable
- If links expire before users click (corporate email scanners), consider showing `{{ .Token }}` as a 6-digit OTP fallback in the template body
- Disable link tracking in Brevo for auth emails so prefetchers do not consume one-time tokens
