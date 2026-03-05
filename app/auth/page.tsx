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

    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [mode, setMode] = useState<"login" | "signup">("login");
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
                setMessage({ type: "success", text: "📧 가입 확인 이메일을 보냈어요! 받은 편지함을 확인해 주세요." });
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
        <div className="flex min-h-screen items-center justify-center bg-softbg px-4 relative">
            {/* ✅ 우상단 X 버튼 → 홈으로 이동 */}
            <Link
                href="/"
                className="absolute top-5 right-5 w-9 h-9 flex items-center justify-center rounded-full bg-slate-100 text-slate-500 hover:bg-slate-200 hover:text-slate-800 transition text-lg font-bold z-10"
                title="홈으로 돌아가기"
            >
                ✕
            </Link>

            <div className="w-full max-w-sm">
                {/* 로고 */}
                <div className="mb-8 text-center">
                    <Link href="/">
                        <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-primary text-base font-bold text-white">
                            Re
                        </div>
                    </Link>
                    <h1 className="text-xl font-bold text-slate-900 tracking-tight">
                        {mode === "login" ? "오늘의 오답 루프 시작" : "나만의 수학 전략을 시작하세요"}
                    </h1>
                    <p className="mt-1 text-sm text-slate-500">
                        {mode === "login"
                            ? "틀린 문제를 정복하는 가장 빠른 방법"
                            : "사진 한 장으로 완성되는 나만의 오답노트"}
                    </p>
                </div>

                <div className="card p-6 space-y-4">
                    {/* Google 로그인 */}
                    <button
                        onClick={handleGoogle}
                        className="flex w-full items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-medium text-slate-700 hover:bg-slate-50 transition"
                    >
                        <svg className="h-4 w-4" viewBox="0 0 24 24">
                            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                            <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                        </svg>
                        Google로 계속하기
                    </button>

                    <div className="relative flex items-center gap-2">
                        <div className="h-px flex-1 bg-slate-200" />
                        <span className="text-xs text-slate-400">또는</span>
                        <div className="h-px flex-1 bg-slate-200" />
                    </div>

                    {/* 이메일 */}
                    <div className="space-y-3">
                        <input
                            type="email"
                            placeholder="이메일"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-action focus:ring-2 focus:ring-blue-100 transition"
                        />
                        <input
                            type="password"
                            placeholder="비밀번호 (6자리 이상)"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            onKeyDown={(e) => e.key === "Enter" && handleEmailAuth()}
                            className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-action focus:ring-2 focus:ring-blue-100 transition"
                        />
                    </div>

                    {message && (
                        <p className={`rounded-lg px-3 py-2 text-xs ${message.type === "error" ? "bg-red-50 text-red-600" : "bg-green-50 text-green-700"}`}>
                            {message.text}
                        </p>
                    )}

                    <button
                        onClick={handleEmailAuth}
                        disabled={loading}
                        className="btn-primary w-full disabled:opacity-60"
                    >
                        {loading ? "처리 중..." : mode === "login" ? "로그인" : "회원가입"}
                    </button>

                    <button
                        onClick={() => { setMode(mode === "login" ? "signup" : "login"); setMessage(null); }}
                        className="w-full text-center text-xs text-slate-500 hover:text-primary transition"
                    >
                        {mode === "login" ? "계정이 없나요? → 회원가입" : "이미 계정이 있나요? → 로그인"}
                    </button>
                </div>

                <p className="mt-4 text-center text-[11px] text-slate-400">
                    가입 시{" "}
                    <span className="underline cursor-pointer">이용약관</span> 및{" "}
                    <span className="underline cursor-pointer">개인정보처리방침</span>에 동의합니다.
                </p>
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
