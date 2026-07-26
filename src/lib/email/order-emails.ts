import type { CheckoutInput } from "@/lib/validations/order";
import { getUploadedFile } from "@/lib/upload";
import { getUploadObject } from "@/lib/storage/object-storage";
import { formatPrice } from "@/lib/utils";
import {
  collectOrderFileIds,
  collectOrderStickers,
} from "@/lib/orders/order-assets";
import { buildStickerAttachments } from "@/lib/email/sticker-attachments";
import {
  PRODUCT_SIDES,
  getSideMetadataPrefix,
} from "@/lib/products/product-sides";
import { parsePlacedStickers } from "@/lib/products/sticker-library";
import { parsePlacedTextLayers } from "@/lib/products/text-layers";
import { resolveSvgPrintFilesFromMetadata } from "@/lib/designs/svg-order-assets";
import {
  getOrderItemPreviewImages,
  sanitizeOrderItemFilename,
  type OrderItem,
} from "@/lib/orders/order-item-previews";
import { attachHostedPreviewUrls } from "@/lib/email/attach-hosted-preview-urls";
import type { OrderPreviewEmbed } from "@/lib/email/order-email-types";
import { getSiteUrl, localePath } from "@/lib/seo/site";
import {
  EMAIL_BRAND,
  escapeHtml,
  getBrevoClient,
  getEmailFromAddress,
  sendTransactionalEmail,
  type TransactionalEmailAttachment,
} from "@/lib/email/email-client";

interface EmailAttachment {
  filename: string;
  content: Buffer;
  contentType: string;
}

const BRAND = {
  primary: EMAIL_BRAND.primary,
  primaryDark: EMAIL_BRAND.primaryDark,
  ink: EMAIL_BRAND.ink,
  muted: EMAIL_BRAND.muted,
  border: EMAIL_BRAND.border,
  surface: EMAIL_BRAND.surface,
  white: EMAIL_BRAND.white,
} as const;

async function downloadStoredFile(storedName: string): Promise<Buffer | null> {
  try {
    const { body } = await getUploadObject(storedName);
    return body;
  } catch {
    return null;
  }
}

function parseDataUrl(dataUrl: string) {
  const match = dataUrl.match(/^data:([^;]+);base64,(.+)$/);
  if (!match) return null;
  const mimeType = match[1];
  const ext = mimeType.split("/")[1]?.replace("jpeg", "jpg") ?? "png";
  return {
    mimeType,
    buffer: Buffer.from(match[2], "base64"),
    ext,
  };
}

function mimeTypeFromFilename(filename: string, fallback: string) {
  const lower = filename.toLowerCase();
  if (lower.endsWith(".png")) return "image/png";
  if (lower.endsWith(".jpg") || lower.endsWith(".jpeg")) return "image/jpeg";
  if (lower.endsWith(".webp")) return "image/webp";
  if (lower.endsWith(".pdf")) return "application/pdf";
  return fallback;
}

function detailRow(label: string, valueHtml: string): string {
  return `<tr>
    <td style="padding:8px 0;border-bottom:1px solid ${BRAND.border};width:34%;vertical-align:top;font-size:13px;font-weight:600;color:${BRAND.muted};">${label}</td>
    <td style="padding:8px 0;border-bottom:1px solid ${BRAND.border};vertical-align:top;font-size:14px;color:${BRAND.ink};">${valueHtml}</td>
  </tr>`;
}

function detailTable(rows: string[]): string {
  if (rows.length === 0) return "";
  return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse;margin:0;">${rows.join("")}</table>`;
}

function buildProductDesignDetailsInnerHtml(item: OrderItem): string {
  const meta = item.metadata;
  if (!meta) return "";

  const rows: string[] = [];

  for (const side of PRODUCT_SIDES) {
    const prefix = getSideMetadataPrefix(side);
    const parts: string[] = [];

    const textLayers = parsePlacedTextLayers(meta[`${prefix}TextLayers`]);
    if (textLayers.length > 0) {
      const texts = textLayers
        .map((layer) => layer.text.trim())
        .filter(Boolean)
        .map((text) => `“${escapeHtml(text)}”`)
        .join(", ");
      if (texts) parts.push(`Text: ${texts}`);
    } else {
      const customText = meta[`${prefix}CustomText`];
      if (typeof customText === "string" && customText.trim()) {
        parts.push(`Text: “${escapeHtml(customText.trim())}”`);
      }
    }

    const stickers = parsePlacedStickers(meta[`${prefix}Stickers`]);
    if (stickers.length > 0) {
      parts.push(`Stickers: ${escapeHtml(stickers.map((s) => s.stickerId).join(", "))}`);
    }

    const uploadedFileId = meta[`${prefix}UploadedFileId`];
    if (typeof uploadedFileId === "string" && uploadedFileId) {
      parts.push("Photo: original upload attached");
    }

    const premade = meta[`${prefix}PremadeDesignImage`];
    if (typeof premade === "string" && premade) {
      parts.push("Premade design applied");
    }

    if (parts.length === 0) continue;

    const sideLabel = side.charAt(0).toUpperCase() + side.slice(1);
    rows.push(detailRow(sideLabel, parts.join("<br/>")));
  }

  if (typeof meta.size === "string" && meta.size) {
    rows.unshift(detailRow("Size", escapeHtml(meta.size)));
  }
  if (typeof meta.color === "string" && meta.color) {
    rows.unshift(detailRow("Color", escapeHtml(meta.color)));
  }
  if (typeof meta.printPackage === "string" && meta.printPackage) {
    rows.unshift(detailRow("Print package", escapeHtml(meta.printPackage)));
  }

  return detailTable(rows);
}

function buildCustomDesignDetailsInnerHtml(item: OrderItem): string {
  const meta = item.metadata;
  if (!meta) return "";

  if (meta.orderType === "svg-template") {
    const rows: string[] = [];
    if (typeof meta.svgTemplateId === "string") {
      rows.push(detailRow("Template", escapeHtml(meta.svgTemplateId)));
    }
    if (
      typeof meta.svgFrontContent === "string" ||
      typeof meta.svgFrontStoredName === "string"
    ) {
      rows.push(detailRow("Front", "Print-ready SVG attached"));
    }
    if (
      typeof meta.svgBackContent === "string" ||
      typeof meta.svgBackStoredName === "string"
    ) {
      rows.push(detailRow("Back", "Print-ready SVG attached"));
    }

    const textEntries = Object.entries(meta).filter(([key]) =>
      key.startsWith("text_"),
    );
    for (const [key, value] of textEntries) {
      const label = key.replace(/^text_/, "").replace(":", " · ");
      rows.push(detailRow(escapeHtml(label), escapeHtml(String(value))));
    }

    return detailTable(rows);
  }

  if (meta.orderType === "custom-design-request") {
    const rows: string[] = [];
    if (typeof meta.customDesignCategory === "string") {
      rows.push(
        detailRow("Design type", escapeHtml(String(meta.customDesignCategory))),
      );
    }
    if (typeof meta.targetProductLabel === "string") {
      rows.push(
        detailRow("Intended product", escapeHtml(meta.targetProductLabel)),
      );
    }
    if (typeof meta.designBrief === "string") {
      rows.push(detailRow("Design brief", escapeHtml(meta.designBrief)));
    }
    if (typeof meta.styleNotes === "string") {
      rows.push(detailRow("Style notes", escapeHtml(meta.styleNotes)));
    }
    return detailTable(rows);
  }

  if (meta.orderType === "customizable-template") {
    const fields = Object.entries(meta).filter(
      ([key]) =>
        ![
          "designTemplateId",
          "category",
          "orderType",
          "layoutId",
          "accentColor",
          "backgroundColor",
          "textColor",
          "secondaryColor",
        ].includes(key),
    );

    if (fields.length === 0) return "";

    return detailTable(
      fields.map(([key, value]) =>
        detailRow(escapeHtml(key), escapeHtml(String(value))),
      ),
    );
  }

  return "";
}

function buildOrderPreviewEmbeds(data: CheckoutInput): OrderPreviewEmbed[] {
  const embeds: OrderPreviewEmbed[] = [];

  data.items.forEach((item, itemIndex) => {
    const previews = getOrderItemPreviewImages(item);
    const safeName = sanitizeOrderItemFilename(item.name, `item-${itemIndex + 1}`);

    previews.forEach(({ src, label }) => {
      const slug = label.toLowerCase().replace(/\s+/g, "-");
      const filename = `item-${itemIndex + 1}-${safeName}-${slug}`;

      if (src.startsWith("data:")) {
        const parsed = parseDataUrl(src);
        if (!parsed) return;

        embeds.push({
          contentId: `preview-${itemIndex}-${slug}`,
          itemIndex,
          label,
          filename: `${filename}.${parsed.ext}`,
          content: parsed.buffer,
          contentType: parsed.mimeType,
          sourceSrc: src,
        });
        return;
      }

      if (src.startsWith("http") || src.startsWith("/")) {
        const ext = src.includes(".webp")
          ? "webp"
          : src.includes(".jpg") || src.includes(".jpeg")
            ? "jpg"
            : "png";
        embeds.push({
          contentId: `preview-${itemIndex}-${slug}`,
          itemIndex,
          label,
          filename: `${filename}.${ext}`,
          content: Buffer.alloc(0),
          contentType: mimeTypeFromFilename(`${filename}.${ext}`, "image/png"),
          sourceSrc: src,
        });
      }
    });
  });

  return embeds;
}

function buildOrderItemPreviewImagesHtml(
  item: OrderItem,
  itemIndex: number,
  embeds: OrderPreviewEmbed[],
): string {
  const itemEmbeds = embeds.filter((embed) => embed.itemIndex === itemIndex);
  if (itemEmbeds.length === 0) return "";

  const cells = itemEmbeds
    .map((embed) => {
      const src = embed.imageUrl;
      if (!src) return "";
      return `<td style="padding:0 12px 12px 0;vertical-align:top;">
          <p style="margin:0 0 8px;font-size:11px;font-weight:700;color:${BRAND.muted};text-transform:uppercase;letter-spacing:0.06em;">${escapeHtml(embed.label)}</p>
          <img src="${escapeHtml(src)}" alt="${escapeHtml(item.name)} ${escapeHtml(embed.label)}" width="240" style="width:240px;max-width:100%;height:auto;border:1px solid ${BRAND.border};display:block;background:${BRAND.white};" />
        </td>`;
    })
    .filter(Boolean)
    .join("");

  if (!cells) return "";

  return `<table role="presentation" cellpadding="0" cellspacing="0" style="border-collapse:collapse;margin-top:4px;"><tr>${cells}</tr></table>`;
}

function buildOrderItemEmailBlock(
  item: OrderItem,
  index: number,
  totalItems: number,
  locale: CheckoutInput["locale"],
  labels: { itemOf: string; designDetails: string },
  previewEmbeds: OrderPreviewEmbed[],
): string {
  const previewHtml = buildOrderItemPreviewImagesHtml(item, index, previewEmbeds);
  const productDetails = buildProductDesignDetailsInnerHtml(item);
  const customDetails = buildCustomDesignDetailsInnerHtml(item);
  const detailsHtml = [productDetails, customDetails].filter(Boolean).join("");
  const lineTotal = formatPrice(item.price * item.quantity, locale);

  const itemPosition =
    totalItems > 1
      ? `<p style="margin:0 0 10px;font-size:11px;font-weight:700;color:${BRAND.primary};text-transform:uppercase;letter-spacing:0.06em;">${labels.itemOf
          .replace("{current}", String(index + 1))
          .replace("{total}", String(totalItems))}</p>`
      : "";

  return `<tr>
    <td style="padding:0 0 16px;">
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse;border:1px solid ${BRAND.border};background:${BRAND.white};">
        <tr>
          <td style="padding:20px 20px 16px;border-bottom:1px solid ${BRAND.border};">
            ${itemPosition}
            <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse;">
              <tr>
                <td style="vertical-align:top;padding-right:12px;">
                  <p style="margin:0 0 4px;font-size:16px;font-weight:700;color:${BRAND.ink};line-height:1.35;">${escapeHtml(item.name)}</p>
                  <p style="margin:0;font-size:13px;color:${BRAND.muted};">Qty ${item.quantity} · ${formatPrice(item.price, locale)} each</p>
                </td>
                <td style="vertical-align:top;text-align:right;white-space:nowrap;">
                  <p style="margin:0;font-size:16px;font-weight:700;color:${BRAND.ink};">${lineTotal}</p>
                </td>
              </tr>
            </table>
          </td>
        </tr>
        ${
          previewHtml
            ? `<tr>
                <td style="padding:16px 20px;border-bottom:1px solid ${BRAND.border};background:${BRAND.surface};">
                  <p style="margin:0 0 10px;font-size:12px;font-weight:700;color:${BRAND.ink};">${labels.designDetails}</p>
                  ${previewHtml}
                </td>
              </tr>`
            : ""
        }
        ${
          detailsHtml
            ? `<tr>
                <td style="padding:16px 20px;">
                  ${detailsHtml}
                </td>
              </tr>`
            : ""
        }
      </table>
    </td>
  </tr>`;
}

function buildOrderItemsEmailHtml(
  data: CheckoutInput,
  labels: { itemOf: string; designDetails: string; itemsHeading: string },
  previewEmbeds: OrderPreviewEmbed[],
): string {
  const blocks = data.items.map((item, index) =>
    buildOrderItemEmailBlock(
      item,
      index,
      data.items.length,
      data.locale,
      labels,
      previewEmbeds,
    ),
  );

  return `<tr>
    <td style="padding:28px 32px 8px;">
      <p style="margin:0 0 16px;font-size:13px;font-weight:700;color:${BRAND.ink};text-transform:uppercase;letter-spacing:0.06em;">${labels.itemsHeading}</p>
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse;">
        ${blocks.join("")}
      </table>
    </td>
  </tr>`;
}

function buildEmailShell(options: {
  preheader: string;
  headerTitle: string;
  headerSubtitle?: string;
  bodyRowsHtml: string;
  footerNote: string;
}): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>${escapeHtml(options.headerTitle)}</title>
</head>
<body style="margin:0;padding:0;background:${BRAND.surface};font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;color:${BRAND.ink};">
  <div style="display:none;max-height:0;overflow:hidden;opacity:0;">${escapeHtml(options.preheader)}</div>
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse;background:${BRAND.surface};">
    <tr>
      <td align="center" style="padding:32px 16px;">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse;max-width:640px;background:${BRAND.white};border:1px solid ${BRAND.border};">
          <tr>
            <td style="padding:28px 32px;background:${BRAND.primaryDark};">
              <p style="margin:0 0 6px;font-size:12px;font-weight:700;letter-spacing:0.12em;text-transform:uppercase;color:#b9d5e9;">Print 8</p>
              <h1 style="margin:0;font-size:24px;line-height:1.25;font-weight:700;color:${BRAND.white};">${escapeHtml(options.headerTitle)}</h1>
              ${
                options.headerSubtitle
                  ? `<p style="margin:10px 0 0;font-size:14px;line-height:1.5;color:#dceaf4;">${escapeHtml(options.headerSubtitle)}</p>`
                  : ""
              }
            </td>
          </tr>
          ${options.bodyRowsHtml}
          <tr>
            <td style="padding:24px 32px;border-top:1px solid ${BRAND.border};background:${BRAND.surface};">
              <p style="margin:0;font-size:12px;line-height:1.6;color:${BRAND.muted};">${options.footerNote}</p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

function buildSummaryBanner(orderNumber: string, total: string, isMk: boolean): string {
  const orderLabel = isMk ? "Број на нарачка" : "Order number";
  const totalLabel = isMk ? "Вкупно" : "Total";

  return `<tr>
    <td style="padding:24px 32px 0;">
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse;background:${BRAND.surface};border:1px solid ${BRAND.border};">
        <tr>
          <td style="padding:16px 18px;width:50%;vertical-align:top;border-right:1px solid ${BRAND.border};">
            <p style="margin:0 0 4px;font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:0.06em;color:${BRAND.muted};">${orderLabel}</p>
            <p style="margin:0;font-size:18px;font-weight:700;color:${BRAND.ink};font-family:ui-monospace,SFMono-Regular,Menlo,Consolas,monospace;">${escapeHtml(orderNumber)}</p>
          </td>
          <td style="padding:16px 18px;width:50%;vertical-align:top;">
            <p style="margin:0 0 4px;font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:0.06em;color:${BRAND.muted};">${totalLabel}</p>
            <p style="margin:0;font-size:18px;font-weight:700;color:${BRAND.primary};">${total}</p>
          </td>
        </tr>
      </table>
    </td>
  </tr>`;
}

function buildCustomerMessage(isMk: boolean, isPickup = false): string {
  const title = isMk ? "Што следува?" : "What happens next?";
  const body = isPickup
    ? isMk
      ? "Плаќање при подигнување. Ќе ве контактираме наскоро за потврда кога нарачката е готова за подигнување во салон."
      : "Payment on pickup. We will contact you soon to confirm when your order is ready for store pickup."
    : isMk
      ? "Плаќање при достава. Ќе ве контактираме наскоро за потврда на нарачката и детали за достава."
      : "Payment on delivery. We will contact you soon to confirm the order and arrange delivery.";

  return `<tr>
    <td style="padding:20px 32px 8px;">
      <p style="margin:0 0 6px;font-size:14px;font-weight:700;color:${BRAND.ink};">${title}</p>
      <p style="margin:0;font-size:14px;line-height:1.6;color:${BRAND.muted};">${body}</p>
    </td>
  </tr>`;
}

function buildDeliverySection(data: CheckoutInput, isMk: boolean): string {
  const isPickup = data.fulfillmentMethod === "pickup";
  const heading = isPickup
    ? isMk
      ? "Подигнување"
      : "Pickup"
    : isMk
      ? "Податоци за достава"
      : "Delivery details";
  const methodLabel = isPickup
    ? isMk
      ? "Подигнување во салон (Штип)"
      : "Store pickup (Shtip)"
    : isMk
      ? "Испорака по карго"
      : "Cargo delivery";

  const rows = [
    detailRow(isMk ? "Име" : "Name", escapeHtml(data.fullName)),
    detailRow(isMk ? "Телефон" : "Phone", escapeHtml(data.phone)),
    detailRow(
      isMk ? "Е-пошта" : "Email",
      data.email ? escapeHtml(data.email) : "—",
    ),
    detailRow(isMk ? "Начин" : "Method", escapeHtml(methodLabel)),
    detailRow(
      isMk ? "Адреса" : "Address",
      isPickup
        ? escapeHtml(methodLabel)
        : `${escapeHtml(data.city)}<br/>${escapeHtml(data.address)}`,
    ),
  ];

  if (data.notes?.trim()) {
    rows.push(detailRow(isMk ? "Забелешки" : "Notes", escapeHtml(data.notes.trim())));
  }

  return `<tr>
    <td style="padding:20px 32px 8px;">
      <p style="margin:0 0 12px;font-size:13px;font-weight:700;color:${BRAND.ink};text-transform:uppercase;letter-spacing:0.06em;">${heading}</p>
      ${detailTable(rows)}
    </td>
  </tr>`;
}

function buildAdminMetaSection(
  data: CheckoutInput,
  attachmentSummary: string,
): string {
  const rows = [
    detailRow("Customer", escapeHtml(data.fullName)),
    detailRow("Phone", escapeHtml(data.phone)),
    detailRow("Email", data.email ? escapeHtml(data.email) : "—"),
    detailRow(
      "Address",
      `${escapeHtml(data.city)}<br/>${escapeHtml(data.address)}`,
    ),
  ];

  if (data.notes?.trim()) {
    rows.push(detailRow("Notes", escapeHtml(data.notes.trim())));
  }

  rows.push(detailRow("Attachments", escapeHtml(attachmentSummary)));

  return `<tr>
    <td style="padding:20px 32px 8px;">
      <p style="margin:0 0 12px;font-size:13px;font-weight:700;color:${BRAND.ink};text-transform:uppercase;letter-spacing:0.06em;">Order details</p>
      ${detailTable(rows)}
    </td>
  </tr>`;
}

function buildTotalRow(total: string, isMk: boolean): string {
  const label = isMk ? "Вкупно за плаќање" : "Amount due";
  return `<tr>
    <td style="padding:8px 32px 28px;">
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse;border-top:2px solid ${BRAND.ink};">
        <tr>
          <td style="padding:16px 0 0;font-size:14px;font-weight:700;color:${BRAND.ink};">${label}</td>
          <td style="padding:16px 0 0;text-align:right;font-size:20px;font-weight:700;color:${BRAND.primary};">${total}</td>
        </tr>
      </table>
    </td>
  </tr>`;
}

function buildDesignPreviewAttachments(embeds: OrderPreviewEmbed[]): EmailAttachment[] {
  return embeds
    .filter((embed) => embed.content.length > 0)
    .map(({ filename, content, contentType }) => ({
      filename,
      content,
      contentType,
    }));
}

function buildLoyaltySummaryHtml(
  loyalty: OrderEmailExtras["loyalty"],
  locale: CheckoutInput["locale"],
): string {
  if (!loyalty) return "";

  const isMk = locale === "mk";
  const accountUrl = `${getSiteUrl()}${localePath(locale, "/account")}`;

  const rows: string[] = [];

  if (loyalty.pointsEarnedThisOrder > 0) {
    rows.push(
      detailRow(
        isMk ? "Поени од нарачка" : "Points from this order",
        `<strong style="color:${BRAND.primary};">+${loyalty.pointsEarnedThisOrder}</strong> ${isMk ? "(на чекање до испорака)" : "(pending until delivery)"}`,
      ),
    );
  }

  rows.push(
    detailRow(
      isMk ? "Достапни поени" : "Ready to use",
      String(loyalty.pointsBalance),
    ),
  );

  if (loyalty.pointsPendingBalance > 0) {
    rows.push(
      detailRow(
        isMk ? "На чекање" : "Pending",
        String(loyalty.pointsPendingBalance),
      ),
    );
  }

  const ctaLabel = isMk ? "Моја сметка" : "My account";

  return `<tr>
    <td style="padding:20px 32px 8px;">
      <p style="margin:0 0 12px;font-size:13px;font-weight:700;color:${BRAND.ink};text-transform:uppercase;letter-spacing:0.06em;">${isMk ? "Поени за лојалност" : "Loyalty points"}</p>
      ${detailTable(rows)}
      <p style="margin:14px 0 0;">
        <a href="${escapeHtml(accountUrl)}" style="display:inline-block;background:${BRAND.primary};color:${BRAND.white};text-decoration:none;font-size:13px;font-weight:700;padding:10px 18px;border-radius:6px;">${ctaLabel}</a>
      </p>
    </td>
  </tr>`;
}

function toEmailAttachment(attachment: EmailAttachment): TransactionalEmailAttachment {
  return {
    filename: attachment.filename,
    content: attachment.content,
  };
}

async function buildSvgPrintAttachments(
  data: CheckoutInput,
): Promise<EmailAttachment[]> {
  const attachments: EmailAttachment[] = [];

  for (const [itemIndex, item] of data.items.entries()) {
    const printFiles = await resolveSvgPrintFilesFromMetadata(
      item.metadata,
      item.name,
    );
    for (const file of printFiles) {
      attachments.push({
        filename: `item-${itemIndex + 1}-${file.filename}`,
        content: Buffer.from(file.svg, "utf-8"),
        contentType: "image/svg+xml",
      });
    }
  }

  return attachments;
}

async function buildOriginalUploadAttachments(
  fileIds: string[],
): Promise<EmailAttachment[]> {
  const attachments: EmailAttachment[] = [];

  for (const fileId of fileIds) {
    const file = await getUploadedFile(fileId);
    if (!file) continue;

    const storedName = file.originalStoredName ?? file.storedName;
    const buffer = await downloadStoredFile(storedName);
    if (!buffer) continue;

    attachments.push({
      filename: file.originalName || `upload-${fileId}`,
      content: buffer,
      contentType: mimeTypeFromFilename(file.originalName, file.mimeType),
    });
  }

  return attachments;
}

export type OrderEmailExtras = {
  discountAmount?: number;
  subtotalAmount?: number;
  couponCode?: string | null;
  rewardCoupon?: { code: string; amount: number; endsAt: string | null } | null;
  loyalty?: {
    pointsEarnedThisOrder: number;
    pointsBalance: number;
    pointsPendingBalance: number;
  };
};

export async function sendOrderEmails(
  orderNumber: string,
  data: CheckoutInput,
  totalAmount: number,
  extras: OrderEmailExtras = {},
) {
  const brevo = getBrevoClient();
  const from = getEmailFromAddress();
  const adminEmail = process.env.ORDER_NOTIFICATION_EMAIL;

  if (!brevo) {
    console.warn("[email] BREVO_API_KEY not set — skipping order emails");
    return { sent: false as const, reason: "missing_api_key" };
  }

  const fileIds = collectOrderFileIds(data);
  const stickerRefs = collectOrderStickers(data.items);
  const rawPreviewEmbeds = buildOrderPreviewEmbeds(data);
  const previewEmbeds = await attachHostedPreviewUrls(orderNumber, rawPreviewEmbeds);
  const designAttachments = buildDesignPreviewAttachments(previewEmbeds);
  const svgPrintAttachments = await buildSvgPrintAttachments(data);
  const stickerAttachments = await buildStickerAttachments(stickerRefs);
  const originalAttachments = await buildOriginalUploadAttachments(fileIds);
  const total = formatPrice(totalAmount, data.locale);
  const isMk = data.locale === "mk";
  const itemLabels = isMk
    ? {
        itemsHeading: "Ваши производи",
        itemOf: "Артикл {current} од {total}",
        designDetails: "Преглед на дизајнот",
      }
    : {
        itemsHeading: "Your items",
        itemOf: "Item {current} of {total}",
        designDetails: "Design preview",
      };
  const itemsHtml = buildOrderItemsEmailHtml(data, itemLabels, previewEmbeds);
  const previewFileAttachments = buildDesignPreviewAttachments(previewEmbeds);

  const discountRows: string[] = [];
  if (extras.couponCode && extras.discountAmount && extras.discountAmount > 0) {
    const discountLabel = formatPrice(extras.discountAmount, data.locale);
    discountRows.push(
      detailTable([
        detailRow(
          isMk ? "Купон" : "Coupon",
          escapeHtml(extras.couponCode),
        ),
        detailRow(isMk ? "Попуст" : "Discount", `−${discountLabel}`),
      ]),
    );
  }
  if (extras.rewardCoupon) {
    const rewardAmount = formatPrice(extras.rewardCoupon.amount, data.locale);
    discountRows.push(
      detailTable([
        detailRow(
          isMk ? "Награда купон" : "Reward coupon",
          escapeHtml(extras.rewardCoupon.code),
        ),
        detailRow(isMk ? "Вредност" : "Value", rewardAmount),
        detailRow(
          isMk ? "Важно до" : "Valid until",
          extras.rewardCoupon.endsAt
            ? escapeHtml(extras.rewardCoupon.endsAt.slice(0, 10))
            : "—",
        ),
      ]),
    );
  }

  const customerHtml = buildEmailShell({
    preheader: isMk
      ? `Потврда за нарачка ${orderNumber}. Вкупно ${total}.`
      : `Order confirmation ${orderNumber}. Total ${total}.`,
    headerTitle: isMk ? "Ви благодариме за нарачката" : "Thank you for your order",
    headerSubtitle: isMk
      ? "Ја добивме вашата нарачка и ја подготвуваме."
      : "We received your order and are getting it ready.",
    bodyRowsHtml: [
      buildSummaryBanner(orderNumber, total, isMk),
      buildCustomerMessage(isMk, data.fulfillmentMethod === "pickup"),
      buildDeliverySection(data, isMk),
      buildLoyaltySummaryHtml(extras.loyalty, data.locale),
      itemsHtml,
      ...discountRows,
      buildTotalRow(total, isMk),
    ].join(""),
    footerNote: isMk
      ? "Print 8 · Оваа порака е автоматска потврда за вашата нарачка."
      : "Print 8 · This is an automated confirmation for your order.",
  });

  const results: { customer?: boolean; admin?: boolean } = {};

  if (data.email) {
    const result = await sendTransactionalEmail({
      from,
      to: data.email,
      subject: isMk
        ? `Потврда на нарачка ${orderNumber} — Print 8`
        : `Order confirmation ${orderNumber} — Print 8`,
      html: customerHtml,
    });
    results.customer = result.ok;
    if (!result.ok) {
      console.error("[email] customer confirmation failed:", result.error);
    }
  }

  if (adminEmail) {
    const adminAttachments = [
      ...previewFileAttachments.map(toEmailAttachment),
      ...svgPrintAttachments.map(toEmailAttachment),
      ...stickerAttachments.map(toEmailAttachment),
      ...originalAttachments.map((a) =>
        toEmailAttachment({ ...a, filename: `original-${a.filename}` }),
      ),
    ];

    const attachmentSummary = `${adminAttachments.length} file(s): ${designAttachments.length} preview(s), ${svgPrintAttachments.length} print SVG(s), ${stickerAttachments.length} sticker(s), ${originalAttachments.length} original upload(s)`;

    const adminHtml = buildEmailShell({
      preheader: `New order ${orderNumber} from ${data.fullName} — ${total}`,
      headerTitle: `New order ${orderNumber}`,
      headerSubtitle: "Review the customer details, items, and attachments below.",
      bodyRowsHtml: [
        buildSummaryBanner(orderNumber, total, false),
        buildAdminMetaSection(data, attachmentSummary),
        buildOrderItemsEmailHtml(
          data,
          {
            itemsHeading: "Items",
            itemOf: "Item {current} of {total}",
            designDetails: "Design preview",
          },
          previewEmbeds,
        ),
        buildTotalRow(total, false),
      ].join(""),
      footerNote:
        "Print 8 admin notification · Open the attachments for print-ready files and originals.",
    });

    const result = await sendTransactionalEmail({
      from,
      to: adminEmail,
      subject: `New order ${orderNumber} — Print 8`,
      html: adminHtml,
      attachments:
        adminAttachments.length > 0 ? adminAttachments : undefined,
    });
    results.admin = result.ok;
    if (!result.ok) {
      console.error("[email] admin notification failed:", result.error);
    }
  } else {
    console.warn("[email] ORDER_NOTIFICATION_EMAIL not set — admin email skipped");
  }

  return { sent: true as const, results };
}
