import { unzipSync, strFromU8 } from "fflate";

export async function readDocument(file: File): Promise<string> {
  const ext = file.name.split(".").at(-1)?.toLowerCase();
  const bytes = new Uint8Array(await file.arrayBuffer());
  if (ext === "pdf") {
    if (new TextDecoder().decode(bytes.slice(0, 5)) !== "%PDF-") throw new Error("ملف PDF غير صالح.");
    const pdfjs = await import("pdfjs-dist");
    const worker = await import("pdfjs-dist/build/pdf.worker.min.mjs?url");
    pdfjs.GlobalWorkerOptions.workerSrc = worker.default;
    const pdf = await pdfjs.getDocument({ data: bytes }).promise;
    try {
      const pages: string[] = [];
      for (let n = 1; n <= pdf.numPages; n++) {
        const page = await pdf.getPage(n);
        const content = await page.getTextContent();
        pages.push(content.items.map(i => "str" in i ? i.str + (i.hasEOL ? "\n" : " ") : "").join(""));
      }
      return requireText(pages.join("\n\n"));
    } finally { await pdf.destroy(); }
  }
  if (bytes[0] !== 0x50 || bytes[1] !== 0x4b) throw new Error("ملف Office غير صالح؛ استخدم DOCX أو XLSX أو PPTX.");
  if (ext === "docx") {
    const mammoth = await import("mammoth/mammoth.browser");
    return requireText((await mammoth.extractRawText({ arrayBuffer: bytes.buffer })).value);
  }
  if (ext === "xlsx") {
    const XLSX = await import("xlsx");
    const book = XLSX.read(bytes, { type: "array" });
    return requireText(book.SheetNames.map(name => `${name}\n${XLSX.utils.sheet_to_csv(book.Sheets[name])}`).join("\n\n"));
  }
  const entries = unzipSync(bytes, { filter: entry => /^ppt\/slides\/slide\d+\.xml$/.test(entry.name) && entry.originalSize < 8 * 1024 * 1024 });
  const slides = Object.keys(entries).sort((a, b) => a.localeCompare(b, undefined, { numeric: true }));
  return requireText(slides.map(name => {
    const xml = new DOMParser().parseFromString(strFromU8(entries[name]), "application/xml");
    return [...xml.getElementsByTagNameNS("*", "t")].map(n => n.textContent).join("\n");
  }).join("\n\n"));
}

function requireText(text: string) {
  if (!text.trim()) throw new Error("لا يوجد نص قابل للاستخراج؛ الملفات الممسوحة ضوئياً تحتاج OCR.");
  return text;
}