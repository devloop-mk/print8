"use client";

import dynamic from "next/dynamic";
import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { useCart } from "@/components/cart/CartProvider";
import { cn } from "@/lib/utils";
import { LanguageSwitcher } from "@/components/layout/LanguageSwitcher";
import { MobileNav } from "@/components/layout/MobileNav";
import { ProductsNavDropdown } from "@/components/layout/ProductsNavDropdown";
import { DesignsNavDropdown } from "@/components/layout/DesignsNavDropdown";
import { HelpNavDropdown } from "@/components/layout/HelpNavDropdown";
import { OngoingDesignsNav } from "@/components/drafts/OngoingDesignsNav";
import { GlobalSearchButton } from "@/components/search/GlobalSearchButton";
import { Logo } from "@/components/brand/Logo";
import { Menu, ShoppingCart } from "lucide-react";
import { usePathname } from "@/i18n/navigation";

const GlobalSearch = dynamic(
  () =>
    import("@/components/search/GlobalSearch").then((mod) => mod.GlobalSearch),
  { ssr: false },
);

const navItems = [
  { href: "/", key: "home" },
  { href: "/services", key: "services" },
  { href: "/products", key: "products" },
  { href: "/designs", key: "designs" },
  { href: "/about", key: "about" },
  { href: "/contact", key: "help" },
] as const;

export function Header() {
  const t = useTranslations("nav");
  const pathname = usePathname();
  const { itemCount } = useCart();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [menuMounted, setMenuMounted] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);

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
      <header className="sticky top-0 z-50 border-b-2 border-ink-200 bg-white/95 backdrop-blur-md">
        <div
          className="hidden h-1 w-full bg-gradient-to-r from-brand-500 via-brand-700 to-ink-900 lg:block"
          aria-hidden
        />
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 sm:px-6 md:py-3.5 lg:px-8">
          <Link href="/" className="flex items-center">
            <Logo priority className="h-7 md:h-10" />
          </Link>

          <nav className="hidden items-stretch gap-0.5 lg:flex">
            {navItems.map((item) => {
              if (item.key === "products") {
                return <ProductsNavDropdown key={item.key} />;
              }

              if (item.key === "designs") {
                return <DesignsNavDropdown key={item.key} />;
              }

              if (item.key === "help") {
                return <HelpNavDropdown key={item.key} />;
              }

              const active = pathname === item.href;
              return (
                <Link
                  key={item.key}
                  href={item.href}
                  className={cn(
                    "border-x border-transparent px-2.5 py-2.5 text-sm font-semibold uppercase tracking-wide transition lg:px-3",
                    active
                      ? "bg-brand-50 text-brand-700"
                      : "text-ink-600 hover:bg-ink-50 hover:text-ink-900",
                  )}
                >
                  {t(item.key)}
                </Link>
              );
            })}
          </nav>

          <div className="flex items-center gap-1 sm:gap-2">
            <GlobalSearchButton onClick={() => setSearchOpen(true)} />

            <div className="hidden lg:block">
              <LanguageSwitcher />
            </div>

            <OngoingDesignsNav />

            <Link
              href="/cart"
              className="relative border-2 border-transparent p-2 text-ink-600 transition hover:border-ink-200 hover:bg-ink-50"
            >
              <ShoppingCart className="h-5 w-5" />
              {itemCount > 0 && (
                <span className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center border border-brand-800 bg-brand-600 px-1 text-[10px] font-bold text-white">
                  {itemCount}
                </span>
              )}
            </Link>

            <button
              type="button"
              className="border-2 border-transparent p-2 text-ink-600 transition hover:border-ink-200 hover:bg-ink-50 lg:hidden"
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
        <MobileNav
          open={mobileOpen}
          onClose={closeMenu}
          onOpenSearch={() => {
            closeMenu();
            setSearchOpen(true);
          }}
        />
      ) : null}

      {searchOpen ? (
        <GlobalSearch open={searchOpen} onClose={() => setSearchOpen(false)} />
      ) : null}
    </>
  );
}
