"use client";
// =============================================
// 요금제 페이지 (Stripe 결제 연동)
// =============================================
import { useState } from "react";
import { supabase } from "@/lib/supabase";
import { MainHeader } from "@/components/layout/MainHeader";
import { SectionTitle } from "@/components/ui/SectionTitle";
import Link from "next/link";

export default function PlansPage() {
    const [loading, setLoading] = useState(false);

    async function handleProSubscribe() {
        setLoading(true);
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) {
                window.location.href = "/auth?redirectTo=/plans";
                return;
            }

            const res = await fetch("/api/stripe/checkout", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ userId: user.id, email: user.email }),
            });
            const { url, error } = await res.json();
            if (error) throw new Error(error);
            window.location.href = url;
        } catch (e) {
            alert("결제 페이지 연결에 실패했어요. 잠시 후 다시 시도해 주세요.");
        } finally {
            setLoading(false);
        }
    }

    return (
        <div className="flex min-h-screen flex-col">
            <MainHeader />
            <main className="mx-auto w-full max-w-4xl flex-1 px-4 py-12 space-y-10">
                <SectionTitle
                    eyebrow="Pricing"
                    title="지금 무료로 시작, 필요할 때만 업그레이드"
                    description="모든 핵심 기능은 무료입니다. PDF 출력과 심화 분석이 필요할 때 Pro로 전환하세요."
                />

                <div className="grid gap-5 md:grid-cols-2">
                    {/* 무료 */}
                    <div className="card flex flex-col gap-5 p-6">
                        <div>
                            <p className="text-xs font-semibold uppercase tracking-widest text-slate-400">Free</p>
                            <p className="mt-2 text-4xl font-bold text-primary">
                                ₩0
                                <span className="text-base font-normal text-slate-400"> / 평생</span>
                            </p>
                        </div>
                        <ul className="space-y-2 text-sm text-slate-700">
                            {[
                                "매일 10문제 재시험 루프",
                                "오답 사진 무제한 업로드",
                                "과목 · 단원 태그 분류",
                                "드로잉 캔버스 (Konva.js)",
                                "기본 단원별 약점 그래프",
                            ].map((f) => (
                                <li key={f} className="flex items-center gap-2">
                                    <span className="text-success">✓</span> {f}
                                </li>
                            ))}
                        </ul>
                        <Link href="/auth" className="btn-ghost mt-auto w-full text-center">
                            무료로 시작하기
                        </Link>
                    </div>

                    {/* Pro */}
                    <div className="card relative flex flex-col gap-5 border-2 border-action p-6 shadow-lg shadow-blue-50">
                        <div className="absolute -top-3 right-5 rounded-full bg-action px-4 py-1 text-[11px] font-semibold uppercase tracking-widest text-white">
                            추천
                        </div>
                        <div>
                            <p className="text-xs font-semibold uppercase tracking-widest text-action">Pro</p>
                            <p className="mt-2 text-4xl font-bold text-primary">
                                ₩9,900
                                <span className="text-base font-normal text-slate-400"> / 월</span>
                            </p>
                            <p className="mt-1 text-xs text-slate-400">7일 무료체험 · 언제든 해지</p>
                        </div>
                        <ul className="space-y-2 text-sm text-slate-700">
                            {[
                                "무료 플랜의 모든 기능",
                                "평가원 스타일 오답 시험지 PDF 무제한",
                                "단원 · 난이도별 심화 약점 리포트",
                                "학부모용 주간 리포트 (이메일)",
                                "AI 취약 단원 심층 분석",
                                "향후 모든 프리미엄 기능",
                            ].map((f) => (
                                <li key={f} className="flex items-center gap-2">
                                    <span className="text-action">✓</span> {f}
                                </li>
                            ))}
                        </ul>
                        <button
                            onClick={handleProSubscribe}
                            disabled={loading}
                            className="btn-primary mt-auto w-full disabled:opacity-60"
                        >
                            {loading ? "연결 중..." : "7일 무료체험 시작하기"}
                        </button>
                        <p className="text-center text-[11px] text-slate-400">
                            신용카드 즉시 청구 없음 · 재결제 3일 전 이메일 알림
                        </p>
                    </div>
                </div>

                {/* FAQ */}
                <div className="card p-6 space-y-4">
                    <h2 className="text-base font-semibold text-primary">자주 묻는 질문</h2>
                    {[
                        { q: "무료 플랜에서 업로드할 수 있는 오답 수에 제한이 있나요?", a: "없습니다. 무제한으로 올리실 수 있어요." },
                        { q: "PDF는 어떤 형식으로 생성되나요?", a: "평가원 수능 시험지 스타일(A4, 2단 배치)로 생성됩니다. Pro 구독 후 다운로드할 수 있어요." },
                        { q: "해지하면 데이터는 어떻게 되나요?", a: "등록한 오답 사진과 데이터는 영구 보존됩니다. 단, Pro 기능만 비활성화됩니다." },
                    ].map((item) => (
                        <div key={item.q} className="border-b border-slate-100 pb-4 last:border-0 last:pb-0">
                            <p className="text-sm font-medium text-primary">{item.q}</p>
                            <p className="mt-1 text-sm text-slate-500">{item.a}</p>
                        </div>
                    ))}
                </div>
            </main>
        </div>
    );
}
