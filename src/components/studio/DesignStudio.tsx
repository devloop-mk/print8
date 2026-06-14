"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useTranslations } from "next-intl";
import { useSearchParams } from "next/navigation";
import { useRouter } from "@/i18n/routing";
import { useCart } from "@/components/cart/CartProvider";
import { useUploadSession } from "@/hooks/useUploadSession";
import { SecureUpload } from "@/components/upload/SecureUpload";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";

export function DesignStudio() {
  const t = useTranslations("studio");
  const searchParams = useSearchParams();
  const router = useRouter();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fabricRef = useRef<unknown>(null);
  const { addItem } = useCart();
  const { token } = useUploadSession();

  const [text, setText] = useState("");
  const [fontSize, setFontSize] = useState(32);
  const [textColor, setTextColor] = useState("#000000");
  const [saved, setSaved] = useState(false);
  const [previewDataUrl, setPreviewDataUrl] = useState<string | null>(null);
  const [uploadedFiles, setUploadedFiles] = useState<
    { fileId: string; name: string }[]
  >([]);

  const templateId = searchParams.get("template");

  const initCanvas = useCallback(async () => {
    if (!canvasRef.current || fabricRef.current) return;

    const { Canvas, IText } = await import("fabric");

    const canvas = new Canvas(canvasRef.current, {
      width: 600,
      height: 400,
      backgroundColor: "#ffffff",
    });

    if (templateId) {
      const placeholder = new IText(`Template: ${templateId}`, {
        left: 50,
        top: 50,
        fontSize: 24,
        fill: "#64748b",
      });
      canvas.add(placeholder);
    }

    fabricRef.current = canvas;
  }, [templateId]);

  useEffect(() => {
    initCanvas();
    return () => {
      if (fabricRef.current && typeof (fabricRef.current as { dispose?: () => void }).dispose === "function") {
        (fabricRef.current as { dispose: () => void }).dispose();
        fabricRef.current = null;
      }
    };
  }, [initCanvas]);

  async function addTextToCanvas() {
    if (!text.trim() || !fabricRef.current) return;
    const { IText } = await import("fabric");
    const canvas = fabricRef.current as InstanceType<
      Awaited<typeof import("fabric")>["Canvas"]
    >;
    const textObj = new IText(text, {
      left: 100,
      top: 100,
      fontSize,
      fill: textColor,
    });
    canvas.add(textObj);
    canvas.setActiveObject(textObj);
    canvas.renderAll();
    setText("");
  }

  async function addImageToCanvas(imageUrl: string) {
    if (!fabricRef.current) return;
    const { FabricImage } = await import("fabric");
    const canvas = fabricRef.current as InstanceType<
      Awaited<typeof import("fabric")>["Canvas"]
    >;
    const img = await FabricImage.fromURL(imageUrl);
    img.scaleToWidth(200);
    img.set({ left: 150, top: 120 });
    canvas.add(img);
    canvas.renderAll();
  }

  function handleFileUpload(fileId: string, name: string) {
    setUploadedFiles((prev) => [...prev, { fileId, name }]);
    addImageToCanvas(`/api/files/${fileId}`);
  }

  function saveDesign() {
    if (!fabricRef.current) return;
    const canvas = fabricRef.current as InstanceType<
      Awaited<typeof import("fabric")>["Canvas"]
    >;
    const dataUrl = canvas.toDataURL({ format: "png", multiplier: 1 });
    setPreviewDataUrl(dataUrl);
    setSaved(true);
  }

  function addToCart() {
    if (!previewDataUrl) saveDesign();
    const dataUrl = previewDataUrl || (fabricRef.current as InstanceType<
      Awaited<typeof import("fabric")>["Canvas"]
    >)?.toDataURL({ format: "png", multiplier: 1 });

    addItem({
      type: "design",
      name: templateId ? `Design (${templateId})` : "Custom design",
      price: 500,
      quantity: 1,
      designPreview: dataUrl,
      fileIds: uploadedFiles.map((f) => f.fileId),
      metadata: { templateId: templateId || "custom" },
    });
    router.push("/cart");
  }

  async function clearCanvas() {
    if (!fabricRef.current) return;
    const canvas = fabricRef.current as InstanceType<
      Awaited<typeof import("fabric")>["Canvas"]
    >;
    canvas.clear();
    canvas.backgroundColor = "#ffffff";
    canvas.renderAll();
    setSaved(false);
    setPreviewDataUrl(null);
  }

  return (
    <div className="grid gap-8 lg:grid-cols-[1fr_320px]">
      <Card className="overflow-hidden p-4">
        <div className="flex justify-center overflow-auto rounded-lg border border-ink-200 bg-ink-50 p-4">
          <canvas ref={canvasRef} />
        </div>
      </Card>

      <div className="space-y-6">
        <Card>
          <h3 className="mb-4 font-semibold text-ink-900">{t("addText")}</h3>
          <input
            type="text"
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder={t("textPlaceholder")}
            className="mb-3 w-full rounded-lg border border-ink-300 px-3 py-2 text-sm"
          />
          <div className="mb-3 flex gap-3">
            <div>
              <label className="text-xs text-ink-500">{t("fontSize")}</label>
              <input
                type="number"
                min={12}
                max={120}
                value={fontSize}
                onChange={(e) => setFontSize(Number(e.target.value))}
                className="mt-1 w-full rounded-lg border border-ink-300 px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label className="text-xs text-ink-500">{t("textColor")}</label>
              <input
                type="color"
                value={textColor}
                onChange={(e) => setTextColor(e.target.value)}
                className="mt-1 h-10 w-full cursor-pointer rounded-lg border border-ink-300"
              />
            </div>
          </div>
          <Button size="sm" onClick={addTextToCanvas} className="w-full">
            {t("addText")}
          </Button>
        </Card>

        <Card>
          <h3 className="mb-4 font-semibold text-ink-900">{t("addImage")}</h3>
          <p className="mb-3 text-xs text-ink-500">{t("uploadHint")}</p>
          <SecureUpload token={token} onUpload={handleFileUpload} />
          {uploadedFiles.length > 0 && (
            <ul className="mt-3 space-y-1 text-xs text-ink-600">
              {uploadedFiles.map((f) => (
                <li key={f.fileId}>✓ {f.name}</li>
              ))}
            </ul>
          )}
        </Card>

        <div className="flex flex-col gap-2">
          <Button onClick={saveDesign}>{t("saveDesign")}</Button>
          <Button variant="secondary" onClick={addToCart}>
            {t("addToCart")}
          </Button>
          <Button variant="outline" onClick={clearCanvas}>
            {t("clear")}
          </Button>
          {saved && (
            <p className="text-center text-sm text-green-600">{t("saved")}</p>
          )}
        </div>
      </div>
    </div>
  );
}
