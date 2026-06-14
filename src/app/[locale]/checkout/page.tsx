import { getTranslations } from "next-intl/server";
import { CheckoutForm } from "@/components/checkout/CheckoutForm";

export default async function CheckoutPage() {
  const t = await getTranslations("checkout");

  return (
    <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-ink-900">{t("title")}</h1>
        <p className="mt-2 text-lg text-ink-500">{t("subtitle")}</p>
      </div>
      <CheckoutForm />
    </div>
  );
}
