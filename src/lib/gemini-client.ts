// Personal Gemini keys (original feature): up to 3 keys stored in this browser, with rotation + cooldown on 429/403.
import { SYSTEM_PROMPT } from "./system-prompt";
import type { Message } from "./chat-store";

export const GEMINI_KEY_STORAGE = "hazem_gemini_keys_v3";
const ACTIVE = "hazem_active_gemini_key";
const cooldown = new Map<string, number>();

export function loadKeys(): string[] {
  try {
    const a = JSON.parse(localStorage.getItem(GEMINI_KEY_STORAGE) || "null");
    if (Array.isArray(a)) return [0, 1, 2].map((i) => String(a[i] ?? ""));
  } catch { /* ignore */ }
  return ["", "", ""];
}
export function saveKeys(keys: string[]) {
  localStorage.setItem(GEMINI_KEY_STORAGE, JSON.stringify(keys.slice(0, 3)));
  localStorage.setItem(ACTIVE, "0");
}
export const validKeys = (keys = loadKeys()) => keys.filter((k) => k.trim().length >= 20);

function pickKey(): string {
  const keys = loadKeys();
  if (!validKeys(keys).length) throw new Error("أضف مفتاح Google Gemini واحداً على الأقل من الإعدادات.");
  let idx = Number(localStorage.getItem(ACTIVE) || 0) || 0;
  const now = Date.now();
  for (let s = 0; s < 3; s++) {
    const i = (idx + s) % 3;
    if (keys[i].trim().length >= 20 && (cooldown.get(keys[i]) || 0) <= now) {
      localStorage.setItem(ACTIVE, String(i));
      return keys[i];
    }
  }
  return validKeys(keys)[0];
}
function rotate(failed: string) {
  const keys = loadKeys();
  const i = keys.indexOf(failed);
  if (i >= 0) { cooldown.set(failed, Date.now() + 45000); localStorage.setItem(ACTIVE, String((i + 1) % 3)); }
}

function toContents(history: Message[]) {
  return history.map((m) => {
    const parts: any[] = [];
    for (const a of (m.attachments ?? []) as any[]) {
      if (a.kind === "image" && a.data) {
        const [, mime, b64] = /^data:([^;]+);base64,(.*)$/.exec(a.data) ?? [];
        if (b64) parts.push({ inline_data: { mime_type: mime, data: b64 } });
      } else if (a.kind === "text" && a.data) parts.push({ text: `--- ملف: ${a.name} ---\n${a.data}` });
    }
    parts.push({ text: m.text || " " });
    return { role: m.role === "user" ? "user" : "model", parts };
  });
}

export async function streamGemini(model: string, history: Message[], onDelta: (t: string) => void, signal: AbortSignal) {
  let lastErr: Error | null = null;
  for (let attempt = 0; attempt < Math.max(1, validKeys().length); attempt++) {
    const key = pickKey();
    const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:streamGenerateContent?alt=sse`, {
      method: "POST",
      signal,
      headers: { "Content-Type": "application/json", "x-goog-api-key": key },
      body: JSON.stringify({ contents: toContents(history), systemInstruction: { parts: [{ text: SYSTEM_PROMPT }] } }),
    });
    if (res.status === 429 || res.status === 403 || res.status >= 500) {
      rotate(key);
      lastErr = new Error(res.status === 429 ? "تم تجاوز حد الاستخدام لهذا المفتاح." : `خطأ من Gemini (${res.status}).`);
      continue;
    }
    if (!res.ok || !res.body) throw new Error(`تعذّر الاتصال بـ Gemini (${res.status}).`);
    const reader = res.body.getReader();
    const dec = new TextDecoder();
    let buf = "";
    for (;;) {
      const { done, value } = await reader.read();
      if (done) break;
      buf += dec.decode(value, { stream: true });
      let nl;
      while ((nl = buf.indexOf("\n")) >= 0) {
        const line = buf.slice(0, nl).trim();
        buf = buf.slice(nl + 1);
        if (!line.startsWith("data:")) continue;
        try {
          const j = JSON.parse(line.slice(5));
          const t = (j.candidates?.[0]?.content?.parts ?? []).filter((p: any) => !p.thought).map((p: any) => p.text ?? "").join("");
          if (t) onDelta(t);
        } catch { /* partial line */ }
      }
    }
    return;
  }
  throw lastErr ?? new Error("تعذّر الإرسال.");
}
