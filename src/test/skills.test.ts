import { describe, expect, it } from "vitest";
import { sanitizeSkills, skillsPrompt, resolveSkills, BUILTIN_SKILLS } from "@/lib/skills";
describe("skills", () => {
  it("caps active skills at 5", () => expect(sanitizeSkills(Array.from({ length: 8 }, (_, i) => ({ title: `s${i}`, instructions: "x" })))).toHaveLength(5));
  it("truncates instructions to 2000 chars", () => expect(sanitizeSkills([{ title: "a", instructions: "x".repeat(3000) }])[0]!.instructions).toHaveLength(2000));
  it("adds instructions to the system prompt", () => expect(skillsPrompt("BASE", [{ title: "مختصر", instructions: "أجب باختصار" }])).toContain("أجب باختصار"));
  it("keeps base prompt with no skills", () => expect(skillsPrompt("BASE", [])).toBe("BASE"));
  it("ignores unknown skill ids", () => expect(resolveSkills(["missing", "builtin:concise"], BUILTIN_SKILLS).map(s => s.id)).toEqual(["builtin:concise"]));
});
