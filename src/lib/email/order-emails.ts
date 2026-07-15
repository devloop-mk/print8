import { Resend } from "resend";
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
import { getSvgPrintFilesFromMetadata } from "@/lib/designs/svg-order-assets";
import {
  getOrderItemPreviewImages,
  sanitizeOrderItemFilename,
  type OrderItem,
} from "@/lib/orders/order-item-previews";

interface EmailAttachment {
  filename: string;
  content: Buffer;
  contentType: string;
}

type OrderPreviewEmbed = EmailAttachment & {
  contentId: string;
  itemIndex: number;
  label: string;
};

const BRAND = {
  primary: "#2f7cb2",
  primaryDark: "#225376",
  ink: "#0f172a",
  muted: "#64748b",
  border: "#e2e8f0",
  surface: "#f8fafc",
  white: "#ffffff",
} as const;

async function downloadStoredFile(storedName: string): Promise<Buffer | null> {
  try {
    const { body } = await getUploadObject(storedName);
    return body;
  } catch {
    return null;
  }
}

function getResend() {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) return null;
  return new Resend(apiKey);
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

function escapeHtml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
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
    if (typeof meta.svgFrontContent === "string") {
      rows.push(detailRow("Front", "Print-ready SVG attached"));
    }
    if (typeof meta.svgBackContent === "string") {
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
      if (!src.startsWith("data:")) return;
      const parsed = parseDataUrl(src);
      if (!parsed) return;

      const slug = label.toLowerCase().replace(/\s+/g, "-");
      embeds.push({
        contentId: `preview-${itemIndex}-${slug}`,
        itemIndex,
        label,
        filename: `item-${itemIndex + 1}-${safeName}-${slug}.${parsed.ext}`,
        content: parsed.buffer,
        contentType: parsed.mimeType,
      });
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
    .map(
      (embed) =>
        `<td style="padding:0 12px 12px 0;vertical-align:top;">
          <p style="margin:0 0 8px;font-size:11px;font-weight:700;color:${BRAND.muted};text-transform:uppercase;letter-spacing:0.06em;">${escapeHtml(embed.label)}</p>
          <img src="cid:${embed.contentId}" alt="${escapeHtml(item.name)} ${escapeHtml(embed.label)}" width="240" style="width:240px;max-width:100%;height:auto;border:1px solid ${BRAND.border};display:block;background:${BRAND.white};" />
        </td>`,
    )
    .join("");

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

function buildCustomerMessage(isMk: boolean): string {
  const title = isMk ? "Што следува?" : "What happens next?";
  const body = isMk
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
  const heading = isMk ? "Податоци за достава" : "Delivery details";
  const rows = [
    detailRow(isMk ? "Име" : "Name", escapeHtml(data.fullName)),
    detailRow(isMk ? "Телефон" : "Phone", escapeHtml(data.phone)),
    detailRow(
      isMk ? "Е-пошта" : "Email",
      data.email ? escapeHtml(data.email) : "—",
    ),
    detailRow(
      isMk ? "Адреса" : "Address",
      `${escapeHtml(data.city)}<br/>${escapeHtml(data.address)}`,
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
  return embeds.map(({ filename, content, contentType }) => ({
    filename,
    content,
    contentType,
  }));
}

function toResendAttachment(
  attachment: EmailAttachment & { contentId?: string },
) {
  return {
    filename: attachment.filename,
    content: attachment.content,
    contentType: attachment.contentType,
    ...(attachment.contentId ? { contentId: attachment.contentId } : {}),
  };
}

function buildSvgPrintAttachments(data: CheckoutInput): EmailAttachment[] {
  const attachments: EmailAttachment[] = [];

  data.items.forEach((item, itemIndex) => {
    const printFiles = getSvgPrintFilesFromMetadata(item.metadata, item.name);
    printFiles.forEach((file) => {
      attachments.push({
        filename: `item-${itemIndex + 1}-${file.filename}`,
        content: Buffer.from(file.svg, "utf-8"),
        contentType: "image/svg+xml",
      });
    });
  });

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

export async function sendOrderEmails(
  orderNumber: string,
  data: CheckoutInput,
  totalAmount: number,
) {
  const resend = getResend();
  const from = process.env.EMAIL_FROM ?? "Print 8 <onboarding@resend.dev>";
  const adminEmail = process.env.ORDER_NOTIFICATION_EMAIL;

  if (!resend) {
    console.warn("[email] RESEND_API_KEY not set — skipping order emails");
    return { sent: false as const, reason: "missing_api_key" };
  }

  const fileIds = collectOrderFileIds(data);
  const stickerRefs = collectOrderStickers(data.items);
  const previewEmbeds = buildOrderPreviewEmbeds(data);
  const designAttachments = buildDesignPreviewAttachments(previewEmbeds);
  const svgPrintAttachments = buildSvgPrintAttachments(data);
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
  const inlinePreviewAttachments = previewEmbeds.map(toResendAttachment);

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
      buildCustomerMessage(isMk),
      buildDeliverySection(data, isMk),
      itemsHtml,
      buildTotalRow(total, isMk),
    ].join(""),
    footerNote: isMk
      ? "Print 8 · Оваа порака е автоматска потврда за вашата нарачка."
      : "Print 8 · This is an automated confirmation for your order.",
  });

  const results: { customer?: boolean; admin?: boolean } = {};

  if (data.email) {
    const { error } = await resend.emails.send({
      from,
      to: data.email,
      subject: isMk
        ? `Потврда на нарачка ${orderNumber} — Print 8`
        : `Order confirmation ${orderNumber} — Print 8`,
      html: customerHtml,
      attachments:
        inlinePreviewAttachments.length > 0
          ? inlinePreviewAttachments
          : undefined,
    });
    results.customer = !error;
    if (error) console.error("[email] customer confirmation failed:", error);
  }

  if (adminEmail) {
    const adminAttachments = [
      ...inlinePreviewAttachments,
      ...svgPrintAttachments.map(toResendAttachment),
      ...stickerAttachments.map(toResendAttachment),
      ...originalAttachments.map((a) =>
        toResendAttachment({ ...a, filename: `original-${a.filename}` }),
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

    const { error } = await resend.emails.send({
      from,
      to: adminEmail,
      subject: `New order ${orderNumber} — Print 8`,
      html: adminHtml,
      attachments:
        adminAttachments.length > 0 ? adminAttachments : undefined,
    });
    results.admin = !error;
    if (error) console.error("[email] admin notification failed:", error);
  } else {
    console.warn("[email] ORDER_NOTIFICATION_EMAIL not set — admin email skipped");
  }

  return { sent: true as const, results };
}
