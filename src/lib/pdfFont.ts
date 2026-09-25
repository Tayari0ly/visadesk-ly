import type { jsPDF } from "jspdf";

let regularB64: string | null = null;
let boldB64: string | null = null;

function arrayBufferToBase64(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  const chunk = 8192;
  let binary = "";
  for (let i = 0; i < bytes.length; i += chunk) {
    binary += String.fromCharCode(...bytes.subarray(i, i + chunk));
  }
  return btoa(binary);
}

async function loadFontBase64(url: string): Promise<string> {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Font not found: ${url}`);
  return arrayBufferToBase64(await res.arrayBuffer());
}

export async function embedPdfFonts(doc: jsPDF): Promise<boolean> {
  try {
    if (!regularB64) {
      const [reg, bold] = await Promise.all([
        loadFontBase64("/fonts/DejaVuSans.ttf"),
        loadFontBase64("/fonts/DejaVuSans-Bold.ttf"),
      ]);
      regularB64 = reg;
      boldB64 = bold;
    }
    doc.addFileToVFS("DejaVuSans.ttf", regularB64);
    doc.addFont("DejaVuSans.ttf", "DejaVu", "normal");
    doc.addFileToVFS("DejaVuSans-Bold.ttf", boldB64 as string);
    doc.addFont("DejaVuSans-Bold.ttf", "DejaVu", "bold");
    doc.setFont("DejaVu", "normal");
    return true;
  } catch (e) {
    console.warn("DejaVu embed failed, falling back to Helvetica", e);
    return false;
  }
}
