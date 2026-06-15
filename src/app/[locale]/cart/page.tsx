import { getTranslations } from "next-intl/server";
import type { Metadata } from "next";
import { CartPageContent } from "@/components/cart/CartPageContent";
import { buildNoIndexMetadata } from "@/lib/seo/page-metadata";
import type { Locale } from "@/i18n/routing";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  return buildNoIndexMetadata(locale as Locale, "/cart", "cart");
}

export default async function CartPage() {
  const t = await getTranslations("cart");

  return (
    <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
      <h1 className="mb-8 text-3xl font-bold text-ink-900">{t("title")}</h1>
      <CartPageContent />
    </div>
  );
}
