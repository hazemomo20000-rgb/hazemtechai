import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { BrandMark } from "@/components/studio/icons";
import { GoogleButton } from "@/components/studio/GoogleButton";
import { useAccount } from "@/components/studio/AccountProvider";
import { accountHead } from "@/lib/page-head";

export const Route = createFileRoute("/auth")({ head: () => accountHead("تسجيل الدخول", "ادخل إلى حساب Hazem-Tech واحفظ ملفك الشخصي وتفضيلاتك."), component: AuthPage });
function AuthPage() {
  const [mode, setMode] = useState<"login" | "signup" | "forgot">("login");
  const [email, setEmail] = useState(""); const [password, setPassword] = useState(""); const [name, setName] = useState("");
  const [busy, setBusy] = useState(false); const [error, setError] = useState(""); const [notice, setNotice] = useState("");
  const { user } = useAccount(); const navigate = useNavigate();
  useEffect(() => { if (user) void navigate({ to: "/", replace: true }); }, [user, navigate]);
  async function submit() {
    setBusy(true); setError(""); setNotice("");
    try {
      if (mode === "forgot") {
        const result = await supabase.auth.resetPasswordForEmail(email.trim(), { redirectTo: `${window.location.origin}/reset-password` });
        if (result.error) throw result.error;
        setNotice("إذا كان البريد مسجلاً، ستصلك رسالة لاستعادة كلمة المرور.");
      } else if (mode === "signup") {
        const result = await supabase.auth.signUp({ email: email.trim(), password, options: { emailRedirectTo: window.location.origin, data: { display_name: name.trim() } } });
        if (result.error) throw result.error;
        setNotice("راجع بريدك لتأكيد الحساب، ثم سجّل الدخول.");
      } else {
        const result = await supabase.auth.signInWithPassword({ email: email.trim(), password });
        if (result.error) throw result.error;
        await navigate({ to: "/", replace: true });
      }
    } catch (e) { setError((e as Error).message); } finally { setBusy(false); }
  }
  async function google() {
    setBusy(true); setError("");
    try { const result = await lovable.auth.signInWithOAuth("google", { redirect_uri: window.location.origin }); if (result.error) throw result.error; if (!result.redirected) await navigate({ to: "/", replace: true }); }
    catch (e) { setError((e as Error).message); } finally { setBusy(false); }
  }
  return <main className="flex min-h-dvh items-center justify-center px-5 py-10" dir="rtl"><section className="w-full max-w-sm space-y-6">
    <div className="flex items-center gap-3"><BrandMark width={40} height={40}/><h1 className="text-xl font-bold">Hazem-Tech AI Studio</h1></div>
    <h2 className="text-2xl font-semibold">{mode === "signup" ? "إنشاء حساب" : mode === "forgot" ? "استعادة كلمة المرور" : "تسجيل الدخول"}</h2>
    {mode !== "forgot" && <GoogleButton onClick={() => void google()} disabled={busy}/>}
    <form className="space-y-4" onSubmit={(e) => { e.preventDefault(); void submit(); }}>
      {mode === "signup" && <label className="block space-y-2">الاسم<Input value={name} onChange={(e) => setName(e.target.value)} required maxLength={80} autoComplete="name"/></label>}
      <label className="block space-y-2">البريد الإلكتروني<Input dir="ltr" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required autoComplete="email"/></label>
      {mode !== "forgot" && <label className="block space-y-2">كلمة المرور<Input dir="ltr" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required minLength={8} autoComplete={mode === "signup" ? "new-password" : "current-password"}/></label>}
      {error && <p role="alert" className="break-words text-sm text-destructive">{error}</p>}{notice && <p role="status" className="text-sm text-success">{notice}</p>}
      <Button className="w-full" disabled={busy} type="submit">{busy ? "جارٍ المتابعة…" : mode === "signup" ? "إنشاء حساب" : mode === "forgot" ? "إرسال رابط الاستعادة" : "دخول"}</Button>
    </form>
    <div className="flex flex-wrap justify-between gap-2"><Button variant="link" onClick={() => { setMode(mode === "signup" ? "login" : "signup"); setNotice(""); setError(""); }}>{mode === "signup" ? "لديك حساب؟ سجّل الدخول" : "إنشاء حساب جديد"}</Button><Button variant="link" onClick={() => { setMode(mode === "forgot" ? "login" : "forgot"); setNotice(""); setError(""); }}>{mode === "forgot" ? "العودة للدخول" : "نسيت كلمة المرور؟"}</Button></div>
    <Button variant="ghost" asChild className="w-full"><Link to="/">العودة للمحادثات</Link></Button>
  </section></main>;
}