import { getTranslations } from "next-intl/server";
import { ProductsCatalog } from "@/components/products/ProductsCatalog";

export default async function ProductsPage() {
  const t = await getTranslations("products");

  return (
    <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
      <div className="mb-12">
        <h1 className="text-3xl font-bold text-ink-900">{t("title")}</h1>
        <p className="mt-2 text-lg text-ink-500">{t("subtitle")}</p>
      </div>
      <ProductsCatalog />
    </div>
  );
}
