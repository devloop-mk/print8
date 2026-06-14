"use client";

import { useState } from "react";
import { useTranslations, useLocale } from "next-intl";
import { Link, usePathname } from "@/i18n/routing";
import { useCart } from "@/components/cart/CartProvider";
import { cn } from "@/lib/utils";
import {
  Menu,
  X,
  ShoppingCart,
  Globe,
} from "lucide-react";

const navItems = [
  { href: "/", key: "home" },
  { href: "/services", key: "services" },
  { href: "/designs", key: "designs" },
  { href: "/products", key: "products" },
  { href: "/about", key: "about" },
  { href: "/contact", key: "contact" },
  { href: "/faq", key: "faq" },
] as const;

export function Header() {
  const t = useTranslations("nav");
  const locale = useLocale();
  const pathname = usePathname();
  const { itemCount } = useCart();
  const [mobileOpen, setMobileOpen] = useState(false);

  const otherLocale = locale === "mk" ? "en" : "mk";

  return (
    <header className="sticky top-0 z-50 border-b border-ink-200 bg-white/95 backdrop-blur">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4 sm:px-6 lg:px-8">
        <Link href="/" className="flex items-center gap-2">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-brand-600 text-lg font-bold text-white">
            8
          </div>
          <span className="font-display text-xl font-bold text-ink-900">
            Print 8
          </span>
        </Link>

        <nav className="hidden items-center gap-1 md:flex">
          {navItems.map((item) => (
            <Link
              key={item.key}
              href={item.href}
              className={cn(
                "rounded-lg px-3 py-2 text-sm font-medium transition",
                pathname === item.href
                  ? "bg-brand-50 text-brand-700"
                  : "text-ink-600 hover:bg-ink-50 hover:text-ink-900",
              )}
            >
              {t(item.key)}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-2">
          <Link
            href={pathname}
            locale={otherLocale}
            className="flex items-center gap-1 rounded-lg px-3 py-2 text-sm font-medium text-ink-600 transition hover:bg-ink-50"
          >
            <Globe className="h-4 w-4" />
            {otherLocale.toUpperCase()}
          </Link>

          <Link
            href="/cart"
            className="relative rounded-lg p-2 text-ink-600 transition hover:bg-ink-50"
          >
            <ShoppingCart className="h-5 w-5" />
            {itemCount > 0 && (
              <span className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-brand-600 text-xs font-bold text-white">
                {itemCount}
              </span>
            )}
          </Link>

          <button
            type="button"
            className="rounded-lg p-2 text-ink-600 md:hidden"
            onClick={() => setMobileOpen(!mobileOpen)}
            aria-label="Toggle menu"
          >
            {mobileOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
        </div>
      </div>

      {mobileOpen && (
        <nav className="border-t border-ink-200 px-4 py-4 md:hidden">
          {navItems.map((item) => (
            <Link
              key={item.key}
              href={item.href}
              onClick={() => setMobileOpen(false)}
              className={cn(
                "block rounded-lg px-3 py-2 text-sm font-medium",
                pathname === item.href
                  ? "bg-brand-50 text-brand-700"
                  : "text-ink-600",
              )}
            >
              {t(item.key)}
            </Link>
          ))}
        </nav>
      )}
    </header>
  );
}
