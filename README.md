# Print 8

Professional printing company website built with Next.js 16, featuring bilingual support (Macedonian/English), design studio, product customizer, and cash-on-delivery ordering.

## Features

- **Bilingual** — Macedonian (default, no URL prefix) and English (`/en/...`)
- **Services** — All 12 Print 8 services with order-to-cart flow
- **Designs** — Template gallery + Fabric.js design studio
- **Products** — Catalog with customizer for t-shirts, mugs, cups, bags, gift sets
- **Cart & Checkout** — Payment on delivery (COD) only
- **Secure uploads** — Session-token gated uploads with rate limiting, file validation, and image re-encoding via Sharp

## Getting Started

```bash
# Install dependencies
bun install

# Run development server
bun dev
```

Open [http://localhost:3000](http://localhost:3000) — Macedonian by default; English at `/en`.

## Project Structure

```
src/
├── app/
│   ├── [locale]/          # Localized pages
│   └── api/               # Upload, orders, file serving
├── components/            # UI, cart, studio, checkout
├── i18n/                  # next-intl routing & config
├── lib/                   # DB, upload, catalog data
└── messages/              # mk.json & en.json translations
```

## Environment

No required env vars for local development. Orders and upload sessions are stored in `./data/store.json`; uploaded files go in `./uploads/`.

## Tech Stack

- Next.js 16 (App Router)
- TypeScript
- Tailwind CSS
- next-intl
- JSON file store (orders & uploads metadata)
- Fabric.js (design studio)
- Sharp (image processing)

## Customization

Update contact details in `messages/mk.json` and `messages/en.json` under the `contact` namespace.

Adjust starting prices in `src/lib/data/catalog.ts`.

## Production Notes

- Replace JSON file store with PostgreSQL for production
- Add admin authentication for order management
- Configure proper file storage (S3/Cloudinary) for uploads
- Add email notifications (Resend) on new orders
