export type ModelDef = {
  id: string;
  label: string;
  provider: "builtin" | "gemini";
  description: string;
  caps: string[];
};

// Built-in models run through the app server; no user key needed.
export const BUILTIN_MODELS: ModelDef[] = [
  { id: "openai/gpt-6-astra", label: "Hazem-Tech", provider: "builtin", description: "المساعد المدمج — لا يحتاج مفتاحاً", caps: ["نص", "صور"] },
];

// Original Gemini models from the source file; only usable with personal keys.
export const GEMINI_MODELS: ModelDef[] = [
  { id: "gemini-3.5-flash-lite", label: "Hazem-Tech lite", provider: "gemini", description: "أسرع الإجابات", caps: ["نص", "صور", "ملفات"] },
  { id: "gemini-3.6-flash", label: "Hazem-Tech (Gemini)", provider: "gemini", description: "مساعدة متكاملة", caps: ["نص", "صور", "ملفات"] },
  { id: "gemini-3.7-flash", label: "Hazem-Tech Pro", provider: "gemini", description: "مهام أعمق", caps: ["نص", "صور", "ملفات"] },
  { id: "gemini-3.8-flash", label: "التفكير العميق", provider: "gemini", description: "استدلال مطوّل", caps: ["نص", "صور", "ملفات"] },
];

export const ALL_MODELS = [...BUILTIN_MODELS, ...GEMINI_MODELS];
export const findModel = (id: string) => ALL_MODELS.find((m) => m.id === id) ?? BUILTIN_MODELS[0]!;
