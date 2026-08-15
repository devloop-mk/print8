"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { useTranslations, useLocale } from "next-intl";
import { useRouter, Link } from "@/i18n/navigation";
import { useCart } from "@/components/cart/CartProvider";
import { useUploadSessionGate } from "@/hooks/useUploadSessionGate";
import { SecureUpload } from "@/components/upload/SecureUpload";
import { TurnstileWidget } from "@/components/security/TurnstileWidget";
import { isTurnstileActiveOnClient } from "@/lib/security/turnstile-public";
import { formatPrice } from "@/lib/utils";
import {
  MAX_PHOTOS_PER_ORDER,
  MAX_STICKERS_PER_ORDER,
  validateOrderAssetLimits,
} from "@/lib/orders/order-assets";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { CheckoutSteps } from "@/components/checkout/CheckoutSteps";
import {
  mapCheckoutApiFieldErrors,
  validateCheckoutFields,
  isCheckoutEmailValid,
} from "@/lib/validations/checkout-form";
import {
  CheckoutPrepareError,
  prepareCheckoutPayload,
} from "@/lib/orders/prepare-checkout-payload";
import { cartHasInlinePrintPngs } from "@/lib/cart/print-png-cart";
import { SPIN_PENDING_COUPON_KEY } from "@/lib/rewards/spin-config";
import { PointsRedemption } from "@/components/checkout/PointsRedemption";
import { PointsEarnPreview } from "@/components/checkout/PointsEarnPreview";
import { CheckoutAccountPrompt } from "@/components/checkout/CheckoutAccountPrompt";
import { useOptionalAuth } from "@/components/auth/AuthProvider";
import type { CheckoutInput } from "@/lib/validations/order";
import type { Locale } from "@/i18n/routing";
import { buildLocalizedAccountPath } from "@/lib/auth/oauth";

export function CheckoutForm() {
  const t = useTranslations("checkout");
  const locale = useLocale();
  const router = useRouter();
  const { items, total, hydrated } = useCart();
  const auth = useOptionalAuth();
  const {
    token,
    loading: uploadLoading,
    error: uploadSessionError,
    pendingTurnstile,
    setTurnstileToken,
    refreshSession,
  } = useUploadSessionGate();
  const [checkoutTurnstileToken, setCheckoutTurnstileToken] = useState("");
  const checkoutTurnstileRequired = isTurnstileActiveOnClient();

  const [form, setForm] = useState({
    fullName: "",
    phone: "",
    email: "",
    fulfillmentMethod: "cargo" as "cargo" | "pickup",
    city: "",
    address: "",
    notes: "",
  });
  const [fileIds, setFileIds] = useState<string[]>([]);
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [newsletterOptIn, setNewsletterOptIn] = useState(false);
  const [couponCode, setCouponCode] = useState("");
  const [couponDiscount, setCouponDiscount] = useState(0);
  const [couponMessage, setCouponMessage] = useState<string | null>(null);
  const [couponChecking, setCouponChecking] = useState(false);
  const [pointsToRedeem, setPointsToRedeem] = useState(0);
  const [pointsDiscount, setPointsDiscount] = useState(0);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [processing, setProcessing] = useState(false);
  const [redirecting, setRedirecting] = useState(false);
  const pendingCouponAutoApply = useRef(false);
  const pendingCouponEmail = useRef<string | undefined>(undefined);

  const payableTotal = Math.max(0, total - couponDiscount - pointsDiscount);
  const isLoggedIn = Boolean(auth?.customer);
  const showReturningCustomerSignIn =
    !isLoggedIn && isCheckoutEmailValid(form.email.trim());

  const handlePointsChange = useCallback(
    (value: {
      pointsToRedeem: number;
      pointsDiscount: number;
      payableTotal: number;
    }) => {
      setPointsToRedeem(value.pointsToRedeem);
      setPointsDiscount(value.pointsDiscount);
    },
    [],
  );

  useEffect(() => {
    if (!auth?.customer) return;
    setForm((prev) => ({
      ...prev,
      fullName: prev.fullName || auth.customer?.fullName || prev.fullName,
      phone: prev.phone || auth.customer?.phone || prev.phone,
      email: prev.email || auth.customer?.email || prev.email,
      city: prev.city || auth.customer?.defaultCity || prev.city,
      address: prev.address || auth.customer?.defaultAddress || prev.address,
    }));
  }, [auth?.customer]);

  function storeCheckoutPrefill() {
    try {
      sessionStorage.setItem(
        "print8-checkout-prefill",
        JSON.stringify({
          fullName: form.fullName,
          phone: form.phone,
          email: form.email,
        }),
      );
    } catch {
      // ignore quota errors
    }
  }

  function goToLoginFromCheckout() {
    storeCheckoutPrefill();
    const params = new URLSearchParams({
      redirect: "/checkout",
      email: form.email.trim(),
    });
    router.push(`/account/login?${params.toString()}`);
  }

  function goToGoogleFromCheckout() {
    storeCheckoutPrefill();
    const nextPath = buildLocalizedAccountPath(locale as Locale, "/checkout");
    const params = new URLSearchParams({ next: nextPath });
    window.location.assign(`/api/auth/oauth/google?${params.toString()}`);
  }

  useEffect(() => {
    try {
      const raw = sessionStorage.getItem("print8-checkout-prefill");
      if (raw) {
        sessionStorage.removeItem("print8-checkout-prefill");
        const parsed = JSON.parse(raw) as {
          fullName?: string;
          phone?: string;
          email?: string;
        };
        setForm((prev) => ({
          ...prev,
          fullName:
            typeof parsed.fullName === "string" && parsed.fullName
              ? parsed.fullName
              : prev.fullName,
          phone:
            typeof parsed.phone === "string" && parsed.phone
              ? parsed.phone
              : prev.phone,
          email:
            typeof parsed.email === "string" && parsed.email
              ? parsed.email
              : prev.email,
        }));
      }
    } catch {
      // ignore corrupt prefill
    }

    try {
      const raw = sessionStorage.getItem(SPIN_PENDING_COUPON_KEY);
      if (!raw) return;
      sessionStorage.removeItem(SPIN_PENDING_COUPON_KEY);
      const parsed = JSON.parse(raw) as { code?: string; email?: string };
      const code =
        typeof parsed.code === "string" ? parsed.code.trim().toUpperCase() : "";
      if (!code) return;
      setCouponCode(code);
      if (typeof parsed.email === "string" && parsed.email.trim()) {
        const spinEmail = parsed.email.trim().toLowerCase();
        pendingCouponEmail.current = spinEmail;
        setForm((prev) => ({
          ...prev,
          email: prev.email || spinEmail,
        }));
      }
      pendingCouponAutoApply.current = true;
    } catch {
      // ignore corrupt pending coupon
    }
  }, []);

  async function applyCoupon(codeOverride?: string, emailOverride?: string) {
    const code = (codeOverride ?? couponCode).trim();
    if (!code) return;
    setCouponChecking(true);
    setCouponMessage(null);
    setErrors((prev) => ({ ...prev, form: "" }));
    try {
      const res = await fetch("/api/coupons/validate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          code,
          subtotalAmount: total,
          email:
            (emailOverride ?? pendingCouponEmail.current ?? form.email).trim() ||
            undefined,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data.ok) {
        setCouponDiscount(0);
        setCouponMessage(
          data.code === "min_order"
            ? t("couponMinOrder", {
                amount: formatPrice(Number(data.minOrderAmount ?? 0), locale),
              })
            : t("couponInvalid"),
        );
        return;
      }
      setCouponCode(String(data.code ?? code).toUpperCase());
      setCouponDiscount(Number(data.discountAmount ?? 0));
      setCouponMessage(
        t("couponApplied", {
          amount: formatPrice(Number(data.discountAmount ?? 0), locale),
        }),
      );
    } catch {
      setCouponDiscount(0);
      setCouponMessage(t("couponInvalid"));
    } finally {
      setCouponChecking(false);
    }
  }

  useEffect(() => {
    if (!pendingCouponAutoApply.current || !hydrated) return;
    if (!couponCode.trim() || total <= 0) return;
    pendingCouponAutoApply.current = false;
    void applyCoupon(couponCode, pendingCouponEmail.current);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- one-shot after spin "use now"
  }, [hydrated, couponCode, total]);

  const hasServiceItems = items.some((item) => item.type === "service");
  const hasCustomProductItems = items.some((item) => item.type === "product");

  function updateField(field: string, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }));
    setErrors((prev) => ({ ...prev, [field]: "" }));
  }

  function getValidationMessages() {
    return {
      required: t("required"),
      fullNameTooShort: t("fullNameTooShort"),
      invalidPhone: t("invalidPhone"),
      invalidEmail: t("invalidEmail"),
      cityTooShort: t("cityTooShort"),
      addressTooShort: t("addressTooShort"),
    };
  }

  function validate() {
    const newErrors = validateCheckoutFields(form, getValidationMessages());
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

  async function resolveUploadTokenForCheckout(): Promise<string | null> {
    const needsSession =
      cartHasInlinePrintPngs(items) ||
      fileIds.length > 0 ||
      items.some((item) => (item.fileIds?.length ?? 0) > 0);

    if (!needsSession) return token;

    let activeToken = token;
    if (!activeToken) {
      return refreshSession();
    }

    try {
      const res = await fetch("/api/upload/session/validate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token: activeToken }),
      });
      const data = (await res.json()) as { valid?: boolean };
      if (data.valid) return activeToken;
    } catch {
      // fall through to refresh or keep token for server-side error
    }

    const hasCommittedUploads =
      fileIds.length > 0 ||
      items.some((item) => (item.fileIds?.length ?? 0) > 0);
    if (hasCommittedUploads) return activeToken;

    return refreshSession();
  }

  function mapPrepareError(code: string): string {
    switch (code) {
      case "print_upload_requires_session":
      case "invalid_upload_token":
        return t("uploadSessionError");
      case "print_file_too_large":
        return t("printFileTooLarge");
      case "print_upload_failed":
        return t("printUploadFailed");
      case "invalid_order_data":
        return t("invalidOrderData");
      default:
        return t("submitError");
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!validate() || items.length === 0) return;

    if (checkoutTurnstileRequired && !checkoutTurnstileToken) {
      setErrors({ form: t("turnstileRequired") });
      return;
    }

    setProcessing(true);
    try {
      const uploadToken = await resolveUploadTokenForCheckout();
      if (
        cartHasInlinePrintPngs(items) &&
        !uploadToken
      ) {
        setErrors({ form: t("uploadSessionError") });
        setProcessing(false);
        return;
      }

      const payload = await prepareCheckoutPayload({
        ...form,
        locale: locale as CheckoutInput["locale"],
        items,
        fileIds,
        uploadToken,
        newsletterOptIn,
        couponCode: couponCode.trim() || null,
        pointsToRedeem,
      });

      const res = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...payload,
          turnstileToken: checkoutTurnstileToken || undefined,
        }),
      });

      type OrderApiResponse = {
        code?: string;
        details?: { fieldErrors?: Record<string, string[] | undefined> };
        orderNumber?: string;
      };

      let data: OrderApiResponse = {};
      try {
        data = await res.json();
      } catch {
        // non-JSON response (e.g. proxy 413)
      }

      if (!res.ok) {
        if (res.status === 413 || data.code === "payload_too_large") {
          setErrors({ form: t("payloadTooLarge") });
          setProcessing(false);
          return;
        }
        if (data.code === "turnstile_failed") {
          setCheckoutTurnstileToken("");
          setErrors({ form: t("turnstileFailed") });
          setProcessing(false);
          return;
        }
        if (data.code === "too_many_stickers") {
          setErrors({
            form: t("orderStickerLimit", { max: MAX_STICKERS_PER_ORDER }),
          });
          setProcessing(false);
          return;
        }
        if (data.code === "too_many_photos") {
          setErrors({
            form: t("orderPhotoLimit", { max: MAX_PHOTOS_PER_ORDER }),
          });
          setProcessing(false);
          return;
        }
        if (data.code === "design_unavailable") {
          setErrors({ form: t("designUnavailable") });
          setProcessing(false);
          return;
        }
        if (data.code === "invalid_order_data") {
          setErrors({ form: t("invalidOrderData") });
          setProcessing(false);
          return;
        }
        if (typeof data.code === "string" && data.code.startsWith("coupon_")) {
          setErrors({ form: t("couponInvalid") });
          setCouponDiscount(0);
          setCouponMessage(null);
          setProcessing(false);
          return;
        }
        if (typeof data.code === "string" && data.code.startsWith("points_")) {
          setErrors({ form: t("pointsInvalid") });
          setPointsToRedeem(0);
          setPointsDiscount(0);
          setProcessing(false);
          return;
        }
        if (data.code === "points_redeem_failed") {
          setErrors({ form: t("pointsInvalid") });
          setProcessing(false);
          return;
        }
        if (
          data.code === "invalid_price" ||
          data.code === "upload_token_required" ||
          data.code === "invalid_upload_token" ||
          data.code === "invalid_file_reference"
        ) {
          setErrors({
            form:
              data.code === "upload_token_required" ||
              data.code === "invalid_upload_token" ||
              data.code === "invalid_file_reference"
                ? t("uploadSessionError")
                : t("submitError"),
          });
          setProcessing(false);
          return;
        }
        if (data.code === "order_print_storage_failed") {
          setErrors({ form: t("printUploadFailed") });
          setProcessing(false);
          return;
        }
        const fieldErrors = mapCheckoutApiFieldErrors(
          data.details,
          form,
          getValidationMessages(),
        );
        if (Object.keys(fieldErrors).length > 0) {
          setErrors(fieldErrors);
          setProcessing(false);
          return;
        }
        setErrors({ form: t("submitError") });
        setProcessing(false);
        return;
      }

      setRedirecting(true);
      sessionStorage.removeItem("print8-upload-token");
      if (auth?.refresh) {
        await auth.refresh();
      }
      router.push(`/order/success?number=${data.orderNumber}`);
    } catch (err) {
      if (err instanceof CheckoutPrepareError) {
        setErrors({ form: mapPrepareError(err.code) });
      } else {
        setErrors({ form: t("submitError") });
      }
      setProcessing(false);
    }
  }

  if (!hydrated || redirecting) {
    return (
      <div className="py-16 text-center">
        <CheckoutSteps current="checkout" />
        <p className="text-ink-500">{t("processing")}</p>
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="py-16 text-center">
        <p className="text-ink-500">{t("emptyCart")}</p>
        <Link href="/products" className="mt-6 inline-block">
          <Button>{t("browseProducts")}</Button>
        </Link>
      </div>
    );
  }

  return (
    <>
      <CheckoutSteps current="checkout" />
      <form onSubmit={handleSubmit} className="grid gap-8 lg:grid-cols-[1fr_360px]">
      <div className="space-y-6">
        <CheckoutAccountPrompt />
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
              hint={!showReturningCustomerSignIn ? t("emailHint") : undefined}
            />
            {showReturningCustomerSignIn ? (
              <div
                className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2.5 text-sm text-amber-900 sm:col-span-2"
              >
                <p>{t("emailReturningCustomer")}</p>
                <div className="mt-1 flex flex-wrap gap-x-4 gap-y-1">
                  <button
                    type="button"
                    onClick={goToGoogleFromCheckout}
                    className="font-semibold text-brand-700 hover:text-brand-800 hover:underline"
                  >
                    {t("emailAccountExistsGoogle")}
                  </button>
                  <button
                    type="button"
                    onClick={goToLoginFromCheckout}
                    className="font-semibold text-brand-700 hover:text-brand-800 hover:underline"
                  >
                    {t("emailAccountExistsLogin")}
                  </button>
                </div>
              </div>
            ) : null}
          </div>
        </Card>

        <Card>
          <h2 className="mb-4 text-lg font-semibold text-ink-900">
            {t("fulfillmentTitle")}
          </h2>
          <div className="grid gap-3 sm:grid-cols-2">
            {(
              [
                {
                  id: "cargo" as const,
                  title: t("fulfillmentCargo"),
                  desc: t("fulfillmentCargoDesc"),
                },
                {
                  id: "pickup" as const,
                  title: t("fulfillmentPickup"),
                  desc: t("fulfillmentPickupDesc"),
                },
              ] as const
            ).map((option) => {
              const selected = form.fulfillmentMethod === option.id;
              return (
                <button
                  key={option.id}
                  type="button"
                  onClick={() => {
                    setForm((prev) => ({
                      ...prev,
                      fulfillmentMethod: option.id,
                    }));
                    setErrors((prev) => ({
                      ...prev,
                      city: "",
                      address: "",
                    }));
                  }}
                  className={
                    selected
                      ? "rounded-xl border-2 border-brand-500 bg-brand-50 p-4 text-left"
                      : "rounded-xl border border-ink-200 bg-white p-4 text-left hover:border-brand-200"
                  }
                >
                  <p className="font-semibold text-ink-900">{option.title}</p>
                  <p className="mt-1 text-sm text-ink-600">{option.desc}</p>
                </button>
              );
            })}
          </div>

          {form.fulfillmentMethod === "cargo" ? (
            <div className="mt-4 grid gap-4 sm:grid-cols-2">
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
            </div>
          ) : (
            <p className="mt-4 rounded-lg border border-ink-100 bg-ink-50 px-3 py-2 text-sm text-ink-700">
              {t("fulfillmentPickupHint")}
            </p>
          )}

          <div className="mt-4">
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
        </Card>

        <Card>
          <h2 className="mb-4 text-lg font-semibold text-ink-900">
            {t("uploadFiles")}
          </h2>
          {(hasServiceItems || hasCustomProductItems) && (
            <p className="mb-4 rounded-lg border border-brand-100 bg-brand-50 px-3 py-2 text-sm text-brand-800">
              {hasServiceItems ? t("uploadRecommended") : t("uploadOptional")}
            </p>
          )}
          <p className="mb-4 text-sm text-ink-500">{t("uploadHint")}</p>
          {pendingTurnstile ? (
            <TurnstileWidget
              onToken={setTurnstileToken}
              className="mb-3"
            />
          ) : null}
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
              {t("filesAttached", { count: fileIds.length })}
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
            <p className="font-medium text-brand-800">
              {form.fulfillmentMethod === "pickup" ? t("codPickup") : t("cod")}
            </p>
            <p className="mt-1 text-sm text-brand-600">
              {form.fulfillmentMethod === "pickup"
                ? t("codPickupDesc")
                : t("codDesc")}
            </p>
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
          <div className="mt-4 space-y-2 border-t border-ink-200 pt-4">
            <label className="block text-sm font-medium text-ink-700">
              {t("couponCode")}
            </label>
            <div className="flex gap-2">
              <input
                value={couponCode}
                onChange={(e) => {
                  setCouponCode(e.target.value.toUpperCase());
                  setCouponDiscount(0);
                  setCouponMessage(null);
                }}
                placeholder={t("couponPlaceholder")}
                maxLength={40}
                className="min-w-0 flex-1 rounded-lg border border-ink-300 px-3 py-2 text-sm uppercase tracking-wide"
              />
              <Button
                type="button"
                variant="outline"
                loading={couponChecking}
                disabled={couponChecking || !couponCode.trim()}
                onClick={() => void applyCoupon()}
              >
                {t("couponApply")}
              </Button>
            </div>
            {couponMessage ? (
              <p
                className={`text-xs ${
                  couponDiscount > 0 ? "text-emerald-700" : "text-red-600"
                }`}
              >
                {couponMessage}
              </p>
            ) : null}
          </div>

          <div className="mt-4">
            <PointsRedemption
              subtotal={total}
              couponDiscount={couponDiscount}
              onChange={handlePointsChange}
            />
            <PointsEarnPreview payableTotal={payableTotal} />
          </div>

          {couponDiscount > 0 ? (
            <div className="mt-3 flex justify-between text-sm text-ink-600">
              <span>{t("discount")}</span>
              <span>−{formatPrice(couponDiscount, locale)}</span>
            </div>
          ) : null}

          {pointsDiscount > 0 ? (
            <div className="mt-3 flex justify-between text-sm text-ink-600">
              <span>{t("pointsDiscount")}</span>
              <span>−{formatPrice(pointsDiscount, locale)}</span>
            </div>
          ) : null}

          <div className="mt-3 flex justify-between border-t border-ink-200 pt-3">
            <span className="font-semibold">{t("total")}</span>
            <span className="text-lg font-bold text-brand-600">
              {formatPrice(payableTotal, locale)}
            </span>
          </div>

          <Link
            href="/cart"
            className="mt-4 inline-block text-sm font-medium text-brand-600 hover:text-brand-700"
          >
            ← {t("backToCart")}
          </Link>

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

          <label className="mt-3 flex items-start gap-3 text-sm text-ink-600">
            <input
              type="checkbox"
              checked={newsletterOptIn}
              onChange={(e) => setNewsletterOptIn(e.target.checked)}
              className="mt-1 h-4 w-4 rounded border-ink-300 text-brand-600 focus:ring-brand-500"
            />
            <span>{t("newsletterOptIn")}</span>
          </label>

          {errors.form ? (
            <p className="mt-2 text-sm text-red-600">{errors.form}</p>
          ) : null}

          {checkoutTurnstileRequired ? (
            <TurnstileWidget
              onToken={setCheckoutTurnstileToken}
              className="mt-4"
            />
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
    </>
  );
}

function Field({
  label,
  value,
  onChange,
  onBlur,
  error,
  required,
  type = "text",
  className = "",
  hint,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  onBlur?: () => void;
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
        onBlur={onBlur}
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
