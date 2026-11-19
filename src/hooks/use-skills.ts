import { useEffect, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAccount } from "@/components/studio/AccountProvider";
import { BUILTIN_SKILLS, GUEST_SKILLS_KEY, MAX_SKILL_CHARS, type Skill } from "@/lib/skills";

type Draft = { title: string; category: string; instructions: string };
const clean = (d: Draft) => ({ title: d.title.trim().slice(0, 80), category: (d.category.trim() || "مخصصة").slice(0, 40), instructions: d.instructions.trim().slice(0, MAX_SKILL_CHARS) });

export function useSkills() {
  const { user } = useAccount(); const qc = useQueryClient(); const uid = user?.id;
  const [guest, setGuest] = useState<Skill[]>([]);
  useEffect(() => { if (uid) return; try { const v = JSON.parse(localStorage.getItem(GUEST_SKILLS_KEY) || "[]"); setGuest(Array.isArray(v) ? v : []); } catch { setGuest([]); } }, [uid]);
  const q = useQuery({ queryKey: ["skills", uid], enabled: !!uid, queryFn: async () => {
    const r = await supabase.from("studio_skills").select("id,title,category,instructions").eq("user_id", uid!).order("updated_at", { ascending: false });
    if (r.error) throw r.error; return r.data as Skill[];
  } });
  const custom = uid ? q.data ?? [] : guest;
  const saveGuest = (list: Skill[]) => { setGuest(list); localStorage.setItem(GUEST_SKILLS_KEY, JSON.stringify(list)); };
  async function save(d: Draft, id?: string) {
    const v = clean(d); if (!v.title || !v.instructions) throw new Error("العنوان والتعليمات مطلوبة.");
    if (!uid) { saveGuest(id ? guest.map(s => s.id === id ? { ...s, ...v } : s) : [{ id: crypto.randomUUID(), ...v }, ...guest]); return; }
    const r = id ? await supabase.from("studio_skills").update({ ...v, updated_at: new Date().toISOString() }).eq("id", id).select("id").single()
      : await supabase.from("studio_skills").insert({ ...v, user_id: uid }).select("id").single();
    if (r.error) throw new Error("تعذّر حفظ المهارة."); await qc.invalidateQueries({ queryKey: ["skills", uid] });
  }
  async function remove(id: string) {
    if (!uid) { saveGuest(guest.filter(s => s.id !== id)); return; }
    const r = await supabase.from("studio_skills").delete().eq("id", id); if (r.error) throw new Error("تعذّر حذف المهارة.");
    await qc.invalidateQueries({ queryKey: ["skills", uid] });
  }
  return { all: [...BUILTIN_SKILLS, ...custom], custom, loading: !!uid && q.isLoading, error: q.error ? "تعذّر تحميل المهارات." : "", save, remove, signedIn: !!uid };
}
