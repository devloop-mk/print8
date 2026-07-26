# Supabase Auth email templates

Supabase sends signup verification and password-reset emails itself (not via Brevo API).
Customize them in the dashboard:

**Authentication → Email Templates**

## Confirm signup

1. Open **Confirm signup**
2. Subject (example): `Потврдете е-пошта — Print 8`
3. Copy the HTML from `confirm-signup.html` in this folder into the **Body (HTML)** field
4. Keep Supabase variables: `{{ .ConfirmationURL }}`, `{{ .SiteURL }}`, `{{ .Email }}`

## Tips

- Set **Authentication → URL configuration → Site URL** to `https://print8.mk` (and add `http://localhost:3000` for local dev)
- Under **SMTP**, use Brevo so these mails come from `orders@print8.mk`
- For Macedonian-only emails, use the MK text in the template; for English-only, adjust the copy

## Magic link / reset password

Reuse the same header styles from `confirm-signup.html` and set the button `href` to `{{ .ConfirmationURL }}`.
