"use client";
// =============================================
// 로그인 / 회원가입 페이지
// Magic Link 이메일 방식으로 간편 로그인
// =============================================
import { useState } from "react";
import { supabase } from "@/lib/supabase";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Suspense } from "react";

function AuthPageInner() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const redirectTo = searchParams.get("redirectTo") ?? "/dashboard";

    const [showEmailForm, setShowEmailForm] = useState(false);
    const [mode, setMode] = useState<"login" | "signup">("signup");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

    async function handleEmailAuth() {
        if (!email || !password) {
            setMessage({ type: "error", text: "이메일과 비밀번호를 입력해 주세요." });
            return;
        }
        setLoading(true);
        setMessage(null);

        if (mode === "login") {
            const { error } = await supabase.auth.signInWithPassword({ email, password });
            if (error) {
                setMessage({ type: "error", text: "이메일 또는 비밀번호가 올바르지 않아요." });
            } else {
                router.push(redirectTo);
                router.refresh();
            }
        } else {
            const { error } = await supabase.auth.signUp({
                email,
                password,
                options: { emailRedirectTo: `${location.origin}/auth/callback` },
            });
            if (error) {
                setMessage({ type: "error", text: error.message });
            } else {
                setMessage({ type: "success", text: "🎉 가입 완료! 바로 로그인 되었습니다." });
                setTimeout(() => {
                    router.push(redirectTo);
                    router.refresh();
                }, 1000);
            }
        }
        setLoading(false);
    }

    async function handleGoogle() {
        await supabase.auth.signInWithOAuth({
            provider: "google",
            options: { redirectTo: `${location.origin}/auth/callback?next=${redirectTo}` },
        });
    }

    return (
        <div className="flex min-h-screen items-center justify-center bg-white px-4 relative">
            <Link
                href="/"
                className="absolute top-5 right-5 w-9 h-9 flex items-center justify-center rounded-full bg-slate-100 text-slate-500 hover:bg-slate-200 hover:text-slate-800 transition text-lg font-bold z-10"
                title="홈으로 돌아가기"
            >
                ✕
            </Link>

            <div className="w-full max-w-[400px]">
                <div className="mb-12 text-center">
                    <Link href="/">
                        <div className="mx-auto mb-6 flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-900 text-xl font-black text-white shadow-xl">
                            R
                        </div>
                    </Link>
                    <h1 className="text-[22px] font-bold text-slate-900 tracking-tight">
                        회원가입 / 로그인
                    </h1>
                </div>

                {!showEmailForm ? (
                    <div className="space-y-6">
                        <div className="flex justify-center gap-4">
                            <button
                                onClick={handleGoogle}
                                className="w-[56px] h-[56px] rounded-full bg-white border border-slate-200 flex flex-col items-center justify-center hover:bg-slate-50 transition shadow-sm hover:shadow"
                                title="Google로 계속하기"
                            >
                                <svg className="h-[22px] w-[22px]" viewBox="0 0 24 24">
                                    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                                    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                                    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                                    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                                </svg>
                            </button>
                        </div>

                        <div className="pt-4">
                            <button
                                onClick={() => setShowEmailForm(true)}
                                className="w-full py-4 rounded-xl font-bold bg-[#F4F5F7] text-[#555A64] hover:bg-[#EBECEF] transition text-[15px]"
                            >
                                이메일로 시작하기
                            </button>
                        </div>
                    </div>
                ) : (
                    <div className="space-y-6 animate-in fade-in duration-300">
                        <div className="flex justify-between items-center mb-4">
                            <h2 className="text-lg font-bold text-slate-800">이메일 {mode === "login" ? "로그인" : "회원가입"}</h2>
                            <button
                                onClick={() => setShowEmailForm(false)}
                                className="text-sm font-bold text-slate-400 hover:text-slate-600 px-3 py-1.5 rounded-lg hover:bg-slate-100 transition"
                            >
                                ✕ 돌아가기
                            </button>
                        </div>

                        <div className="space-y-4">
                            <div>
                                <label className="block text-xs font-bold text-slate-500 mb-1.5 ml-1">이메일</label>
                                <input
                                    type="email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    placeholder="이메일 입력"
                                    className="w-full px-4 py-3.5 rounded-xl border border-slate-200 bg-white text-[15px] outline-none focus:border-slate-800 focus:ring-1 focus:ring-slate-800 transition shadow-sm"
                                />
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-slate-500 mb-1.5 ml-1">비밀번호</label>
                                <input
                                    type="password"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    placeholder="비밀번호 입력 (6자리 이상)"
                                    className="w-full px-4 py-3.5 rounded-xl border border-slate-200 bg-white text-[15px] outline-none focus:border-slate-800 focus:ring-1 focus:ring-slate-800 transition shadow-sm"
                                    onKeyDown={(e) => {
                                        if (e.key === "Enter") handleEmailAuth();
                                    }}
                                />
                            </div>
                        </div>

                        {message && (
                            <div className={`p-4 rounded-xl text-sm font-bold text-center ${message.type === "success" ? "bg-emerald-50 text-emerald-600" : "bg-red-50 text-red-600"
                                }`}>
                                {message.text}
                            </div>
                        )}

                        <div className="pt-2 space-y-4">
                            <button
                                onClick={handleEmailAuth}
                                disabled={loading || !email || !password}
                                className={`w-full py-4 rounded-xl font-bold text-[15px] shadow-sm disabled:opacity-50 transition active:scale-[0.98] ${mode === "login"
                                    ? "bg-[#1E1E1E] text-white hover:bg-black"
                                    : "bg-blue-600 text-white hover:bg-blue-700"
                                    }`}
                            >
                                {loading ? "처리 중..." : mode === "login" ? "이메일로 로그인" : "회원가입 완료"}
                            </button>

                            <button
                                onClick={() => { setMode(mode === "login" ? "signup" : "login"); setMessage(null); }}
                                className="w-full text-center text-[13px] font-medium text-slate-500 hover:text-slate-800 transition underline underline-offset-4"
                            >
                                {mode === "login" ? "계정이 없으신가요? 이메일로 가입하기" : "이미 계정이 있으신가요? 로그인하기"}
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}

export default function AuthPage() {
    return (
        <Suspense fallback={<div className="flex min-h-screen items-center justify-center bg-softbg">Loading...</div>}>
            <AuthPageInner />
        </Suspense>
    );
}
