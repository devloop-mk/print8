"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/routing";
import { useCart } from "@/components/cart/CartProvider";
import { cn } from "@/lib/utils";
import { LanguageSwitcher } from "@/components/layout/LanguageSwitcher";
import { MobileNav } from "@/components/layout/MobileNav";
import { Logo } from "@/components/brand/Logo";
import { Menu, ShoppingCart } from "lucide-react";
import { usePathname } from "@/i18n/routing";

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
  const pathname = usePathname();
  const { itemCount } = useCart();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [menuMounted, setMenuMounted] = useState(false);

  function openMenu() {
    setMenuMounted(true);
    window.requestAnimationFrame(() => setMobileOpen(true));
  }

  function closeMenu() {
    setMobileOpen(false);
  }

  useEffect(() => {
    closeMenu();
  }, [pathname]);

  useEffect(() => {
    if (mobileOpen) return;
    const timer = window.setTimeout(() => setMenuMounted(false), 300);
    return () => window.clearTimeout(timer);
  }, [mobileOpen]);

  return (
    <>
      <header className="sticky top-0 z-50 border-b border-ink-200 bg-white/95 backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3.5 sm:px-6 md:py-4 lg:px-8">
          <Link href="/" className="flex items-center">
            <Logo priority className="h-7 md:h-10" />
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

          <div className="flex items-center gap-1 sm:gap-2">
            <div className="hidden md:block">
              <LanguageSwitcher />
            </div>

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
              className="rounded-lg p-2 text-ink-600 transition hover:bg-ink-50 md:hidden"
              onClick={openMenu}
              aria-label={t('openMenu')}
              aria-expanded={mobileOpen}
            >
              <Menu className="h-6 w-6" />
            </button>
          </div>
        </div>
      </header>

      {menuMounted ? (
        <MobileNav open={mobileOpen} onClose={closeMenu} />
      ) : null}
    </>
  );
}
