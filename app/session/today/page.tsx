"use client";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { useRouter } from "next/navigation";
import { MainHeader } from "@/components/layout/MainHeader";
import { useSessionStore } from "@/store/sessionStore";
import type { Problem, UserProfile } from "@/types";

export default function SessionSetupPage() {
    const router = useRouter();
    const setProblems = useSessionStore((s) => s.setProblems);

    const [allProblems, setAllProblems] = useState<Problem[]>([]);
    const [profile, setProfile] = useState<UserProfile | null>(null);
    const [loading, setLoading] = useState(true);

    const [countOption, setCountOption] = useState<number>(15);
    const [selectedSubjects, setSelectedSubjects] = useState<string[]>([]);

    // Toast for PDF preview message
    const [toast, setToast] = useState<string | null>(null);
    const showToast = (msg: string) => {
        setToast(msg);
        window.clearTimeout((showToast as any)._t);
        (showToast as any)._t = window.setTimeout(() => setToast(null), 3000);
    };

    useEffect(() => {
        async function fetchProblems() {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) { router.push("/auth"); return; }

            const [{ data: probs }, { data: prof }] = await Promise.all([
                supabase
                    .from("problems")
                    .select("*")
                    .eq("user_id", user.id)
                    .order("created_at", { ascending: true }),
                supabase.from("profiles").select("*").eq("id", user.id).single()
            ]);

            setAllProblems((probs ?? []) as Problem[]);
            setProfile(prof as UserProfile);
            setLoading(false);
        }
        fetchProblems();
    }, [router]);

    const handleStartSession = () => {
        const now = new Date().getTime();
        const DAY = 24 * 60 * 60 * 1000;

        // 1. 제외 조건: 오늘 이미 푼 문제 제외 (최근 24시간 이내)
        // 2. 포함 조건: 상태가 saved 또는 review 인 것만 (mastered 제외)
        let target = allProblems.filter((p) => {
            if (p.status === "mastered") return false;
            if (p.last_tried_at) {
                const timeDiff = now - new Date(p.last_tried_at).getTime();
                if (timeDiff < DAY) return false;
            }
            return true;
        });

        // 커스텀 모드 필터 (과목 선택됨)
        if (selectedSubjects.length > 0) {
            target = target.filter(p => selectedSubjects.includes(p.subject));
        }

        // 셔플
        target = target.sort(() => Math.random() - 0.5);

        // 개수 조절 (Quota)
        if (countOption > 0) {
            target = target.slice(0, countOption);
        }

        if (target.length === 0) {
            alert("선택한 조건에 맞는 문제(오늘 이미 진행하지 않은 보관/다시보기 문제)가 없습니다.");
            return;
        }

        // Zustand 스토어에 문제 세팅 후 이동
        setProblems(target);
        router.push("/session/play");
    };

    const handleOpenPdf = () => {
        const reviewCount = allProblems.filter(p => p.status === "review").length;
        if (reviewCount === 0) {
            alert("현재 헷갈려요(❓) 상태인 문제가 없습니다.\n재시험을 통해 나의 약점을 먼저 발견해보세요!");
            return;
        }

        // 베타 기간: 전체 PDF 무제한 제공
        window.open(`/api/pdf?type=test&status=review`, "_blank");
    };

    if (loading) {
        return (
            <div className="flex min-h-screen flex-col bg-[#F9FAFB]">
                <MainHeader />
                <div className="flex-1 flex items-center justify-center">
                    <div className="w-10 h-10 border-4 border-slate-200 border-t-action rounded-full animate-spin" />
                </div>
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
                        <button onClick={() => router.push("/dashboard")} className="bg-slate-900 text-white px-6 py-3 rounded-full font-bold transition hover:-translate-y-0.5">오답 책장으로 돌아가기</button>
                    </div>
                </main>
            </div>
        );
    }

    const masteredCount = allProblems.filter(p => p.handwriting_url).length;
    const reviewCount = allProblems.filter(p => p.status === "review").length;
    // 24시간 내에 학습하지 않은 (오늘 학습 가능한) 문제 목록
    const availableProblemsCount = allProblems.filter(p => {
        if (p.status === "mastered") return false;
        if (!p.last_tried_at) return true;
        return (new Date().getTime() - new Date(p.last_tried_at).getTime()) >= (24 * 60 * 60 * 1000);
    }).length;

    return (
        <div className="flex min-h-screen flex-col bg-[#F9FAFB]">
            <MainHeader />

            {toast && (
                <div className="fixed top-20 left-1/2 -translate-x-1/2 z-50 px-5 py-3 rounded-2xl bg-slate-900/90 backdrop-blur-md text-white text-sm font-bold shadow-2xl animate-fade-in whitespace-nowrap">
                    {toast}
                </div>
            )}

            <main className="mx-auto w-full max-w-[1200px] flex-1 px-[var(--rm-pad-x)] py-8 lg:py-12">
                <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-6 px-2 lg:px-0">
                    <div>
                        <h1 className="text-[clamp(1.5rem,4vw,2.25rem)] font-bold tracking-tight text-slate-900 mb-2">재시험 설정</h1>
                        <p className="text-slate-500 font-medium text-[clamp(0.875rem,2vw,1rem)]">나만의 약점을 보완하고 완벽하게 정복하세요.</p>
                    </div>
                </div>

                {/* 🚀 강력한 수익화 어필 배너 (프리미엄 PDF) */}
                <div className="mb-10 px-2 lg:px-0 relative group">
                    <div className="absolute inset-0 bg-gradient-to-r from-indigo-500 via-purple-500 to-rose-500 rounded-[2rem] blur opacity-40 group-hover:opacity-60 transition duration-1000"></div>
                    <div className="relative bg-slate-900 overflow-hidden rounded-[2rem] p-8 md:p-10 shadow-2xl flex flex-col md:flex-row items-center justify-between gap-8 border border-slate-800">

                        {/* 빗살무늬 패턴 장식 */}
                        <div className="absolute top-0 right-0 -mt-20 -mr-20 w-80 h-80 bg-white opacity-5 rounded-full blur-3xl"></div>
                        <div className="absolute bottom-0 left-0 -mb-20 -ml-20 w-60 h-60 bg-indigo-500 opacity-20 rounded-full blur-3xl"></div>

                        <div className="text-left z-10 flex-1">
                            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-rose-500/20 text-rose-300 text-xs font-black tracking-widest uppercase mb-4 border border-rose-500/30">
                                <span className="w-2 h-2 rounded-full bg-rose-500 animate-pulse"></span>
                                PRO EXCLUSIVE → 베타 무료 제공 중
                            </div>
                            <h2 className="text-2xl md:text-3xl font-black text-white mb-3 tracking-tight">
                                시험 전에 <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-300 to-orange-400">헷갈린 문제</span>만 뽑아보세요!
                            </h2>
                            <p className="text-slate-300 font-medium leading-relaxed text-sm md:text-base max-w-xl">
                                어제 헷갈렸던 문항들만 쏙쏙 뽑아 <strong>실전 모의고사 형태의 PDF</strong>로 즉시 생성합니다.<br className="hidden md:block" />
                                <span className="text-indigo-300">시험 직전, 이 시험지 한 장이 등급을 바꿉니다. 개꿀팁 🍯</span>
                            </p>
                        </div>

                        <div className="z-10 w-full md:w-auto shrink-0 flex flex-col gap-3">
                            <button
                                onClick={handleOpenPdf}
                                className="w-full md:w-auto flex items-center justify-center gap-3 bg-gradient-to-br from-amber-400 to-orange-500 text-slate-900 px-8 py-5 rounded-2xl shadow-xl hover:shadow-orange-500/40 font-black text-lg transition-all hover:-translate-y-1 active:translate-y-0"
                            >
                                <span>프리미엄 시험지 인쇄 🖨️</span>
                            </button>
                            <p className="text-center text-xs text-slate-400 font-medium">
                                현재 <span className="text-white font-bold">{reviewCount}</span>개의 약점 문제가 대기 중!
                            </p>
                        </div>
                    </div>
                </div>

                <div className="flex flex-col lg:flex-row gap-8 px-2 lg:px-0 pb-10">
                    {/* 왼쪽 컬럼: 오늘의 정복 현황 (40%) */}
                    <div className="w-full lg:w-[40%] flex flex-col gap-6">
                        <div className="bg-white p-8 rounded-[2rem] border border-slate-200 shadow-sm flex-1 flex flex-col hover:border-blue-200 transition-colors">
                            <h2 className="text-xl font-bold text-slate-900 mb-6 flex items-center gap-2">
                                <span className="text-2xl">📊</span> 오늘의 정복 현황
                            </h2>

                            <div className="grid grid-cols-2 gap-4 mb-8 flex-1">
                                <div className="bg-emerald-50 rounded-3xl p-6 border border-emerald-100/50 flex flex-col justify-center items-center text-center transition-all hover:shadow-md hover:shadow-emerald-100">
                                    <div className="text-4xl lg:text-5xl font-black text-emerald-600 mb-2">{masteredCount}</div>
                                    <div className="text-xs font-bold text-emerald-800 uppercase tracking-wide opacity-80">완벽해요 ✅</div>
                                </div>
                                <div className="bg-rose-50 rounded-3xl p-6 border border-rose-100/50 flex flex-col justify-center items-center text-center relative overflow-hidden group transition-all hover:shadow-md hover:shadow-rose-100">
                                    <div className="absolute inset-0 bg-rose-500 opacity-0 group-hover:opacity-5 transition-opacity duration-300" />
                                    <div className="text-4xl lg:text-5xl font-black text-rose-600 mb-2 z-10">{reviewCount}</div>
                                    <div className="text-xs font-bold text-rose-800 uppercase tracking-wide z-10 opacity-80">헷갈려요 ❓</div>
                                </div>
                            </div>

                            <div className="mt-auto bg-slate-50 rounded-2xl p-5 border border-slate-100 flex items-start gap-3">
                                <span className="text-xl mt-0.5">💡</span>
                                <p className="text-sm font-medium text-slate-600 leading-relaxed pt-0.5">
                                    <span className="text-rose-500 font-bold">헷갈린 문제</span>는 자동으로 분류되어 우측 상단의 <strong className="text-slate-800 underline decoration-slate-300 decoration-2 underline-offset-4 pointer-events-none">PDF 시험지</strong> 생성 시 최우선 출제됩니다.
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* 오른쪽 컬럼: 훈련 설정 (60%) */}
                    <div className="w-full lg:w-[60%] flex flex-col gap-6">
                        <div className="bg-white p-8 lg:p-10 rounded-[2rem] border border-slate-200 shadow-sm flex flex-col h-full">
                            <h2 className="text-xl font-bold text-slate-900 mb-10 flex items-center gap-2">
                                <span className="text-2xl">🎯</span> 훈련 설정
                            </h2>

                            {/* 과목 집중 타겟팅 */}
                            <div className="mb-10">
                                <label className="block text-base font-bold text-slate-700 mb-4">어떤 과목을 파헤쳐 볼까요? (선택)</label>
                                <div className="flex flex-wrap gap-3">
                                    {["수학1", "수학2", "미적분", "확통", "기하"].map((sub) => {
                                        const isSelected = selectedSubjects.includes(sub);
                                        return (
                                            <button
                                                key={sub}
                                                onClick={() => {
                                                    if (isSelected) setSelectedSubjects(s => s.filter(x => x !== sub));
                                                    else setSelectedSubjects(s => [...s, sub]);
                                                }}
                                                className={`px-7 py-4.5 rounded-2xl text-[15px] font-bold transition-all border-2 min-h-[56px] min-w-[100px] active:scale-95 ${isSelected
                                                    ? "border-slate-900 bg-slate-900 text-white shadow-lg shadow-slate-900/20"
                                                    : "border-slate-200 text-slate-600 bg-white hover:border-slate-300 hover:bg-slate-50"
                                                    }`}
                                            >
                                                {sub}
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>

                            {/* 문항 수 선택 */}
                            <div className="mb-12 flex-1">
                                <div className="flex items-center justify-between mb-5">
                                    <label className="block text-base font-bold text-slate-700">몇 문제를 푸시겠어요?</label>
                                    <span className="text-xs font-black text-indigo-600 bg-indigo-50 px-3 py-1.5 rounded-lg border border-indigo-100 shadow-inner">
                                        오늘 학습 가능: {availableProblemsCount}제
                                    </span>
                                </div>
                                <div className="flex flex-col sm:flex-row gap-4">
                                    {[
                                        { val: 15, label: "15제 (가벼운 복습)" },
                                        { val: 30, label: "30제 (하드 트레이닝)" },
                                        { val: 0, label: "무제한 (전체 돌리기)" },
                                    ].map((opt) => (
                                        <button
                                            key={opt.val}
                                            onClick={() => setCountOption(opt.val)}
                                            className={`flex-1 py-7 flex flex-col items-center justify-center gap-2 rounded-2xl border-2 transition-all min-h-[110px] active:scale-[0.98] ${countOption === opt.val
                                                ? "border-action bg-blue-50/50 text-action shadow-md shadow-blue-100"
                                                : "border-slate-200 text-slate-400 bg-white hover:border-slate-300 hover:bg-slate-50"
                                                }`}
                                        >
                                            <span className="font-black text-[28px] leading-none">{opt.val === 0 ? "∞" : opt.val}</span>
                                            <span className="text-[13px] font-bold mt-1 text-center opacity-80">{opt.label}</span>
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* 하단 액션 버튼 */}
                            <div className="border-t border-slate-100 pt-8 flex flex-col sm:flex-row justify-end gap-3 mt-auto">
                                <button onClick={() => router.push("/dashboard")} className="px-8 py-5 rounded-2xl text-slate-500 font-bold hover:bg-slate-100 transition min-h-[56px] text-[15px]">
                                    취소
                                </button>
                                <button
                                    onClick={handleStartSession}
                                    className="px-12 py-5 rounded-2xl bg-action text-white font-black shadow-xl shadow-blue-500/30 hover:bg-blue-600 hover:-translate-y-0.5 active:translate-y-0 transition-all flex items-center justify-center gap-3 min-h-[56px] text-lg"
                                >
                                    <span>재시험 훈련 시작</span>
                                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="4" className="w-5 h-5 opacity-80"><polyline points="9 18 15 12 9 6"></polyline></svg>
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
}