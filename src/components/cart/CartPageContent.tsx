"use client";

import { useTranslations, useLocale } from "next-intl";
import { Link } from "@/i18n/routing";
import { useCart } from "@/components/cart/CartProvider";
import { formatPrice } from "@/lib/utils";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Trash2 } from "lucide-react";

export function CartPageContent() {
  const t = useTranslations("cart");
  const locale = useLocale();
  const { items, removeItem, updateQuantity, total } = useCart();

  if (items.length === 0) {
    return (
      <div className="py-16 text-center">
        <p className="text-lg text-ink-500">{t("empty")}</p>
        <Link href="/services" className="mt-6 inline-block">
          <Button>{t("continueShopping")}</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="grid gap-8 lg:grid-cols-[1fr_360px]">
      <div className="space-y-4">
        {items.map((item) => (
          <Card key={item.id} className="flex gap-4">
            {item.designPreview && (
              <img
                src={item.designPreview}
                alt=""
                className="h-20 w-20 rounded-lg border border-ink-200 object-cover"
              />
            )}
            <div className="flex flex-1 flex-col">
              <div className="flex items-start justify-between">
                <div>
                  <span className="text-xs font-medium uppercase text-brand-600">
                    {t(`itemTypes.${item.type}`)}
                  </span>
                  <h3 className="font-semibold text-ink-900">{item.name}</h3>
                  <p className="text-sm text-ink-500">
                    {formatPrice(item.price, locale)} × {item.quantity}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => removeItem(item.id)}
                  className="rounded p-1 text-ink-400 hover:bg-ink-100 hover:text-red-600"
                  aria-label={t("remove")}
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
              <div className="mt-auto flex items-center gap-2 pt-2">
                <span className="text-sm text-ink-500">{t("quantity")}</span>
                <button
                  type="button"
                  onClick={() => updateQuantity(item.id, item.quantity - 1)}
                  className="rounded border border-ink-300 px-2 py-0.5 text-sm"
                  disabled={item.quantity <= 1}
                >
                  −
                </button>
                <span className="text-sm font-medium">{item.quantity}</span>
                <button
                  type="button"
                  onClick={() => updateQuantity(item.id, item.quantity + 1)}
                  className="rounded border border-ink-300 px-2 py-0.5 text-sm"
                >
                  +
                </button>
              </div>
            </div>
          </Card>
        ))}
      </div>

      <Card className="h-fit">
        <div className="flex justify-between text-sm">
          <span className="text-ink-500">{t("subtotal")}</span>
          <span className="font-medium">{formatPrice(total, locale)}</span>
        </div>
        <div className="mt-2 flex justify-between border-t border-ink-200 pt-2">
          <span className="font-semibold text-ink-900">{t("total")}</span>
          <span className="text-lg font-bold text-brand-600">
            {formatPrice(total, locale)}
          </span>
        </div>
        <p className="mt-2 text-xs text-ink-400">
          Payment on delivery
        </p>
        <Link href="/checkout" className="mt-6 block">
          <Button size="lg" className="w-full">
            {t("checkout")}
          </Button>
        </Link>
      </Card>
    </div>
  );
}
