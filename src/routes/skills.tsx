import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { ArrowRight, Pencil, Trash2, Plus } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { AccountControl } from "@/components/studio/AccountControl";
import { BrandMark } from "@/components/studio/icons";
import { accountHead } from "@/lib/page-head";
import { useSkills } from "@/hooks/use-skills";
import { MAX_SKILL_CHARS } from "@/lib/skills";

export const Route = createFileRoute("/skills")({ head: () => accountHead("إدارة المهارات", "أنشئ تعليمات سياقية تغيّر أسلوب إجابات Hazem-Tech وفعّلها لكل محادثة."), component: SkillsPage });

function SkillsPage() {
  const s = useSkills();
  const [editing, setEditing] = useState<string | null>(null);
  const [form, setForm] = useState({ title: "", category: "", instructions: "" });
  const [busy, setBusy] = useState(false);
  const reset = () => { setEditing(null); setForm({ title: "", category: "", instructions: "" }); };
  return <main dir="rtl" className="min-h-dvh bg-background text-foreground">
    <header className="flex items-center gap-3 border-b px-4 py-3 sm:px-8"><Button asChild variant="ghost" size="icon" aria-label="العودة للمحادثات"><Link to="/"><ArrowRight /></Link></Button><BrandMark /><span className="flex-1 font-bold">Hazem-Tech AI Studio</span><Button asChild variant="ghost"><Link to="/tools">الأدوات</Link></Button><AccountControl /></header>
    <section className="mx-auto max-w-4xl space-y-6 px-4 py-8 sm:px-8">
      <div><h1 className="text-3xl font-bold">إدارة المهارات</h1><p className="mt-2 text-muted-foreground">المهارة تعليمات تُضاف لسياق المساعد في كل محادثة تفعّلها فيها من زر «المهارات» أعلى المحادثة. {s.signedIn ? "مهاراتك محفوظة في حسابك." : "مهاراتك محفوظة في هذا المتصفح؛ سجّل الدخول لحفظها في حسابك."}</p></div>
      <form className="space-y-3 rounded-lg border bg-surface p-5" onSubmit={async e => { e.preventDefault(); setBusy(true); try { await s.save(form, editing ?? undefined); toast.success("تم حفظ المهارة"); reset(); } catch (err) { toast.error((err as Error).message); } finally { setBusy(false); } }}>
        <h2 className="font-semibold">{editing ? "تعديل المهارة" : "مهارة جديدة"}</h2>
        <div className="grid gap-3 sm:grid-cols-2"><Input aria-label="عنوان المهارة" placeholder="العنوان" maxLength={80} required value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} /><Input aria-label="التصنيف" placeholder="التصنيف (اختياري)" maxLength={40} value={form.category} onChange={e => setForm({ ...form, category: e.target.value })} /></div>
        <textarea aria-label="تعليمات المهارة" placeholder="مثال: أجب دائماً بجدول مقارنة ثم توصية واحدة." required maxLength={MAX_SKILL_CHARS} rows={5} value={form.instructions} onChange={e => setForm({ ...form, instructions: e.target.value })} className="w-full resize-y rounded-md border bg-background p-3" />
        <div className="flex items-center gap-2"><Button type="submit" disabled={busy}><Plus className="h-4 w-4" />{editing ? "حفظ التعديل" : "إضافة"}</Button>{editing && <Button type="button" variant="ghost" onClick={reset}>إلغاء</Button>}<span className="ms-auto text-xs text-muted-foreground">{form.instructions.length}/{MAX_SKILL_CHARS}</span></div>
      </form>
      {s.error && <p role="alert" className="text-destructive">{s.error}</p>}
      {s.loading && <p role="status" className="text-muted-foreground">جارٍ تحميل المهارات…</p>}
      <ul className="space-y-3">{s.all.map(k => <li key={k.id} className="rounded-lg border p-4"><div className="flex items-start gap-2"><div className="flex-1"><h3 className="font-semibold">{k.title}</h3><p className="text-xs text-muted-foreground">{k.builtin ? "مدمجة" : "مخصصة"} · {k.category}</p></div>{!k.builtin && <><Button size="icon" variant="ghost" aria-label={`تعديل ${k.title}`} onClick={() => { setEditing(k.id); setForm({ title: k.title, category: k.category, instructions: k.instructions }); }}><Pencil className="h-4 w-4" /></Button><Button size="icon" variant="ghost" aria-label={`حذف ${k.title}`} onClick={async () => { try { await s.remove(k.id); if (editing === k.id) reset(); } catch (err) { toast.error((err as Error).message); } }}><Trash2 className="h-4 w-4" /></Button></>}</div><p className="mt-2 whitespace-pre-wrap text-sm">{k.instructions}</p></li>)}</ul>
    </section>
  </main>;
}
