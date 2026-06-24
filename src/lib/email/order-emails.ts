import { Resend } from "resend";
import type { CheckoutInput } from "@/lib/validations/order";
import { getUploadedFile } from "@/lib/upload";
import { getSupabaseAdmin } from "@/lib/supabase/client";
import { formatPrice } from "@/lib/utils";

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

function collectOrderFileIds(data: CheckoutInput): string[] {
  const ids = new Set<string>();
  for (const id of data.fileIds ?? []) ids.add(id);
  for (const item of data.items) {
    for (const id of item.fileIds ?? []) ids.add(id);
    const meta = item.metadata;
    if (!meta) continue;
    for (const [key, value] of Object.entries(meta)) {
      if (
        (key.endsWith("UploadedFileId") || key === "uploadedFileId") &&
        typeof value === "string" &&
        value
      ) {
        ids.add(value);
      }
    }
  }
  return [...ids];
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
    const previews: { url?: string; label: string }[] = [
      { url: item.designPreview, label: "front" },
      { url: item.backDesignPreview, label: "back" },
      { url: item.leftDesignPreview, label: "left" },
      { url: item.rightDesignPreview, label: "right" },
    ];

    previews.forEach(({ url, label }) => {
      if (!url?.startsWith("data:")) return;
      const parsed = parseDataUrl(url);
      if (!parsed) return;
      const safeName = item.name.replace(/[^\w\s-]/g, "").trim().slice(0, 40);
      attachments.push({
        filename: `item-${itemIndex + 1}-${safeName || "design"}-${label}.${parsed.ext}`,
        content: parsed.buffer,
        contentType: parsed.mimeType,
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

function buildItemsHtml(data: CheckoutInput, locale: CheckoutInput["locale"]) {
  return data.items
    .map(
      (item) =>
        `<li><strong>${escapeHtml(item.name)}</strong> × ${item.quantity} — ${formatPrice(item.price * item.quantity, locale)}</li>`,
    )
    .join("");
}

function buildDesignImagesHtml(data: CheckoutInput) {
  const blocks: string[] = [];
  const previewFields = [
    { key: "designPreview" as const, label: "Front" },
    { key: "backDesignPreview" as const, label: "Back" },
    { key: "leftDesignPreview" as const, label: "Left" },
    { key: "rightDesignPreview" as const, label: "Right" },
  ];

  data.items.forEach((item) => {
    const images: string[] = [];
    for (const { key, label } of previewFields) {
      const url = item[key];
      if (!url?.startsWith("data:")) continue;
      images.push(
        `<div style="display:inline-block;vertical-align:top;margin:8px 12px 8px 0;">
          <p style="margin:0 0 6px;font-size:12px;font-weight:600;color:#6b7280;text-transform:uppercase;letter-spacing:0.05em;">${label}</p>
          <img src="${url}" alt="${escapeHtml(item.name)} ${label.toLowerCase()}" style="max-width:280px;border-radius:8px;border:1px solid #e5e7eb;display:block;" />
        </div>`,
      );
    }
    if (images.length === 0) return;
    blocks.push(
      `<div style="margin:16px 0;"><p style="margin:0 0 8px;font-weight:600;">${escapeHtml(item.name)}</p>${images.join("")}</div>`,
    );
  });

  return blocks.join("");
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
  const designAttachments = await buildDesignPreviewAttachments(data);
  const originalAttachments = await buildOriginalUploadAttachments(fileIds);
  const total = formatPrice(totalAmount, data.locale);
  const itemsHtml = buildItemsHtml(data, data.locale);
  const designHtml = buildDesignImagesHtml(data);
  const isMk = data.locale === "mk";

  const customerHtml = isMk
    ? `
      <h2>Ви благодариме за нарачката!</h2>
      <p>Број на нарачка: <strong>${orderNumber}</strong></p>
      <p>Вкупно: <strong>${total}</strong></p>
      <p>Плаќање при достава. Ќе ве контактираме наскоро за потврда.</p>
      <h3>Ваши производи</h3>
      <ul>${itemsHtml}</ul>
      ${designHtml ? `<h3>Преглед на дизајнот</h3>${designHtml}` : ""}
    `
    : `
      <h2>Thank you for your order!</h2>
      <p>Order number: <strong>${orderNumber}</strong></p>
      <p>Total: <strong>${total}</strong></p>
      <p>Payment on delivery. We will contact you soon to confirm.</p>
      <h3>Your items</h3>
      <ul>${itemsHtml}</ul>
      ${designHtml ? `<h3>Design preview</h3>${designHtml}` : ""}
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
        <h3>Items</h3>
        <ul>${itemsHtml}</ul>
        <p><strong>Total:</strong> ${total}</p>
        ${designHtml ? `<h3>Design previews</h3>${designHtml}` : ""}
        <p>${adminAttachments.length} file(s) attached (design previews + original uploads).</p>
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
