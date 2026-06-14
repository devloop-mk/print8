"use client";

import { useSearchParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/routing";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { CheckCircle } from "lucide-react";
import { Suspense } from "react";

function OrderSuccessContent() {
  const t = useTranslations("orderSuccess");
  const searchParams = useSearchParams();
  const orderNumber = searchParams.get("number");

  return (
    <Card className="mx-auto max-w-lg text-center">
      <CheckCircle className="mx-auto h-16 w-16 text-green-500" />
      <h1 className="mt-6 text-2xl font-bold text-ink-900">{t("title")}</h1>
      <p className="mt-2 text-ink-500">{t("subtitle")}</p>
      {orderNumber && (
        <p className="mt-4 text-lg">
          <span className="text-ink-500">{t("orderNumber")}: </span>
          <span className="font-mono font-bold text-brand-600">{orderNumber}</span>
        </p>
      )}
      <Link href="/" className="mt-8 inline-block">
        <Button size="lg">{t("backHome")}</Button>
      </Link>
    </Card>
  );
}

export function OrderSuccessPage() {
  return (
    <Suspense>
      <OrderSuccessContent />
    </Suspense>
  );
}
