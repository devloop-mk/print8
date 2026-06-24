"use client";



import { useState } from "react";

import { useTranslations, useLocale } from "next-intl";

import { Link } from "@/i18n/routing";

import { useCart } from "@/components/cart/CartProvider";

import { formatPrice, cn } from "@/lib/utils";
import {
  MAX_PHOTOS_PER_ORDER,
  MAX_STICKERS_PER_ORDER,
  validateOrderAssetLimits,
} from "@/lib/orders/order-assets";

import { Button } from "@/components/ui/Button";

import { Card } from "@/components/ui/Card";

import { ImageLightbox } from "@/components/ui/ImageLightbox";

import { Trash2, Pencil } from "lucide-react";

import {

  buildCustomizerEditUrl,

  formatProductCartName,

  getCartItemColor,

  getCartItemPreviewImages,

  getCartItemProduct,

  getCartItemSize,

  isCustomizedCartItem,

} from "@/lib/cart/product-cart";



export function CartPageContent() {

  const t = useTranslations("cart");

  const tc = useTranslations("products.customizer");

  const tp = useTranslations("products.types");

  const locale = useLocale();

  const { items, removeItem, updateQuantity, updateItem, total } = useCart();

  const assetLimits = validateOrderAssetLimits({
    items: items.map(
      ({ type, name, price, quantity, metadata, fileIds }) => ({
        type,
        name,
        price,
        quantity,
        metadata,
        fileIds,
      }),
    ),
    fileIds: [],
  });

  const cartLimitMessage = !assetLimits.ok
    ? assetLimits.error === "too_many_stickers"
      ? t("orderStickerLimit", { max: MAX_STICKERS_PER_ORDER })
      : t("orderPhotoLimit", { max: MAX_PHOTOS_PER_ORDER })
    : null;

  const [lightbox, setLightbox] = useState<{

    images: { src: string; label?: string }[];

    index: number;

  } | null>(null);



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



  function handleSizeChange(
    itemId: string,
    newSize: string,
    productType: string,
    product: ReturnType<typeof getCartItemProduct>,
  ) {
    const item = items.find((i) => i.id === itemId);
    if (!item) return;
    const typeLabel = tp(productType as "t-shirt" | "mug" | "cup" | "bag" | "gift-set");
    updateItem(itemId, {
      name: formatProductCartName(typeLabel, newSize, product),
      metadata: {
        ...item.metadata,
        size: newSize,
      },
    });
  }



  return (

    <>

      <div className="grid gap-8 lg:grid-cols-[1fr_360px]">

        <div className="space-y-4">

          {items.map((item) => {

            const previewImages = getCartItemPreviewImages(item, {
              front: tc('front'),
              back: tc('back'),
              left: tc('left'),
              right: tc('right'),
            });

            const product = getCartItemProduct(item);

            const color = getCartItemColor(item);

            const size = getCartItemSize(item);

            const editUrl = buildCustomizerEditUrl(item);

            const customized = isCustomizedCartItem(item);
            const multiSidePreviews = previewImages.length > 2;

            return (

              <Card
                key={item.id}
                className={cn(
                  "flex gap-4",
                  multiSidePreviews
                    ? "flex-col sm:flex-row sm:items-start"
                    : "flex-row",
                )}
              >

                {previewImages.length > 0 && (

                  <div
                    className={cn(
                      multiSidePreviews
                        ? "grid w-full max-w-xs grid-cols-2 items-start gap-1.5 sm:max-w-none sm:flex sm:shrink-0 sm:gap-1"
                        : "flex shrink-0 gap-1",
                    )}
                  >

                    {previewImages.map((img, index) => (

                      <button

                        key={`${item.id}-${index}`}

                        type="button"

                        onClick={() =>

                          setLightbox({ images: previewImages, index })

                        }

                        className={cn(
                          "group relative flex items-center justify-center overflow-hidden rounded-lg border border-ink-200 bg-ink-50 transition hover:border-brand-400 hover:ring-2 hover:ring-brand-200",
                          multiSidePreviews
                            ? "aspect-square w-full sm:h-20 sm:w-20"
                            : "h-20 w-20 shrink-0",
                        )}

                        aria-label={t("zoomPreview")}

                      >

                        <img

                          src={img.src}

                          alt={img.label ?? ""}

                          className="max-h-full max-w-full object-contain transition group-hover:scale-105"

                        />

                        {img.label && previewImages.length > 1 && (

                          <span className="absolute bottom-0 left-0 right-0 bg-black/50 px-1 py-0.5 text-center text-[9px] font-medium text-white">

                            {img.label}

                          </span>

                        )}

                      </button>

                    ))}

                  </div>

                )}

                <div className="flex min-w-0 flex-1 flex-col">

                  <div className="flex items-start justify-between gap-2">

                    <div className="min-w-0">

                      <span className="text-xs font-medium uppercase text-brand-600">

                        {t(`itemTypes.${item.type}`)}

                      </span>

                      <h3 className="font-semibold text-ink-900">{item.name}</h3>

                      <div className="mt-1 flex flex-wrap items-center gap-3 text-sm text-ink-500">

                        {color && (

                          <span className="inline-flex items-center gap-1.5">

                            {t("color")}

                            <span

                              className="inline-block h-4 w-4 rounded-full border border-ink-200"

                              style={{ backgroundColor: color }}

                              title={color}

                            />

                          </span>

                        )}

                        {product?.sizes?.length && size && (

                          <span>

                            {t("size")}: {size}

                          </span>

                        )}

                      </div>

                      <p className="mt-1 text-sm text-ink-500">

                        {formatPrice(item.price, locale)} × {item.quantity}

                      </p>

                    </div>

                    <button

                      type="button"

                      onClick={() => removeItem(item.id)}

                      className="shrink-0 rounded p-1 text-ink-400 hover:bg-ink-100 hover:text-red-600"

                      aria-label={t("remove")}

                    >

                      <Trash2 className="h-4 w-4" />

                    </button>

                  </div>



                  <div className="mt-2 flex flex-wrap items-center gap-2">

                    {product?.sizes?.length && (

                      <select

                        value={size ?? product.sizes[0]}

                        onChange={(e) =>

                          handleSizeChange(

                            item.id,

                            e.target.value,

                            product.type,

                            product,

                          )

                        }

                        className="rounded-lg border border-ink-300 bg-white px-2 py-1 text-sm text-ink-700"

                        aria-label={t("changeSize")}

                      >

                        {product.sizes.map((s) => (

                          <option key={s} value={s}>

                            {s}

                          </option>

                        ))}

                      </select>

                    )}

                    {customized && editUrl && (

                      <Link href={editUrl}>

                        <Button size="sm" variant="outline" className="gap-1.5">

                          <Pencil className="h-3.5 w-3.5" />

                          {t("editDesign")}

                        </Button>

                      </Link>

                    )}

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

            );

          })}

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

          <p className="mt-2 text-xs text-ink-400">Payment on delivery</p>

          {cartLimitMessage ? (
            <p className="mt-4 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-800">
              {cartLimitMessage}
            </p>
          ) : null}

          {cartLimitMessage ? (
            <Button size="lg" className="mt-6 w-full" disabled>
              {t("checkout")}
            </Button>
          ) : (
            <Link href="/checkout" className="mt-6 block">
              <Button size="lg" className="w-full">
                {t("checkout")}
              </Button>
            </Link>
          )}

        </Card>

      </div>



      {lightbox && (

        <ImageLightbox

          images={lightbox.images}

          initialIndex={lightbox.index}

          onClose={() => setLightbox(null)}

        />

      )}

    </>

  );

}

