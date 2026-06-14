"use client";

import { useTranslations } from "next-intl";
import { useCart } from "@/components/cart/CartProvider";
import { Button } from "@/components/ui/Button";
import type { ServiceId } from "@/lib/data/catalog";

interface ServiceOrderButtonProps {
  serviceId: ServiceId;
  name: string;
  price: number;
}

export function ServiceOrderButton({
  serviceId,
  name,
  price,
}: ServiceOrderButtonProps) {
  const t = useTranslations("services");
  const { addItem } = useCart();

  function handleOrder() {
    addItem({
      type: "service",
      name,
      price,
      quantity: 1,
      metadata: { serviceId },
    });
  }

  return (
    <Button size="sm" onClick={handleOrder}>
      {t("orderService")}
    </Button>
  );
}
