import type { Metadata } from "next";
import { OrderSuccessPage } from "@/components/order/OrderSuccessPage";
import { buildNoIndexMetadata } from "@/lib/seo/page-metadata";
import type { Locale } from "@/i18n/routing";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  return buildNoIndexMetadata(locale as Locale, "/order/success", "orderSuccess");
}

export default function Page() {
  return (
    <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
      <OrderSuccessPage />
    </div>
  );
}
