"use client";

import { useTranslations } from "next-intl";
import { useRouter } from "@/i18n/navigation";
import { useCart } from "@/components/cart/CartProvider";
import { Button } from "@/components/ui/Button";
import type { ServiceId } from "@/lib/data/catalog";

interface ServiceOrderButtonProps {
  serviceId: ServiceId;
  name: string;
  price: number;
  className?: string;
}

export function ServiceOrderButton({
  serviceId,
  name,
  price,
  className,
}: ServiceOrderButtonProps) {
  const t = useTranslations("services");
  const { addItem } = useCart();
  const router = useRouter();

  function handleOrder() {
    addItem({
      type: "service",
      name,
      price,
      quantity: 1,
      metadata: { serviceId },
    });
    router.push("/cart");
  }

  return (
    <Button size="sm" onClick={handleOrder} className={className}>
      {t("orderService")}
    </Button>
  );
}
