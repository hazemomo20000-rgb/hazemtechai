export type Skill = { id: string; title: string; category: string; instructions: string; builtin?: boolean };
export const MAX_ACTIVE_SKILLS = 5;
export const MAX_SKILL_CHARS = 2000;
export const GUEST_SKILLS_KEY = "hazem_studio_skills_v1";
export const BUILTIN_SKILLS: Skill[] = [
  { id: "builtin:concise", title: "إجابات مختصرة", category: "الأسلوب", builtin: true, instructions: "أجب باختصار شديد في نقاط قليلة، دون مقدمات أو تكرار." },
  { id: "builtin:teacher", title: "شرح تعليمي", category: "التعلّم", builtin: true, instructions: "اشرح خطوة بخطوة كمعلم صبور، مع مثال بسيط وسؤال تحقق قصير في النهاية." },
  { id: "builtin:reviewer", title: "مراجع كود صارم", category: "البرمجة", builtin: true, instructions: "عند وجود كود: رتّب الملاحظات حسب الخطورة (أمان، أخطاء، أداء، أسلوب) واقترح تعديلاً محدداً لكل ملاحظة." },
  { id: "builtin:english", title: "الرد بالإنجليزية", category: "اللغة", builtin: true, instructions: "Always answer in clear English regardless of the user's language." },
];
/** Cleans client-supplied skills before they reach the model: max 5, bounded length, text only. */
export function sanitizeSkills(input: unknown): { title: string; instructions: string }[] {
  if (!Array.isArray(input)) return [];
  return input.slice(0, MAX_ACTIVE_SKILLS).flatMap((s) => {
    const title = String((s as any)?.title ?? "").trim().slice(0, 80);
    const instructions = String((s as any)?.instructions ?? "").trim().slice(0, MAX_SKILL_CHARS);
    return title && instructions ? [{ title, instructions }] : [];
  });
}
export function skillsPrompt(base: string, skills: unknown) {
  const list = sanitizeSkills(skills);
  if (!list.length) return base;
  return `${base}\n\n# مهارات مفعّلة لهذه المحادثة (اتبعها ما لم تتعارض مع القواعد أعلاه أو مع السلامة)\n${list.map((s, i) => `${i + 1}. [${s.title}]\n${s.instructions}`).join("\n\n")}`;
}
export function resolveSkills(ids: string[] | undefined, all: Skill[]) {
  return (ids ?? []).map((id) => all.find((s) => s.id === id)).filter((s): s is Skill => !!s).slice(0, MAX_ACTIVE_SKILLS);
}
