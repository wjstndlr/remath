"use client";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { useRouter } from "next/navigation";
import { MainHeader } from "@/components/layout/MainHeader";
import { useSessionStore } from "@/store/sessionStore";
import type { Problem } from "@/types";

export default function SessionSetupPage() {
    const router = useRouter();
    const setProblems = useSessionStore((s) => s.setProblems);

    const [allProblems, setAllProblems] = useState<Problem[]>([]);
    const [loading, setLoading] = useState(true);

    const [mode, setMode] = useState<"smart" | "custom">("smart");
    const [countOption, setCountOption] = useState<number>(10); // 10, 20, 0(전체)
    const [selectedSubjects, setSelectedSubjects] = useState<string[]>([]);

    useEffect(() => {
        async function fetchProblems() {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) { router.push("/auth"); return; }

            const { data } = await supabase
                .from("problems")
                .select("*")
                .eq("user_id", user.id)
                .in("status", ["saved", "review"])
                .order("created_at", { ascending: true }); // 필요한 대로 정렬

            setAllProblems((data ?? []) as Problem[]);
            setLoading(false);
        }
        fetchProblems();
    }, [supabase, router]);

    const handleStartSession = () => {
        if (allProblems.length === 0) return;

        let target = [...allProblems];
        // 1. 과목 필터링 (선택된 과목이 있다면)
        if (mode === "custom" && selectedSubjects.length > 0) {
            target = target.filter(p => selectedSubjects.includes(p.subject));
        }

        // 2. 셔플 (스마트 모드는 과거 정렬 알고리즘, 여기선 일단 간단히 최신+랜덤 셔플)
        if (mode === "smart") {
            // 오래된 + 다시보기 위주로 가중치 (간단히 역순 후 랜덤 믹스)
            target = target.sort(() => Math.random() - 0.5);
        } else {
            target = target.sort(() => Math.random() - 0.5);
        }

        // 3. 개수 조절
        if (countOption > 0) {
            target = target.slice(0, countOption);
        }

        if (target.length === 0) {
            alert("선택한 조건에 맞는 문제가 없습니다.");
            return;
        }

        // Zustand 스토어에 문제 세팅 후 이동
        setProblems(target);
        router.push("/session/play");
    };

    if (loading) {
        return (
            <div className="flex min-h-screen flex-col bg-[#F9FAFB]">
                <MainHeader />
                <div className="flex-1 flex items-center justify-center">Loading...</div>
            </div>
        );
    }

    if (allProblems.length === 0) {
        return (
            <div className="flex min-h-screen flex-col bg-[#F9FAFB]">
                <MainHeader />
                <main className="mx-auto w-full max-w-3xl flex-1 px-6 py-20 text-center">
                    <div className="bg-white p-12 rounded-[2rem] shadow-sm border border-slate-200">
                        <div className="text-5xl mb-6">📭</div>
                        <h2 className="text-2xl font-bold text-slate-900 mb-2">복습할 문제가 없습니다!</h2>
                        <p className="text-slate-500 mb-8">모든 문제를 마스터했거나 아직 업로드된 오답이 없습니다.</p>
                        <button onClick={() => router.push("/dashboard")} className="bg-slate-900 text-white px-6 py-3 rounded-full font-bold">오답 책장으로 돌아가기</button>
                    </div>
                </main>
            </div>
        );
    }

    return (
        <div className="flex min-h-screen flex-col bg-[#F9FAFB]">
            <MainHeader />
            <main className="mx-auto w-full max-w-4xl flex-1 px-[var(--rm-pad-x)] py-[var(--rm-pad-y)]">
                <div className="mb-10">
                    <h1 className="text-[clamp(1.5rem,4vw,2.25rem)] font-bold tracking-tight text-slate-900 mb-2">재시험 설정</h1>
                    <p className="text-slate-500 font-medium text-[clamp(0.875rem,2vw,1rem)]">유연하게 오늘의 복습(Re-test) 세션을 구성해보세요.</p>
                </div>

                <div className="grid md:grid-cols-2 gap-[clamp(1rem,2vw,1.5rem)] mb-10">
                    {/* 모드 선택: 스마트 추천 vs 커스텀 */}
                    <button
                        onClick={() => setMode("smart")}
                        className={`p-[clamp(1.5rem,4vw,2rem)] rounded-[clamp(1.5rem,2.5vw,2rem)] border-2 text-left transition-all min-h-[180px] ${mode === "smart" ? "border-action bg-blue-50/50 shadow-md" : "border-slate-200 bg-white hover:border-slate-300"
                            }`}
                    >
                        <div className="w-12 h-12 bg-white rounded-2xl shadow-sm flex items-center justify-center text-2xl mb-4 border border-slate-100">🧠</div>
                        <h3 className="text-lg font-bold text-slate-900 mb-2">스마트 추천</h3>
                        <p className="text-sm text-slate-500 leading-relaxed font-medium">
                            에빙하우스 망각곡선 및 이전 <b>다시보기</b> 횟수를 기반으로 가장 복습이 시급한 문제를 자동으로 추출합니다.
                        </p>
                    </button>

                    <button
                        onClick={() => setMode("custom")}
                        className={`p-[clamp(1.5rem,4vw,2rem)] rounded-[clamp(1.5rem,2.5vw,2rem)] border-2 text-left transition-all min-h-[180px] ${mode === "custom" ? "border-slate-900 bg-slate-50 shadow-md" : "border-slate-200 bg-white hover:border-slate-300"
                            }`}
                    >
                        <div className="w-12 h-12 bg-white border border-slate-100 rounded-2xl shadow-sm flex items-center justify-center text-2xl mb-4">🎯</div>
                        <h3 className="text-lg font-bold text-slate-900 mb-2">과목 집중 타겟팅</h3>
                        <p className="text-sm text-slate-500 leading-relaxed font-medium">
                            특정 과목의 문제만 모아서 집중적으로 훈련합니다. 약점 보완에 탁월합니다.
                        </p>
                    </button>
                </div>

                {/* 커스텀 설정 항목 */}
                <div className={`transition-all duration-500 overflow-hidden ${mode === "custom" ? "opacity-100 h-auto mb-10" : "opacity-50 h-0"}`}>
                    <div className="bg-white p-[clamp(1.5rem,4vw,2rem)] rounded-[clamp(1.5rem,2.5vw,2rem)] border border-slate-200 shadow-sm">
                        <label className="block text-sm font-bold text-slate-700 mb-5">어떤 과목을 파헤쳐 볼까요?</label>
                        <div className="flex flex-wrap gap-2.5">
                            {["수학1", "수학2", "미적분", "확통", "기하"].map((sub) => {
                                const isSelected = selectedSubjects.includes(sub);
                                return (
                                    <button
                                        key={sub}
                                        onClick={() => {
                                            if (isSelected) setSelectedSubjects(s => s.filter(x => x !== sub));
                                            else setSelectedSubjects(s => [...s, sub]);
                                        }}
                                        className={`px-6 py-3 rounded-xl text-sm font-bold transition border-2 min-h-[44px] ${isSelected ? "border-slate-900 bg-slate-900 text-white" : "border-slate-200 text-slate-500 bg-white hover:border-slate-300"
                                            }`}
                                    >
                                        {sub}
                                    </button>
                                );
                            })}
                        </div>
                    </div>
                </div>

                {/* 문항 수 선택 */}
                <div className="bg-white p-[clamp(1.5rem,4vw,2rem)] rounded-[clamp(1.5rem,2.5vw,2rem)] border border-slate-200 shadow-sm mb-10">
                    <div className="flex items-center justify-between mb-6">
                        <label className="block text-sm font-bold text-slate-700">몇 문제를 푸시겠어요?</label>
                        <span className="text-[10px] font-black text-action bg-blue-50 px-2.5 py-1 rounded-md border border-blue-100">
                            리뷰 대상: {allProblems.length}제
                        </span>
                    </div>

                    <div className="flex flex-col sm:flex-row gap-4">
                        {[
                            { val: 10, label: "10제 (부담없이)" },
                            { val: 20, label: "20제 (하프 모의고사)" },
                            { val: 0, label: "무제한 (전체 돌리기)" },
                        ].map((opt) => (
                            <button
                                key={opt.val}
                                onClick={() => setCountOption(opt.val)}
                                className={`flex-1 py-5 flex flex-col items-center justify-center gap-1 rounded-2xl border-2 transition min-h-[92px] ${countOption === opt.val ? "border-action bg-blue-50 text-action" : "border-slate-200 text-slate-400 bg-white hover:border-slate-300"
                                    }`}
                            >
                                <span className="font-black text-xl leading-none">{opt.val === 0 ? "∞" : opt.val}</span>
                                <span className="text-[11px] font-bold mt-1 opacity-80">{opt.label}</span>
                            </button>
                        ))}
                    </div>
                </div>

                <div className="border-t border-slate-200 pt-10 flex flex-col sm:flex-row justify-end gap-3">
                    <button onClick={() => router.push("/dashboard")} className="px-8 py-4 rounded-xl text-slate-500 font-bold hover:bg-slate-100 transition min-h-[44px]">
                        취소
                    </button>
                    <button
                        onClick={handleStartSession}
                        className="px-10 py-4 rounded-xl bg-action text-white font-bold shadow-lg shadow-blue-500/30 hover:bg-blue-600 hover:-translate-y-0.5 active:translate-y-0 transition-all flex items-center justify-center gap-2 min-h-[56px]"
                    >
                        <span>재시험 훈련 시작</span>
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" className="w-5 h-5"><polyline points="9 18 15 12 9 6"></polyline></svg>
                    </button>
                </div>
            </main>
        </div>
    );
}