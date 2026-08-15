import type { NextConfig } from "next";
import path from "path";
import { fileURLToPath } from "url";
import createNextIntlPlugin from "next-intl/plugin";

const withNextIntl = createNextIntlPlugin("./src/i18n/request.ts");
const projectRoot = path.dirname(fileURLToPath(import.meta.url));

const turnstileActive =
  Boolean(process.env.TURNSTILE_SECRET_KEY?.trim()) &&
  Boolean(process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY?.trim());

function getAssetRemotePatterns() {
  const cdn = process.env.NEXT_PUBLIC_ASSETS_CDN_URL;
  if (!cdn) return [];

  try {
    const url = new URL(cdn);
    return [
      {
        protocol: url.protocol.replace(":", "") as "http" | "https",
        hostname: url.hostname,
        pathname: "/**",
      },
    ];
  } catch {
    return [];
  }
}

const nextConfig: NextConfig = {
  env: {
    NEXT_PUBLIC_TURNSTILE_ACTIVE: turnstileActive ? "1" : "",
  },
  outputFileTracingRoot: projectRoot,
  serverExternalPackages: ['sharp'],
  // Static catalog images are served by CDN / Vercel static, not the serverless
  // function. Without this, NFT pulls public/ (~hundreds of MB) into page
  // bundles (e.g. designs/customize) via fs helpers that join process.cwd()/public.
  outputFileTracingExcludes: {
    '/*': [
      './public/**',
      './scripts/**',
      './ms-playwright/**',
      './playwright/.cache/**',
      './supabase/**',
    ],
  },
  // /api/og reads the brand logo off disk (fs) to inline it as a data URI —
  // re-include just that one small asset for this route so it survives the
  // blanket `./public/**` exclusion above instead of 404ing in production.
  // /api/og/design falls back to public/og/*.jpg when CDN/site fetch fails.
  outputFileTracingIncludes: {
    '/api/og': ['./public/logo/**', './public/og/**'],
    '/api/og/design': ['./public/og/**', './public/logo/**'],
  },
  turbopack: {
    root: projectRoot,
  },
  images: {
    remotePatterns: getAssetRemotePatterns(),
    // Mockup URLs use ?v=N cache-bust; Next requires an explicit localPatterns entry
    // when src includes a query string (otherwise next/image throws).
    localPatterns: [
      {
        pathname: '/t-shirts/**',
      },
      {
        pathname: '/polo/**',
      },
      {
        pathname: '/**',
        search: '',
      },
    ],
  },
  experimental: {
    optimizePackageImports: ['lucide-react'],
    serverActions: {
      bodySizeLimit: "12mb",
    },
  },
  async redirects() {
    return [
      {
        source: "/:locale/designs/create",
        destination: "/:locale/designs/custom",
        permanent: true,
      },
      // Legacy unisex tee SKU (`tshirt-basic-white` → `tshirt-unisex`)
      {
        source: "/products/tshirt-basic-white",
        destination: "/products/tshirt-unisex",
        permanent: true,
      },
      {
        source: "/products/tshirt-basic-white/:path*",
        destination: "/products/tshirt-unisex/:path*",
        permanent: true,
      },
      {
        source: "/:locale(en)/products/tshirt-basic-white",
        destination: "/:locale/products/tshirt-unisex",
        permanent: true,
      },
      {
        source: "/:locale(en)/products/tshirt-basic-white/:path*",
        destination: "/:locale/products/tshirt-unisex/:path*",
        permanent: true,
      },
    ];
  },
  async headers() {
    const securityHeaders = [
      { key: "X-Frame-Options", value: "DENY" },
      { key: "X-Content-Type-Options", value: "nosniff" },
      { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
      {
        key: "Permissions-Policy",
        value: "camera=(), microphone=(), geolocation=()",
      },
      {
        key: "Content-Security-Policy",
        value:
          "default-src 'self'; base-uri 'self'; form-action 'self'; frame-ancestors 'none'; frame-src 'self' https://challenges.cloudflare.com; img-src 'self' data: blob: https:; font-src 'self' data: https:; style-src 'self' 'unsafe-inline' https:; script-src 'self' 'unsafe-inline' 'unsafe-eval' https://challenges.cloudflare.com https:; connect-src 'self' https: wss:; object-src 'none'",
      },
    ];

    if (process.env.NODE_ENV === "production") {
      securityHeaders.push({
        key: "Strict-Transport-Security",
        value: "max-age=31536000; includeSubDomains",
      });
    }

    return [
      {
        source: "/:path*",
        headers: securityHeaders,
      },
      {
        source: "/:path*\\.(svg|jpg|jpeg|png|webp|avif|ico|woff2)",
        headers: [
          {
            key: "Cache-Control",
            value: "public, max-age=31536000, immutable",
          },
        ],
      },
      {
        source: "/hero/:path*",
        headers: [
          {
            key: "Cache-Control",
            value: "public, max-age=86400, stale-while-revalidate=604800",
          },
        ],
      },
      {
        source: "/banners/:path*",
        headers: [
          {
            key: "Cache-Control",
            value: "public, max-age=86400, stale-while-revalidate=604800",
          },
        ],
      },
    ];
  },
};

export default withNextIntl(nextConfig);
