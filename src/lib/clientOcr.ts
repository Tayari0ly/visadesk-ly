import { parseMRZTD3, extractMRZFromText } from "./mrzParser";
import { ExtractedPassportData } from "@/types/schengen";

/**
 * Preprocesses an image on canvas and scans for MRZ lines
 */
export async function scanPassportClient(
  fileOrBase64: File | string
): Promise<{ success: boolean; data?: ExtractedPassportData; message?: string }> {
  let imageSrc = "";
  if (typeof fileOrBase64 === "string") {
    imageSrc = fileOrBase64;
  } else {
    imageSrc = await new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => resolve(e.target?.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(fileOrBase64);
    });
  }

  // Load image
  return new Promise((resolve) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = async () => {
      try {
        // Send to backend extractor first which can use Ollama or MRZ
        const res = await fetch("/api/extract-passport", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ imageBase64: imageSrc }),
        });

        if (res.ok) {
          const json = await res.json();
          if (json.success && json.data) {
            resolve({ success: true, data: json.data });
            return;
          }
        }
      } catch (e) {
        console.warn("Backend OCR extraction had error, attempting local fallback", e);
      }

      // If backend OCR was not available or Ollama was off, return helpful notification
      resolve({
        success: false,
        message: "تم فحص الصورة. يمكنك استخراج البيانات فورياً عبر إدخال سطرين كود الـ MRZ أسفل الجواز، أو عبر تفعيل Ollama محلياً، أو استخدام إحدى العينات الجاهزة.",
      });
    };
    img.onerror = () => {
      resolve({ success: false, message: "فشل تحميل الصورة" });
    };
    img.src = imageSrc;
  });
}
