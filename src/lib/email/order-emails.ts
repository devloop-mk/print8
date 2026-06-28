import { Resend } from "resend";
import type { CheckoutInput } from "@/lib/validations/order";
import { getUploadedFile } from "@/lib/upload";
import { getSupabaseAdmin } from "@/lib/supabase/client";
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

function getStorageBucket() {
  const bucket = process.env.SUPABASE_STORAGE_BUCKET;
  if (!bucket) throw new Error("SUPABASE_STORAGE_BUCKET is not set");
  return bucket;
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

function buildProductDesignDetailsInnerHtml(item: OrderItem): string {
  const meta = item.metadata;
  if (!meta) return "";

  const sideLines: string[] = [];

  for (const side of PRODUCT_SIDES) {
    const prefix = getSideMetadataPrefix(side);
    const parts: string[] = [];

    const customText = meta[`${prefix}CustomText`];
    if (typeof customText === "string" && customText.trim()) {
      parts.push(`Text: “${escapeHtml(customText.trim())}”`);
    }

    const stickers = parsePlacedStickers(meta[`${prefix}Stickers`]);
    if (stickers.length > 0) {
      const ids = stickers.map((s) => s.stickerId).join(", ");
      parts.push(`Stickers: ${escapeHtml(ids)}`);
    }

    const uploadedFileId = meta[`${prefix}UploadedFileId`];
    if (typeof uploadedFileId === "string" && uploadedFileId) {
      parts.push("Photo: attached (original upload)");
    }

    const premade = meta[`${prefix}PremadeDesignImage`];
    if (typeof premade === "string" && premade) {
      parts.push("Premade design applied");
    }

    if (parts.length === 0) continue;

    const sideLabel = side.charAt(0).toUpperCase() + side.slice(1);
    sideLines.push(
      `<li><strong>${sideLabel}</strong> — ${parts.join(" · ")}</li>`,
    );
  }

  if (sideLines.length === 0) return "";
  return `<ul style="margin:0;padding-left:18px;">${sideLines.join("")}</ul>`;
}

function buildCustomDesignDetailsInnerHtml(item: OrderItem): string {
  const meta = item.metadata;
  if (!meta) return "";

  if (meta.orderType === "svg-template") {
    const summary: string[] = [];
    if (typeof meta.svgTemplateId === "string") {
      summary.push(`Template: ${escapeHtml(meta.svgTemplateId)}`);
    }
    if (typeof meta.svgFrontContent === "string") {
      summary.push("Front: print-ready SVG attached");
    }
    if (typeof meta.svgBackContent === "string") {
      summary.push("Back: print-ready SVG attached");
    }

    const textEntries = Object.entries(meta)
      .filter(([key]) => key.startsWith("text_"))
      .map(([key, value]) => {
        const label = key.replace(/^text_/, "").replace(":", " · ");
        return `<li><strong>${escapeHtml(label)}</strong>: ${escapeHtml(String(value))}</li>`;
      });

    return [
      summary.length > 0
        ? `<p style="margin:0 0 8px;">${summary.join("<br/>")}</p>`
        : "",
      textEntries.length > 0
        ? `<ul style="margin:0;padding-left:18px;">${textEntries.join("")}</ul>`
        : "",
    ].join("");
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

    return `<ul style="margin:0;padding-left:18px;">
      ${fields
        .map(
          ([key, value]) =>
            `<li><strong>${escapeHtml(key)}</strong>: ${escapeHtml(String(value))}</li>`,
        )
        .join("")}
    </ul>`;
  }

  return "";
}

function buildOrderItemPreviewImagesHtml(item: OrderItem): string {
  const previews = getOrderItemPreviewImages(item);
  if (previews.length === 0) return "";

  return previews
    .filter((preview) => preview.src.startsWith("data:"))
    .map(
      (preview) =>
        `<div style="display:inline-block;vertical-align:top;margin:8px 12px 8px 0;">
          <p style="margin:0 0 6px;font-size:12px;font-weight:600;color:#6b7280;text-transform:uppercase;letter-spacing:0.05em;">${escapeHtml(preview.label)}</p>
          <img src="${preview.src}" alt="${escapeHtml(item.name)} ${escapeHtml(preview.label)}" style="max-width:280px;border-radius:8px;border:1px solid #e5e7eb;display:block;background:#fff;" />
        </div>`,
    )
    .join("");
}

function buildOrderItemEmailBlock(
  item: OrderItem,
  index: number,
  totalItems: number,
  locale: CheckoutInput["locale"],
  labels: { itemOf: string; designDetails: string },
): string {
  const previewHtml = buildOrderItemPreviewImagesHtml(item);
  const productDetails = buildProductDesignDetailsInnerHtml(item);
  const customDetails = buildCustomDesignDetailsInnerHtml(item);
  const detailsHtml = [productDetails, customDetails].filter(Boolean).join("");

  const itemPosition =
    totalItems > 1
      ? `<p style="margin:0 0 8px;font-size:12px;font-weight:600;color:#6b7280;text-transform:uppercase;letter-spacing:0.05em;">${labels.itemOf.replace("{current}", String(index + 1)).replace("{total}", String(totalItems))}</p>`
      : "";

  return `<div style="margin:24px 0;padding:20px;border:2px solid #d1d5db;border-radius:12px;background:#f9fafb;">
    ${itemPosition}
    <p style="margin:0 0 4px;font-size:18px;font-weight:700;color:#111827;">${escapeHtml(item.name)}</p>
    <p style="margin:0;font-size:14px;color:#374151;">× ${item.quantity} — ${formatPrice(item.price * item.quantity, locale)}</p>
    ${
      previewHtml
        ? `<div style="margin-top:16px;padding-top:16px;border-top:1px solid #e5e7eb;">
            <p style="margin:0 0 10px;font-size:13px;font-weight:600;color:#374151;">${labels.designDetails}</p>
            ${previewHtml}
          </div>`
        : ""
    }
    ${
      detailsHtml
        ? `<div style="margin-top:12px;padding-top:12px;border-top:1px solid #e5e7eb;font-size:14px;color:#374151;">${detailsHtml}</div>`
        : ""
    }
  </div>`;
}

function buildOrderItemsEmailHtml(
  data: CheckoutInput,
  labels: { itemOf: string; designDetails: string; itemsHeading: string },
): string {
  const blocks = data.items.map((item, index) =>
    buildOrderItemEmailBlock(
      item,
      index,
      data.items.length,
      data.locale,
      labels,
    ),
  );

  return `<h3 style="margin:24px 0 12px;">${labels.itemsHeading}</h3>${blocks.join("")}`;
}

async function downloadStoredFile(storedName: string): Promise<Buffer | null> {
  const { data, error } = await getSupabaseAdmin()
    .storage.from(getStorageBucket())
    .download(storedName);
  if (error || !data) return null;
  return Buffer.from(await data.arrayBuffer());
}

async function buildDesignPreviewAttachments(
  data: CheckoutInput,
): Promise<EmailAttachment[]> {
  const attachments: EmailAttachment[] = [];

  data.items.forEach((item, itemIndex) => {
    const previews = getOrderItemPreviewImages(item);
    const safeName = sanitizeOrderItemFilename(item.name, `item-${itemIndex + 1}`);

    previews.forEach(({ src, label }) => {
      if (!src.startsWith("data:")) return;
      const parsed = parseDataUrl(src);
      if (!parsed) return;
      attachments.push({
        filename: `item-${itemIndex + 1}-${safeName}-${label.toLowerCase().replace(/\s+/g, "-")}.${parsed.ext}`,
        content: parsed.buffer,
        contentType: parsed.mimeType,
      });
    });
  });

  return attachments;
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
  const designAttachments = await buildDesignPreviewAttachments(data);
  const svgPrintAttachments = buildSvgPrintAttachments(data);
  const stickerAttachments = await buildStickerAttachments(stickerRefs);
  const originalAttachments = await buildOriginalUploadAttachments(fileIds);
  const total = formatPrice(totalAmount, data.locale);
  const isMk = data.locale === "mk";
  const itemsHtml = buildOrderItemsEmailHtml(
    data,
    isMk
      ? {
          itemsHeading: "Ваши производи",
          itemOf: "Артикл {current} од {total}",
          designDetails: "Преглед на дизајнот",
        }
      : {
          itemsHeading: "Your items",
          itemOf: "Item {current} of {total}",
          designDetails: "Design preview",
        },
  );

  const customerHtml = isMk
    ? `
      <h2>Ви благодариме за нарачката!</h2>
      <p>Број на нарачка: <strong>${orderNumber}</strong></p>
      <p>Вкупно: <strong>${total}</strong></p>
      <p>Плаќање при достава. Ќе ве контактираме наскоро за потврда.</p>
      ${itemsHtml}
    `
    : `
      <h2>Thank you for your order!</h2>
      <p>Order number: <strong>${orderNumber}</strong></p>
      <p>Total: <strong>${total}</strong></p>
      <p>Payment on delivery. We will contact you soon to confirm.</p>
      ${itemsHtml}
    `;

  const results: { customer?: boolean; admin?: boolean } = {};

  if (data.email) {
    const { error } = await resend.emails.send({
      from,
      to: data.email,
      subject: isMk
        ? `Потврда на нарачка ${orderNumber} — Print 8`
        : `Order confirmation ${orderNumber} — Print 8`,
      html: customerHtml,
    });
    results.customer = !error;
    if (error) console.error("[email] customer confirmation failed:", error);
  }

  if (adminEmail) {
    const adminAttachments = [
      ...designAttachments.map((a) => ({
        filename: a.filename,
        content: a.content,
        contentType: a.contentType,
      })),
      ...svgPrintAttachments.map((a) => ({
        filename: a.filename,
        content: a.content,
        contentType: a.contentType,
      })),
      ...stickerAttachments.map((a) => ({
        filename: a.filename,
        content: a.content,
        contentType: a.contentType,
      })),
      ...originalAttachments.map((a) => ({
        filename: `original-${a.filename}`,
        content: a.content,
        contentType: a.contentType,
      })),
    ];

    const { error } = await resend.emails.send({
      from,
      to: adminEmail,
      subject: `New order ${orderNumber} — Print 8`,
      html: `
        <h2>New order ${orderNumber}</h2>
        <p><strong>${escapeHtml(data.fullName)}</strong><br/>
        ${escapeHtml(data.phone)}<br/>
        ${data.email ? escapeHtml(data.email) : ""}<br/>
        ${escapeHtml(data.city)}, ${escapeHtml(data.address)}</p>
        ${data.notes ? `<p><strong>Notes:</strong> ${escapeHtml(data.notes)}</p>` : ""}
        ${buildOrderItemsEmailHtml(data, {
          itemsHeading: "Items",
          itemOf: "Item {current} of {total}",
          designDetails: "Design preview",
        })}
        <p><strong>Total:</strong> ${total}</p>
        <p>${adminAttachments.length} file(s) attached (${designAttachments.length} preview(s), ${svgPrintAttachments.length} print SVG(s), ${stickerAttachments.length} sticker(s), ${originalAttachments.length} original upload(s)).</p>
      `,
      attachments: adminAttachments.map((a) => ({
        filename: a.filename,
        content: a.content,
      })),
    });
    results.admin = !error;
    if (error) console.error("[email] admin notification failed:", error);
  } else {
    console.warn("[email] ORDER_NOTIFICATION_EMAIL not set — admin email skipped");
  }

  return { sent: true as const, results };
}
