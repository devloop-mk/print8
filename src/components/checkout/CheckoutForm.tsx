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
import { SPIN_PENDING_COUPON_KEY } from "@/lib/rewards/spin-config";
import { PointsRedemption } from "@/components/checkout/PointsRedemption";
import { PointsEarnPreview } from "@/components/checkout/PointsEarnPreview";
import { CheckoutAccountPrompt } from "@/components/checkout/CheckoutAccountPrompt";
import { useOptionalAuth } from "@/components/auth/AuthProvider";
import type { CheckoutInput } from "@/lib/validations/order";
import type { Locale } from "@/i18n/routing";
import { buildLocalizedAccountPath } from "@/lib/auth/oauth";
import {
  MAX_FILE_SIZE,
  MAX_PRINT_FILE_SIZE,
} from "@/lib/upload/constants";
import { formatBytes } from "@/lib/students/student-print-config";
import {
  getCartItemDisplayName,
  getCartItemProduct,
} from "@/lib/cart/product-cart";
import {
  compactHolidayDiscountLine,
  holidayLineDiscountPercent,
  holidayLineMatchesBoost,
  type HolidayCouponApplication,
} from "@/lib/holiday/holiday-discount";
import { isHolidayProductKind } from "@/lib/holiday/workshop-config";
import type { ScratchCouponApplication } from "@/lib/scratch/scratch-config";
import {
  FREE_DELIVERY_THRESHOLD_MKD,
  getOrderDeliveryFeeMkd,
} from "@/lib/orders/delivery-pricing";
import { Check } from "lucide-react";

function parseHolidayCouponPayload(value: unknown): HolidayCouponApplication | null {
  if (!value || typeof value !== "object") return null;
  const row = value as Record<string, unknown>;
  const prizeKind = row.prizeKind;
  if (
    prizeKind !== "percent" &&
    prizeKind !== "delivery" &&
    prizeKind !== "design" &&
    prizeKind !== "mystery"
  ) {
    return null;
  }
  const percent =
    typeof row.percent === "number" && Number.isFinite(row.percent)
      ? row.percent
      : null;
  const boostPercent =
    typeof row.boostPercent === "number" && Number.isFinite(row.boostPercent)
      ? row.boostPercent
      : null;
  const boostKind =
    typeof row.boostKind === "string" && isHolidayProductKind(row.boostKind)
      ? row.boostKind
      : null;
  const matchingSubtotal =
    typeof row.matchingSubtotal === "number" &&
    Number.isFinite(row.matchingSubtotal)
      ? row.matchingSubtotal
      : 0;
  return {
    prizeKind,
    percent,
    boostPercent,
    boostKind,
    matchingSubtotal,
  };
}

function parseScratchCouponPayload(value: unknown): ScratchCouponApplication | null {
  if (!value || typeof value !== "object") return null;
  const row = value as Record<string, unknown>;
  const prizeKind = row.prizeKind;
  if (
    prizeKind !== "percent" &&
    prizeKind !== "delivery" &&
    prizeKind !== "product"
  ) {
    return null;
  }
  const productKind =
    row.productKind === "mug" || row.productKind === "tshirt"
      ? row.productKind
      : null;
  return {
    prizeKey: null,
    prizeKind,
    percent:
      typeof row.percent === "number" && Number.isFinite(row.percent)
        ? row.percent
        : null,
    productKind,
    matchingSubtotal:
      typeof row.matchingSubtotal === "number" &&
      Number.isFinite(row.matchingSubtotal)
        ? row.matchingSubtotal
        : 0,
  };
}

export function CheckoutForm() {
  const t = useTranslations("checkout");
  const tp = useTranslations("products.types");
  const ti = useTranslations("products.items");
  const th = useTranslations("holidayWorkshop");
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
  const [couponHoliday, setCouponHoliday] =
    useState<HolidayCouponApplication | null>(null);
  const [couponScratch, setCouponScratch] =
    useState<ScratchCouponApplication | null>(null);
  const [couponCapped, setCouponCapped] = useState(false);
  const [couponChecking, setCouponChecking] = useState(false);
  const [pointsToRedeem, setPointsToRedeem] = useState(0);
  const [pointsDiscount, setPointsDiscount] = useState(0);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [processing, setProcessing] = useState(false);
  const [redirecting, setRedirecting] = useState(false);
  const pendingCouponAutoApply = useRef(false);
  const pendingCouponEmail = useRef<string | undefined>(undefined);
  const [registeredEmailCheck, setRegisteredEmailCheck] = useState<{
    registered: boolean;
    google: boolean;
    email: boolean;
  }>({ registered: false, google: false, email: false });

  const payableMerchandise = Math.max(0, total - couponDiscount - pointsDiscount);
  const cargoFee = getOrderDeliveryFeeMkd({
    fulfillmentMethod: "cargo",
    merchandiseSubtotalMkd: total,
  });
  const shippingAmount =
    form.fulfillmentMethod === "pickup" ? 0 : cargoFee;
  const payableTotal = payableMerchandise + shippingAmount;
  const isLoggedIn = Boolean(auth?.customer);
  const showReturningCustomerSignIn =
    !isLoggedIn && registeredEmailCheck.registered;

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

  useEffect(() => {
    if (isLoggedIn) {
      setRegisteredEmailCheck({
        registered: false,
        google: false,
        email: false,
      });
      return;
    }

    const email = form.email.trim();
    if (!isCheckoutEmailValid(email)) {
      setRegisteredEmailCheck({
        registered: false,
        google: false,
        email: false,
      });
      return;
    }

    const timer = window.setTimeout(async () => {
      try {
        const response = await fetch('/api/checkout/check-email', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email }),
        });
        const data = (await response.json()) as {
          registered?: boolean;
          google?: boolean;
          email?: boolean;
        };

        if (!response.ok || !data.registered) {
          setRegisteredEmailCheck({
            registered: false,
            google: false,
            email: false,
          });
          return;
        }

        setRegisteredEmailCheck({
          registered: true,
          google: Boolean(data.google),
          email: Boolean(data.email),
        });
      } catch {
        setRegisteredEmailCheck({
          registered: false,
          google: false,
          email: false,
        });
      }
    }, 400);

    return () => window.clearTimeout(timer);
  }, [form.email, isLoggedIn]);

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
          items: items.map((item) => compactHolidayDiscountLine(item)),
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data.ok) {
        setCouponDiscount(0);
        setCouponHoliday(null);
        setCouponScratch(null);
        setCouponCapped(false);
        setCouponMessage(
          data.code === "min_order"
            ? t("couponMinOrder", {
                amount: formatPrice(Number(data.minOrderAmount ?? 0), locale),
              })
            : t("couponInvalid"),
        );
        return;
      }
      const holiday = parseHolidayCouponPayload(data.holiday);
      const scratch = parseScratchCouponPayload(data.scratch);
      setCouponCode(String(data.code ?? code).toUpperCase());
      setCouponDiscount(Number(data.discountAmount ?? 0));
      setCouponHoliday(holiday);
      setCouponScratch(scratch);
      setCouponCapped(Boolean(data.capped));
      setCouponMessage(null);
    } catch {
      setCouponDiscount(0);
      setCouponHoliday(null);
      setCouponScratch(null);
      setCouponCapped(false);
      setCouponMessage(t("couponInvalid"));
    } finally {
      setCouponChecking(false);
    }
  }

  const couponCartKey = items
    .map(
      (item) =>
        `${item.id}:${item.quantity}:${item.price}:${String(item.metadata?.productId ?? item.metadata?.serviceId ?? "")}`,
    )
    .join("|");

  useEffect(() => {
    if (!pendingCouponAutoApply.current || !hydrated) return;
    if (!couponCode.trim() || total <= 0) return;
    pendingCouponAutoApply.current = false;
    void applyCoupon(couponCode, pendingCouponEmail.current);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- one-shot after spin "use now"
  }, [hydrated, couponCode, total]);

  useEffect(() => {
    if (!hydrated || !couponCode.trim() || total <= 0) return;
    if (couponDiscount <= 0 && couponScratch?.prizeKind !== "product") return;
    void applyCoupon(couponCode);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- recompute holiday / scratch when cart lines change
  }, [hydrated, total, couponCartKey]);

  const hasServiceItems = items.some((item) => item.type === "service");
  const hasCustomProductItems = items.some((item) => item.type === "product");
  const referenceUploadMaxLabel = formatBytes(MAX_FILE_SIZE);
  const printUploadMaxLabel = formatBytes(MAX_PRINT_FILE_SIZE);

  function updateField(field: string, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }));
    setErrors((prev) => ({ ...prev, [field]: "" }));
  }

  function lineName(item: (typeof items)[number]) {
    const product = getCartItemProduct(item);
    return getCartItemDisplayName(
      item,
      product,
      product ? tp(product.type) : "",
      ti,
    );
  }

  const couponBoostProductLabel = couponHoliday?.boostKind
    ? th(`products.${couponHoliday.boostKind}`)
    : "";
  const couponBoostActive =
    Boolean(
      couponHoliday?.percent &&
        couponHoliday.boostKind &&
        couponHoliday.matchingSubtotal > 0,
    );
  const couponBoostAllItems =
    couponBoostActive && couponHoliday
      ? couponHoliday.matchingSubtotal + 1e-9 >= total
      : false;
  const scratchGiveawayKind =
    couponScratch?.prizeKind === "product" ? couponScratch.productKind : null;
  const scratchGiveawayActive = Boolean(
    scratchGiveawayKind && couponScratch && couponScratch.matchingSubtotal > 0,
  );
  const scratchGiveawayWaiting = Boolean(
    scratchGiveawayKind && couponScratch && couponScratch.matchingSubtotal <= 0,
  );
  const couponAppliedOk = couponDiscount > 0 || scratchGiveawayWaiting;
  const couponRateLabel = scratchGiveawayKind
    ? t(
        scratchGiveawayKind === "tshirt"
          ? "couponGiveawayTshirt"
          : "couponGiveawayMug",
      )
    : couponDiscount > 0 && couponHoliday?.percent
      ? couponBoostAllItems && couponHoliday.boostPercent
        ? t("discountPercentBoostAll", {
            boost: couponHoliday.boostPercent,
            product: couponBoostProductLabel,
          })
        : couponBoostActive && couponHoliday.boostPercent
          ? t("discountPercentBoost", {
              percent: couponHoliday.percent,
              boost: couponHoliday.boostPercent,
              product: couponBoostProductLabel,
            })
          : t("discountPercent", { percent: couponHoliday.percent })
      : t("discount");
  const couponRateDetail = scratchGiveawayActive
    ? t(
        scratchGiveawayKind === "tshirt"
          ? "couponGiveawayAppliedTshirt"
          : "couponGiveawayAppliedMug",
      )
    : scratchGiveawayWaiting
      ? t(
          scratchGiveawayKind === "tshirt"
            ? "couponGiveawayHintTshirt"
            : "couponGiveawayHintMug",
        )
      : couponDiscount > 0 && couponHoliday?.percent
        ? couponBoostAllItems && couponHoliday.boostPercent
          ? t("couponAppliedPercentBoostAll", {
              boost: couponHoliday.boostPercent,
              product: couponBoostProductLabel,
            })
          : couponBoostActive && couponHoliday.boostPercent
            ? t("couponAppliedPercentBoost", {
                percent: couponHoliday.percent,
                boost: couponHoliday.boostPercent,
                product: couponBoostProductLabel,
              })
            : t("couponAppliedPercent", { percent: couponHoliday.percent })
        : couponDiscount > 0
          ? t("couponApplied")
          : null;

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

      const payload = await prepareCheckoutPayload({
        ...form,
        locale: locale as CheckoutInput["locale"],
        items: items.map((item) => ({ ...item, name: lineName(item) })),
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
          setCouponHoliday(null);
          setCouponScratch(null);
          setCouponCapped(false);
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
                <p>
                  {registeredEmailCheck.google && !registeredEmailCheck.email
                    ? t("emailAccountExistsGoogleOnly")
                    : t("emailReturningCustomer")}
                </p>
                <div className="mt-1 flex flex-wrap gap-x-4 gap-y-1">
                  {registeredEmailCheck.google ? (
                    <button
                      type="button"
                      onClick={goToGoogleFromCheckout}
                      className="font-semibold text-brand-700 hover:text-brand-800 hover:underline"
                    >
                      {t("emailAccountExistsGoogle")}
                    </button>
                  ) : null}
                  {registeredEmailCheck.email ? (
                    <button
                      type="button"
                      onClick={goToLoginFromCheckout}
                      className="font-semibold text-brand-700 hover:text-brand-800 hover:underline"
                    >
                      {t("emailAccountExistsLogin")}
                    </button>
                  ) : null}
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
                  <p
                    className={
                      option.id === "cargo" && cargoFee === 0
                        ? "mt-2 text-sm font-semibold text-emerald-700"
                        : "mt-2 text-sm font-semibold text-ink-800"
                    }
                  >
                    {option.id === "pickup"
                      ? t("deliveryFree")
                      : cargoFee === 0
                        ? t("deliveryFreeThisOrder")
                        : t("deliveryFeeThisOrder", {
                            fee: formatPrice(cargoFee, locale),
                          })}
                  </p>
                  {option.id === "cargo" ? (
                    <p className="mt-0.5 text-xs text-ink-500">
                      {t("freeFromThreshold", {
                        threshold: formatPrice(
                          FREE_DELIVERY_THRESHOLD_MKD,
                          locale,
                        ),
                      })}
                    </p>
                  ) : null}
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
          <p className="mb-4 text-sm text-ink-500">
            {t("uploadHint", { max: referenceUploadMaxLabel })}
          </p>
          {hasCustomProductItems ? (
            <p className="mb-4 text-sm text-ink-500">
              {t("uploadHintPrintNote", { max: printUploadMaxLabel })}
            </p>
          ) : null}
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
            {items.map((item) => {
              const linePercent =
                couponDiscount > 0
                  ? holidayLineDiscountPercent(item, couponHoliday)
                  : null;
              const giftLine = Boolean(
                scratchGiveawayKind &&
                  holidayLineMatchesBoost(item, scratchGiveawayKind),
              );
              return (
                <div key={item.id} className="flex justify-between gap-3 text-sm">
                  <span className="flex min-w-0 items-center gap-2 text-ink-600">
                    <span className="truncate">
                      {lineName(item)} × {item.quantity}
                    </span>
                    {giftLine ? (
                      <span className="shrink-0 rounded-full bg-emerald-100 px-1.5 py-0.5 text-[10px] font-semibold tracking-wide text-emerald-800">
                        {t("couponGiftBadge")}
                      </span>
                    ) : linePercent != null ? (
                      <span className="shrink-0 rounded-full bg-emerald-100 px-1.5 py-0.5 text-[10px] font-semibold tracking-wide text-emerald-800">
                        −{linePercent}%
                      </span>
                    ) : null}
                  </span>
                  <span className="shrink-0">
                    {formatPrice(item.price * item.quantity, locale)}
                  </span>
                </div>
              );
            })}
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
                  setCouponHoliday(null);
                  setCouponScratch(null);
                  setCouponCapped(false);
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
            {couponAppliedOk ? (
              <div className="rounded-lg border border-emerald-200 bg-emerald-50/90 px-3 py-2.5">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="flex items-center gap-1.5 text-sm font-semibold text-emerald-900">
                      <Check className="h-4 w-4 shrink-0" aria-hidden />
                      <span className="truncate font-mono tracking-wide">
                        {couponCode}
                      </span>
                      <span className="font-sans text-xs font-medium uppercase tracking-wide text-emerald-700">
                        {t("couponAppliedBadge")}
                      </span>
                    </p>
                    {couponRateDetail ? (
                      <p className="mt-1 text-xs leading-relaxed text-emerald-800">
                        {couponRateDetail}
                      </p>
                    ) : null}
                    {couponHoliday?.percent &&
                    couponHoliday.boostKind &&
                    couponHoliday.boostPercent &&
                    !couponBoostActive ? (
                      <p className="mt-1 text-xs leading-relaxed text-emerald-800">
                        {t("couponBoostHint", {
                          product: couponBoostProductLabel,
                          boost: couponHoliday.boostPercent,
                        })}
                      </p>
                    ) : null}
                    {couponCapped ? (
                      <p className="mt-1 text-xs text-emerald-700">
                        {t("couponCapped")}
                      </p>
                    ) : null}
                  </div>
                  {couponDiscount > 0 ? (
                    <p className="shrink-0 text-sm font-semibold text-emerald-800">
                      −{formatPrice(couponDiscount, locale)}
                    </p>
                  ) : null}
                </div>
              </div>
            ) : couponMessage ? (
              <p className="text-xs text-red-600">{couponMessage}</p>
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
            <div className="mt-3 flex justify-between gap-3 text-sm">
              <span className="min-w-0 text-ink-600">
                <span className="block">{couponRateLabel}</span>
                <span className="block font-mono text-xs tracking-wide text-ink-400">
                  {couponCode}
                </span>
              </span>
              <span className="shrink-0 font-medium text-emerald-700">
                −{formatPrice(couponDiscount, locale)}
              </span>
            </div>
          ) : null}

          {pointsDiscount > 0 ? (
            <div className="mt-3 flex justify-between text-sm text-ink-600">
              <span>{t("pointsDiscount")}</span>
              <span>−{formatPrice(pointsDiscount, locale)}</span>
            </div>
          ) : null}

          <div className="mt-3 flex justify-between text-sm">
            <span className="text-ink-600">{t("delivery")}</span>
            <span
              className={
                shippingAmount === 0
                  ? "font-semibold text-emerald-700"
                  : "font-medium text-ink-800"
              }
            >
              {shippingAmount === 0
                ? t("deliveryFree")
                : formatPrice(shippingAmount, locale)}
            </span>
          </div>

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
