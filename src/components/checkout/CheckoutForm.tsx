"use client";

import { useState } from "react";
import { useTranslations, useLocale } from "next-intl";
import { useRouter, Link } from "@/i18n/routing";
import { useCart } from "@/components/cart/CartProvider";
import { useUploadSession } from "@/hooks/useUploadSession";
import { SecureUpload } from "@/components/upload/SecureUpload";
import { formatPrice } from "@/lib/utils";
import {
  MAX_PHOTOS_PER_ORDER,
  MAX_STICKERS_PER_ORDER,
  validateOrderAssetLimits,
} from "@/lib/orders/order-assets";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";

export function CheckoutForm() {
  const t = useTranslations("checkout");
  const locale = useLocale();
  const router = useRouter();
  const { items, total, clearCart } = useCart();
  const { token, loading: uploadLoading, error: uploadSessionError, refreshSession } = useUploadSession();

  const [form, setForm] = useState({
    fullName: "",
    phone: "",
    email: "",
    city: "",
    address: "",
    notes: "",
  });
  const [fileIds, setFileIds] = useState<string[]>([]);
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [processing, setProcessing] = useState(false);

  function updateField(field: string, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }));
    setErrors((prev) => ({ ...prev, [field]: "" }));
  }

  function validate() {
    const newErrors: Record<string, string> = {};
    if (!form.fullName.trim()) newErrors.fullName = t("required");
    if (!form.phone.trim() || form.phone.length < 8)
      newErrors.phone = t("invalidPhone");
    if (!form.city.trim()) newErrors.city = t("required");
    if (!form.address.trim()) newErrors.address = t("required");
    if (!form.email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) {
      newErrors.email = t("invalidEmail");
    }
    if (!termsAccepted) {
      newErrors.terms = t("acceptTermsRequired");
    }

    const assetLimits = validateOrderAssetLimits({
      items: items.map(
        ({
          type,
          name,
          price,
          quantity,
          metadata,
          designPreview,
          backDesignPreview,
          leftDesignPreview,
          rightDesignPreview,
          fileIds: itemFileIds,
        }) => ({
          type,
          name,
          price,
          quantity,
          metadata,
          designPreview,
          backDesignPreview,
          leftDesignPreview,
          rightDesignPreview,
          fileIds: itemFileIds,
        }),
      ),
      fileIds,
    });

    if (!assetLimits.ok) {
      newErrors.form =
        assetLimits.error === "too_many_stickers"
          ? t("orderStickerLimit", { max: MAX_STICKERS_PER_ORDER })
          : t("orderPhotoLimit", { max: MAX_PHOTOS_PER_ORDER });
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!validate() || items.length === 0) return;

    setProcessing(true);
    try {
      const res = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          locale,
          items: items.map(
            ({
              type,
              name,
              price,
              quantity,
              metadata,
              designPreview,
              backDesignPreview,
              leftDesignPreview,
              rightDesignPreview,
              fileIds: itemFileIds,
            }) => ({
              type,
              name,
              price,
              quantity,
              metadata,
              designPreview,
              backDesignPreview,
              leftDesignPreview,
              rightDesignPreview,
              fileIds: itemFileIds,
            }),
          ),
          fileIds,
          uploadToken: token,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        if (data.code === "too_many_stickers") {
          setErrors({
            form: t("orderStickerLimit", { max: MAX_STICKERS_PER_ORDER }),
          });
          return;
        }
        if (data.code === "too_many_photos") {
          setErrors({
            form: t("orderPhotoLimit", { max: MAX_PHOTOS_PER_ORDER }),
          });
          return;
        }
        throw new Error(data.error);
      }

      clearCart();
      sessionStorage.removeItem("print8-upload-token");
      router.push(`/order/success?number=${data.orderNumber}`);
    } catch {
      setErrors({ form: "error" });
    } finally {
      setProcessing(false);
    }
  }

  if (items.length === 0) {
    return (
      <p className="py-16 text-center text-ink-500">Cart is empty</p>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="grid gap-8 lg:grid-cols-[1fr_360px]">
      <div className="space-y-6">
        <Card>
          <h2 className="mb-4 text-lg font-semibold text-ink-900">
            {t("customerInfo")}
          </h2>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field
              label={t("fullName")}
              value={form.fullName}
              onChange={(v) => updateField("fullName", v)}
              error={errors.fullName}
              required
            />
            <Field
              label={t("phone")}
              value={form.phone}
              onChange={(v) => updateField("phone", v)}
              error={errors.phone}
              required
            />
            <Field
              label={t("email")}
              value={form.email}
              onChange={(v) => updateField("email", v)}
              type="email"
              error={errors.email}
              required
              className="sm:col-span-2"
              hint={t("emailHint")}
            />
            <Field
              label={t("city")}
              value={form.city}
              onChange={(v) => updateField("city", v)}
              error={errors.city}
              required
            />
            <Field
              label={t("address")}
              value={form.address}
              onChange={(v) => updateField("address", v)}
              error={errors.address}
              required
            />
            <div className="sm:col-span-2">
              <label className="mb-1 block text-sm font-medium text-ink-700">
                {t("notes")}
              </label>
              <textarea
                value={form.notes}
                onChange={(e) => updateField("notes", e.target.value)}
                placeholder={t("notesPlaceholder")}
                rows={3}
                className="w-full rounded-lg border border-ink-300 px-3 py-2 text-sm"
              />
            </div>
          </div>
        </Card>

        <Card>
          <h2 className="mb-4 text-lg font-semibold text-ink-900">
            {t("uploadFiles")}
          </h2>
          <p className="mb-4 text-sm text-ink-500">{t("uploadHint")}</p>
          <SecureUpload
            token={token}
            loading={uploadLoading}
            sessionError={uploadSessionError}
            onRefreshSession={refreshSession}
            onUpload={(fileId) =>
              setFileIds((prev) => [...prev, fileId])
            }
          />
          {fileIds.length > 0 && (
            <p className="mt-2 text-sm text-green-600">
              {fileIds.length} file(s) attached
            </p>
          )}
        </Card>
      </div>

      <div className="space-y-4">
        <Card>
          <h2 className="mb-4 text-lg font-semibold text-ink-900">
            {t("paymentMethod")}
          </h2>
          <div className="rounded-lg border-2 border-brand-200 bg-brand-50 p-4">
            <p className="font-medium text-brand-800">{t("cod")}</p>
            <p className="mt-1 text-sm text-brand-600">{t("codDesc")}</p>
          </div>
        </Card>

        <Card>
          <div className="space-y-2">
            {items.map((item) => (
              <div key={item.id} className="flex justify-between text-sm">
                <span className="text-ink-600">
                  {item.name} × {item.quantity}
                </span>
                <span>{formatPrice(item.price * item.quantity, locale)}</span>
              </div>
            ))}
          </div>
          <div className="mt-4 flex justify-between border-t border-ink-200 pt-4">
            <span className="font-semibold">Total</span>
            <span className="text-lg font-bold text-brand-600">
              {formatPrice(total, locale)}
            </span>
          </div>

          <label className="mt-4 flex items-start gap-3 text-sm text-ink-600">
            <input
              type="checkbox"
              checked={termsAccepted}
              onChange={(e) => {
                setTermsAccepted(e.target.checked);
                setErrors((prev) => ({ ...prev, terms: "" }));
              }}
              className="mt-1 h-4 w-4 rounded border-ink-300 text-brand-600 focus:ring-brand-500"
            />
            <span>
              {t("acceptTermsBeforeTerms")}{" "}
              <Link href="/terms" className="font-medium text-brand-600 hover:text-brand-700">
                {t("termsLink")}
              </Link>{" "}
              {t("acceptTermsBeforePrivacy")}{" "}
              <Link href="/privacy" className="font-medium text-brand-600 hover:text-brand-700">
                {t("privacyLink")}
              </Link>
              .
            </span>
          </label>
          {errors.terms ? (
            <p className="mt-2 text-xs text-red-600">{errors.terms}</p>
          ) : null}

          {errors.form ? (
            <p className="mt-2 text-sm text-red-600">{errors.form}</p>
          ) : null}

          <Button
            type="submit"
            size="lg"
            className="mt-6 w-full"
            loading={processing}
            disabled={processing}
          >
            {processing ? t("processing") : t("placeOrder")}
          </Button>
        </Card>
      </div>
    </form>
  );
}

function Field({
  label,
  value,
  onChange,
  error,
  required,
  type = "text",
  className = "",
  hint,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  error?: string;
  required?: boolean;
  type?: string;
  className?: string;
  hint?: string;
}) {
  return (
    <div className={className}>
      <label className="mb-1 block text-sm font-medium text-ink-700">
        {label}
        {required && <span className="text-red-500"> *</span>}
      </label>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        required={required}
        className={`w-full rounded-lg border px-3 py-2 text-sm ${
          error ? "border-red-400" : "border-ink-300"
        }`}
      />
      {hint && !error && (
        <p className="mt-1 text-xs text-ink-500">{hint}</p>
      )}
      {error && <p className="mt-1 text-xs text-red-600">{error}</p>}
    </div>
  );
}
