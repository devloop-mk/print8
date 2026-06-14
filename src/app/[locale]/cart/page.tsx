import { getTranslations } from "next-intl/server";
import { CartPageContent } from "@/components/cart/CartPageContent";

export default async function CartPage() {
  const t = await getTranslations("cart");

  return (
    <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
      <h1 className="mb-8 text-3xl font-bold text-ink-900">{t("title")}</h1>
      <CartPageContent />
    </div>
  );
}
