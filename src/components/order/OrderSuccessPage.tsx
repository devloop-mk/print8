"use client";

import { useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { useCart } from "@/components/cart/CartProvider";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { CheckoutSteps } from "@/components/checkout/CheckoutSteps";
import { CheckCircle } from "lucide-react";

function OrderSuccessContent() {
  const t = useTranslations("orderSuccess");
  const searchParams = useSearchParams();
  const orderNumber = searchParams.get("number");
  const { clearCart } = useCart();

  useEffect(() => {
    if (!orderNumber) return;
    clearCart();
    sessionStorage.removeItem("print8-upload-token");
  }, [clearCart, orderNumber]);

  return (
    <>
      <CheckoutSteps current="success" />
      <Card className="mx-auto max-w-lg text-center">
        <CheckCircle className="mx-auto h-16 w-16 text-green-500" />
        <h1 className="mt-6 text-2xl font-bold text-ink-900">{t("title")}</h1>
        <p className="mt-2 text-ink-500">{t("subtitle")}</p>
        <p className="mt-3 text-sm text-ink-600">{t("confirmationEmail")}</p>
        {orderNumber && (
          <p className="mt-4 text-lg">
            <span className="text-ink-500">{t("orderNumber")}: </span>
            <span className="font-mono font-bold text-brand-600">
              {orderNumber}
            </span>
          </p>
        )}

        <div className="mt-6 rounded-lg border border-brand-100 bg-brand-50 p-4 text-left">
          <p className="text-sm font-semibold text-brand-900">{t("whatNext")}</p>
          <p className="mt-1 text-sm text-brand-800">{t("whatNextDesc")}</p>
        </div>

        <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:justify-center">
          <Link href="/products">
            <Button size="lg" className="w-full sm:w-auto">
              {t("continueShopping")}
            </Button>
          </Link>
          <Link href="/services">
            <Button size="lg" variant="outline" className="w-full sm:w-auto">
              {t("browseServices")}
            </Button>
          </Link>
        </div>

        <Link
          href="/"
          className="mt-4 inline-block text-sm font-medium text-ink-500 hover:text-brand-600"
        >
          {t("backHome")}
        </Link>
      </Card>
    </>
  );
}

export function OrderSuccessPage() {
  return (
    <Suspense>
      <OrderSuccessContent />
    </Suspense>
  );
}
