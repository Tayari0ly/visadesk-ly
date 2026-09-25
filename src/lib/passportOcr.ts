"use client";

import { parseMRZTD3, extractMRZFromText } from "./mrzParser";
import { ExtractedPassportData } from "@/types/schengen";

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error("Failed to load passport image"));
    img.src = src;
  });
}

function renderVariant(
  img: HTMLImageElement,
  opts: { cropStart: number; rotateDeg?: number; invert?: boolean; thresholdDelta?: number }
): string {
  const canvas = document.createElement("canvas");
  const ctx = canvas.getContext("2d", { willReadFrequently: true });
  if (!ctx) return "";

  const rotateDeg = opts.rotateDeg || 0;
  const cropY = Math.floor(img.height * opts.cropStart);
  const cropH = img.height - cropY;
  const scale = Math.max(2.2, Math.min(4.2, 1600 / img.width));

  const srcW = img.width;
  const srcH = cropH;
  canvas.width = Math.floor(srcW * scale);
  canvas.height = Math.floor(srcH * scale);

  ctx.save();
  ctx.imageSmoothingEnabled = false;
  if (rotateDeg) {
    ctx.translate(canvas.width / 2, canvas.height / 2);
    ctx.rotate((rotateDeg * Math.PI) / 180);
    ctx.translate(-canvas.width / 2, -canvas.height / 2);
  }
  ctx.drawImage(img, 0, cropY, srcW, srcH, 0, 0, canvas.width, canvas.height);
  ctx.restore();

  const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
  const data = imageData.data;
  let sum = 0;
  for (let i = 0; i < data.length; i += 4) {
    const gray = 0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2];
    sum += gray;
    data[i] = data[i + 1] = data[i + 2] = gray;
  }
  const avg = sum / (data.length / 4);
  const threshold = Math.max(100, Math.min(175, avg - (opts.thresholdDelta ?? 10)));
  for (let i = 0; i < data.length; i += 4) {
    let v = data[i] > threshold ? 255 : 0;
    if (opts.invert) v = 255 - v;
    data[i] = data[i + 1] = data[i + 2] = v;
  }
  ctx.putImageData(imageData, 0, 0);
  return canvas.toDataURL("image/png");
}

function enhanceFullPage(img: HTMLImageElement): string {
  const canvas = document.createElement("canvas");
  const ctx = canvas.getContext("2d");
  if (!ctx) return "";
  const maxW = 1800;
  const scale = img.width > maxW ? maxW / img.width : 1;
  canvas.width = Math.floor(img.width * scale);
  canvas.height = Math.floor(img.height * scale);
  ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
  return canvas.toDataURL("image/png");
}

function normalizeOcrMrz(text: string): string {
  return text
    .toUpperCase()
    .replace(/[«»]/g, "<<")
    .replace(/[\u00AB\u00BB]/g, "<<")
    .replace(/[|\\\/]/g, "<")
    .replace(/[\[\]\{\}\(\)]/g, "<")
    .replace(/ /g, "")
    .replace(/[‘’`'´]/g, "")
    .replace(/[^A-Z0-9<\n]/g, "");
}

function findMrzLines(text: string): { line1: string; line2: string } | null {
  const cleaned = normalizeOcrMrz(text);
  const lines = cleaned
    .split(/\n+/)
    .map((l) => l.trim())
    .filter((l) => l.length >= 20);

  for (let i = 0; i < lines.length; i++) {
    const l = lines[i];
    if (l.startsWith("P<") || /^P[A-Z<]/.test(l)) {
      const next = lines[i + 1];
      if (next && next.length >= 28) {
        return { line1: l.padEnd(44, "<").slice(0, 44), line2: next.padEnd(44, "<").slice(0, 44) };
      }
    }
  }

  const candidates = lines.filter((l) => (l.match(/</g) || []).length >= 4 && l.length >= 28);
  if (candidates.length >= 2) {
    const l1 = candidates.find((l) => l.includes("P") || l.includes("<<")) || candidates[0];
    const idx = candidates.indexOf(l1);
    const l2 = candidates[idx + 1] || candidates[1];
    return { line1: l1.padEnd(44, "<").slice(0, 44), line2: l2.padEnd(44, "<").slice(0, 44) };
  }
  return null;
}

export interface PassportOcrResult {
  success: boolean;
  data?: ExtractedPassportData;
  mrzLine1?: string;
  mrzLine2?: string;
  rawText?: string;
  message?: string;
}

export async function ocrPassportImage(
  imageSrc: string,
  onProgress?: (msg: string) => void
): Promise<PassportOcrResult> {
  try {
    onProgress?.("جارٍ تجهيز صورة الجواز وتحسين التباين...");
    const img = await loadImage(imageSrc);

    onProgress?.("تحميل محرك التعرف الضوئي المحلي...");
    const { createWorker } = await import("tesseract.js");
    const worker = await createWorker("eng", 1, {
      logger: (m) => {
        if (m.status === "recognizing text" && typeof m.progress === "number") {
          onProgress?.(`قراءة شفرة الجواز محلياً... ${Math.round(m.progress * 100)}%`);
        }
      },
    });

    let combinedText = "";
    try {
      await worker.setParameters({
        tessedit_char_whitelist: "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789<",
        tessedit_pageseg_mode: "6" as any,
        preserve_interword_spaces: "0",
      });

      const variants = [
        { cropStart: 0.7, rotateDeg: 0, invert: false, thresholdDelta: 8 },
        { cropStart: 0.74, rotateDeg: 0, invert: false, thresholdDelta: 14 },
        { cropStart: 0.66, rotateDeg: -1.8, invert: false, thresholdDelta: 10 },
        { cropStart: 0.66, rotateDeg: 1.8, invert: false, thresholdDelta: 10 },
        { cropStart: 0.72, rotateDeg: 0, invert: true, thresholdDelta: 6 },
      ];

      for (let i = 0; i < variants.length; i++) {
        onProgress?.(`محاولة قراءة MRZ (${i + 1}/${variants.length}) للصورة المائلة أو الباهتة...`);
        const dataUrl = renderVariant(img, variants[i]);
        if (!dataUrl) continue;
        const { data } = await worker.recognize(dataUrl);
        const text = data.text || "";
        combinedText += `\n${text}`;
        const lines = findMrzLines(text);
        const parsed = lines ? parseMRZTD3(lines.line1, lines.line2) : extractMRZFromText(text);
        if (parsed && parsed.valid && parsed.surname && parsed.passportNumber) {
          await worker.terminate();
          return successResult(parsed, combinedText, 0.95);
        }
      }

      onProgress?.("محاولة أخيرة: فحص صفحة الجواز كاملة...");
      const full = enhanceFullPage(img);
      const fullRes = await worker.recognize(full);
      combinedText += `\n${fullRes.data.text || ""}`;
      const lines = findMrzLines(combinedText);
      const parsed = lines ? parseMRZTD3(lines.line1, lines.line2) : extractMRZFromText(combinedText);
      if (parsed && parsed.valid && parsed.surname && parsed.passportNumber) {
        await worker.terminate();
        return successResult(parsed, combinedText, 0.9);
      }
    } finally {
      try {
        await worker.terminate();
      } catch {
        /* ignore */
      }
    }

    return {
      success: false,
      rawText: combinedText,
      message:
        "تم فحص الصورة بعدة زوايا وتباينات محلياً، لكن شفرة MRZ لم تكن واضحة. أدخل السطرين أسفل الجواز أو استخدم عينة تجريبية.",
    };
  } catch (error: any) {
    return {
      success: false,
      message: error?.message || "تعذر تشغيل محرك التعرف الضوئي المحلي.",
    };
  }
}

function successResult(parsed: NonNullable<ReturnType<typeof parseMRZTD3>>, text: string, score: number): PassportOcrResult {
  return {
    success: true,
    mrzLine1: parsed.rawLines[0],
    mrzLine2: parsed.rawLines[1],
    rawText: text,
    data: {
      surname: parsed.surname,
      firstNames: parsed.firstNames,
      passportNumber: parsed.passportNumber,
      nationality: parsed.nationalityName,
      nationalityCode: parsed.nationalityCode,
      dateOfBirth: parsed.dateOfBirth,
      sex: parsed.sex,
      expiryDate: parsed.expiryDate,
      issueDate: "",
      placeOfBirth: "",
      countryOfBirth: parsed.nationalityName,
      personalNumber: parsed.personalNumber,
      mrzRaw: `${parsed.rawLines[0]}\n${parsed.rawLines[1]}`,
      confidenceScore: parsed.valid ? score : Math.min(score, 0.65),
      extractionEngine: "Tesseract.js multi-pass OCR + ICAO 9303 MRZ",
    },
  };
}
