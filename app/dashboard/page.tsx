"use client";
import { useEffect, useState, useRef } from "react";
import { supabase } from "@/lib/supabase";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { MainHeader } from "@/components/layout/MainHeader";
import type { Problem } from "@/types";

// ============================================================
// SubjectBookCard — 탭 터치 대응
// ============================================================
function SubjectBookCard({
    subject,
    count,
    newlyAdded,
    colorClass,
    onNavigate,
}: {
    subject: string;
    count: number;
    newlyAdded: number;
    colorClass: string;
    onNavigate: (subject: string) => void;
}) {
    const [showBanner, setShowBanner] = useState(false);
    const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    // ✅ 탭/클릭 토글 방식 (hover가 없는 태블릿 대응)
    const handleToggle = () => {
        if (showBanner) {
            // 배너가 보이는 상태에서 다시 탭 → 바로 이동
            onNavigate(subject);
        } else {
            // 첫 탭 → 배너 표시
            setShowBanner(true);
            if (timeoutRef.current) clearTimeout(timeoutRef.current);
            timeoutRef.current = setTimeout(() => setShowBanner(false), 5000);
        }
    };

    const handleMouseEnter = () => {
        if (timeoutRef.current) clearTimeout(timeoutRef.current);
        setShowBanner(true);
    };
    const handleMouseLeave = () => {
        timeoutRef.current = setTimeout(() => setShowBanner(false), 150);
    };

    return (
        <div className={`flex flex-col relative ${showBanner ? 'z-30' : 'z-10'}`} onMouseEnter={handleMouseEnter} onMouseLeave={handleMouseLeave}>
            <div onClick={handleToggle} className="cursor-pointer transition-all duration-500 ease-out hover:scale-105 active:scale-95">
                <div className={`relative aspect-[3/4.2] w-full rounded-r-lg rounded-l-sm shadow-md ${showBanner ? 'shadow-2xl' : ''} ${colorClass}`}>
                    <div className="absolute left-0 top-0 bottom-0 w-2 bg-black/10 rounded-l-sm border-r border-white/5" />
                    <div className="absolute inset-0 flex flex-col p-4 text-white">
                        <div className="text-[7px] font-black tracking-widest uppercase opacity-60 mb-1 leading-none">STRATEGY</div>
                        <h3 className="text-base md:text-lg font-black tracking-tight leading-tight">{subject}</h3>

                        <div className="mt-auto flex flex-col gap-1">
                            {count === 0 ? (
                                <div
                                    onClick={(e) => { e.stopPropagation(); onNavigate(subject); }}
                                    className="mt-2 bg-white/20 backdrop-blur-md px-2 py-2 rounded-lg text-[9px] font-black text-center border border-white/30 hover:bg-white/30 transition cursor-pointer"
                                >
                                    첫 오답을 등록해보세요! 🚀
                                </div>
                            ) : (
                                <>
                                    <div className="text-[20px] font-black leading-none">{count}</div>
                                    <div className="text-[8px] font-bold opacity-70 uppercase tracking-tighter">Problems Saved</div>
                                    <div className="mt-2">
                                        <span className="bg-white/20 backdrop-blur-md px-2 py-1 rounded-md text-[8px] font-bold">
                                            {count}nd loop
                                        </span>
                                    </div>
                                </>
                            )}
                        </div>
                    </div>

                    {newlyAdded > 0 && (
                        <div className="absolute -top-2 -right-2 bg-rose-500 text-white text-[9px] font-black px-2 py-1 rounded-full border-2 border-white shadow-lg animate-bounce">
                            {newlyAdded}
                        </div>
                    )}
                </div>
            </div>

            {/* 배너 (hover + tap 공용) */}
            <div className={`absolute top-full left-0 w-full z-20 pt-3 transition-all duration-200 ${showBanner ? 'opacity-100 translate-y-0 pointer-events-auto' : 'opacity-0 -translate-y-1 pointer-events-none'}`}>
                <div className="relative">
                    <div className="absolute -top-1.5 left-1/2 -translate-x-1/2 w-3 h-3 bg-slate-900 rotate-45" />
                    <button
                        onClick={(e) => { e.stopPropagation(); onNavigate(subject); }}
                        className="w-full bg-slate-900 shadow-2xl text-white text-[10px] font-black py-4 rounded-xl border border-white/10 relative z-10 hover:bg-black transition-colors"
                    >
                        {subject} 노트 보기
                    </button>
                </div>
            </div>
        </div>
    );
}

// ============================================================
// ProblemCard — 완성/미완성 차별화 + 미완성 펄스
// ============================================================
function ProblemCard({ p, onClick }: { p: Problem; onClick: () => void }) {
    const isComplete = Boolean(p.handwriting_url);

    return (
        <div
            className={`group relative aspect-square bg-white rounded-2xl overflow-hidden border-2 transition-all cursor-pointer shadow-sm
                ${isComplete
                    ? "border-amber-400 shadow-amber-200/50"
                    : "border-slate-100 hover:border-blue-300"
                }`}
            onClick={onClick}
            style={isComplete ? {
                boxShadow: "0 0 0 2px #fbbf24, 0 4px 24px rgba(245,158,11,0.18)"
            } : {}}
        >
            {/* 썸네일 */}
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
                src={p.image_url}
                alt="문제"
                className={`w-full h-full object-cover transition duration-500 ${isComplete ? "" : "grayscale-[0.4]"}`}
            />

            {/* 완성 카드 */}
            {isComplete && (
                <div className="absolute inset-0 pointer-events-none">
                    <div className="absolute inset-0 bg-gradient-to-br from-amber-400/10 via-transparent to-yellow-400/10" />
                    <div className="absolute top-2 right-2 bg-amber-400 text-amber-900 text-[9px] font-black px-2 py-0.5 rounded-full shadow-md">
                        ✨ 완성
                    </div>
                </div>
            )}

            {/* ✅ 미완성 카드 — 상시 "해설 작성 필요" 배지 + 부드러운 펄스 테두리 */}
            {!isComplete && (
                <>
                    {/* 상시 보이는 미완성 오버레이 */}
                    <div className="absolute inset-0 bg-gradient-to-t from-slate-900/70 via-transparent to-transparent pointer-events-none" />
                    <div className="absolute bottom-2 left-1/2 -translate-x-1/2 bg-white/95 text-slate-700 text-[10px] font-black px-3 py-1.5 rounded-lg shadow-md whitespace-nowrap pointer-events-none">
                        ✏️ 해설 작성 필요
                    </div>
                    {/* ✅ 부드러운 펄스 테두리 (과하지 않게) */}
                    <div className="absolute inset-0 rounded-2xl border-2 border-blue-400/40 animate-pulse pointer-events-none" />
                </>
            )}

            {/* 상태 배지 */}
            <div className="absolute top-2 left-2 bg-white/95 px-2 py-0.5 rounded-md text-[9px] font-bold shadow-sm">
                {p.status === "saved" ? "NEW" : p.status === "review" ? "REVIEW" : "MASTER"}
            </div>
        </div>
    );
}

// ============================================================
// Main Dashboard
// ============================================================
export default function DashboardPage() {
    const router = useRouter();
    const [problems, setProblems] = useState<Problem[]>([]);
    const [loading, setLoading] = useState(true);

    const SUBJECTS = ["수학1", "수학2", "미적분", "확통", "기하"];
    const BOOK_COLORS: Record<string, string> = {
        수학1: "bg-gradient-to-br from-indigo-500 to-blue-600",
        수학2: "bg-gradient-to-br from-rose-500 to-pink-600",
        미적분: "bg-gradient-to-br from-emerald-500 to-teal-600",
        확통: "bg-gradient-to-br from-amber-500 to-orange-600",
        기하: "bg-gradient-to-br from-violet-600 to-purple-800",
    };

    const CARDS_PER_PAGE = 5;
    const [problemPage, setProblemPage] = useState(0);

    useEffect(() => {
        async function load() {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) { router.push("/auth"); return; }

            const { data } = await supabase
                .from("problems")
                .select("*")
                .eq("user_id", user.id)
                .order("created_at", { ascending: false });

            setProblems((data ?? []) as Problem[]);
            setLoading(false);
        }
        load();
    }, [router]);

    // ✅ 통계: 목표 = 전체 등록 문제 수
    const totalProblems = problems.length;
    const completedCount = problems.filter(p => Boolean(p.handwriting_url)).length;
    const gaugePercent = totalProblems > 0 ? Math.min(100, Math.round((completedCount / totalProblems) * 100)) : 0;

    const totalPages = Math.ceil(problems.length / CARDS_PER_PAGE);
    const pagedProblems = problems.slice(
        problemPage * CARDS_PER_PAGE,
        (problemPage + 1) * CARDS_PER_PAGE
    );

    return (
        <div className="flex min-h-screen flex-col bg-[var(--light-bg)]">
            <MainHeader />
            <main className="mx-auto w-full max-w-7xl flex-1 px-6 py-10 space-y-12">
                <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 px-2">
                    <div>
                        <h1 className="text-2xl font-bold tracking-tight text-[var(--dark-text)]">나의 오답 책장</h1>
                        <p className="text-[var(--secondary-text)] mt-1 font-medium text-sm">복습한 오답들이 모여 나만의 전략이 됩니다.</p>
                    </div>
                </div>

                {loading ? (
                    <div className="flex justify-center py-20">
                        <div className="w-8 h-8 border-3 border-slate-200 border-t-[var(--primary-solid)] rounded-full animate-spin" />
                    </div>
                ) : (
                    <>
                        {/* ✅ 진척도 게이지: 전체 등록 문제 중 해설 완료 비율 */}
                        {totalProblems > 0 && (
                            <div className="px-2">
                                <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5">
                                    <div className="flex items-center justify-between mb-3">
                                        <div>
                                            <div className="text-sm font-black text-slate-800">
                                                🎯 오늘의 목표: 오답노트 {totalProblems}문제 완성
                                            </div>
                                            <div className="text-xs text-slate-500 mt-0.5">
                                                해설 완료 = 손글씨 풀이 작성 후 저장
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <div className="text-2xl font-black text-slate-900">
                                                {completedCount}
                                                <span className="text-slate-400 text-base font-bold">/{totalProblems}</span>
                                            </div>
                                            <div className="text-[10px] text-slate-500 font-medium">해설 완료</div>
                                        </div>
                                    </div>

                                    <div className="w-full bg-slate-100 rounded-full h-3 overflow-hidden">
                                        <div
                                            className="h-full rounded-full transition-all duration-700 bg-gradient-to-r from-amber-400 to-yellow-400"
                                            style={{ width: `${gaugePercent}%` }}
                                        />
                                    </div>
                                    <div className="flex justify-between text-[10px] text-slate-400 font-medium mt-1.5">
                                        <span>{completedCount}문제 완료</span>
                                        <span>목표 {totalProblems}문제</span>
                                    </div>

                                    {completedCount >= totalProblems && totalProblems > 0 && (
                                        <div className="mt-3 text-center text-sm font-black text-amber-600 animate-pulse">
                                            🎉 모든 문제 해설 완성! 대단해요!
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}

                        <div className="animate-fade-up px-2">
                            <div className="flex items-center justify-between mb-4">
                                <h2 className="text-lg font-bold text-[var(--dark-text)] flex items-center gap-2">
                                    과목별 컬렉션
                                </h2>
                            </div>

                            {/* 🔥 통합 재시험 배너 (터치 친화적) */}
                            <Link href="/session/today" className="block w-full mb-8 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-2xl p-4 shadow-lg hover:shadow-[0_8px_30px_rgb(79,70,229,0.3)] transition-all transform hover:-translate-y-0.5 group">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-4">
                                        <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center text-2xl shadow-inner">🔥</div>
                                        <div>
                                            <div className="font-black text-lg">통합 재시험 시작하기</div>
                                            <div className="text-xs text-blue-100 font-medium mt-0.5">저장된 모든 오답을 섞어서 다시 풀어보세요</div>
                                        </div>
                                    </div>
                                    <div className="w-10 h-10 bg-white/10 rounded-full flex items-center justify-center font-bold transition-transform group-hover:translate-x-1 border border-white/20">→</div>
                                </div>
                            </Link>

                            <div className="grid grid-cols-5 gap-4 md:gap-6 pb-12">
                                {SUBJECTS.map((subject) => {
                                    const subjectProbs = problems.filter(p => p.subject === subject);
                                    const count = subjectProbs.length;
                                    const newlyAdded = subjectProbs.filter(p => p.status === "saved").length;

                                    return (
                                        <SubjectBookCard
                                            key={subject}
                                            subject={subject}
                                            count={count}
                                            newlyAdded={newlyAdded}
                                            colorClass={BOOK_COLORS[subject]}
                                            onNavigate={(s) => router.push(`/notebook/${encodeURIComponent(s)}`)}
                                        />
                                    );
                                })}
                            </div>
                        </div>

                        {/* 최근 등록 문제 */}
                        <div className="pt-8 border-t border-slate-100">
                            <div className="flex items-center justify-between mb-4 mt-4">
                                <h2 className="text-lg font-bold text-[var(--dark-text)]">최근 등록된 문제</h2>
                            </div>

                            {/* 📸 새 문제 등록 배너 (터치 친화적) */}
                            <Link href="/upload" className="block w-full mb-8 bg-slate-900 text-white rounded-2xl p-4 shadow-xl hover:shadow-[0_8px_30px_rgb(0,0,0,0.2)] transition-all transform hover:-translate-y-0.5 group">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-4">
                                        <div className="w-12 h-12 bg-white/10 rounded-xl flex items-center justify-center text-2xl border border-white/20 shadow-inner">📸</div>
                                        <div>
                                            <div className="font-black text-base">새로운 오답 등록하기</div>
                                            <div className="text-xs text-slate-300 font-medium mt-0.5">틀린 문제를 사진으로 찍어 오답노트로 만드세요</div>
                                        </div>
                                    </div>
                                    <div className="w-10 h-10 bg-white/10 rounded-full flex items-center justify-center font-bold text-xl transition-transform group-hover:scale-110 border border-white/20">+</div>
                                </div>
                            </Link>

                            {problems.length === 0 ? (
                                <div className="text-center py-12 bg-white rounded-3xl border border-slate-100">
                                    <p className="text-[var(--secondary-text)] font-medium text-sm mb-4">아직 보관된 문제가 없습니다.</p>
                                    <Link href="/upload" className="btn-premium inline-flex px-6 py-2.5 bg-[var(--primary-solid)] text-white rounded-xl text-sm font-bold">첫 문제 등록</Link>
                                </div>
                            ) : (
                                <div>
                                    <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                                        {pagedProblems.map((p) => (
                                            <ProblemCard
                                                key={p.id}
                                                p={p}
                                                onClick={() => {
                                                    if (!p.handwriting_url) {
                                                        router.push(`/problem/${p.id}`);
                                                    } else {
                                                        router.push(`/notebook/${encodeURIComponent(p.subject)}?focus=${p.id}`);
                                                    }
                                                }}
                                            />
                                        ))}
                                    </div>

                                    {totalPages > 1 && (
                                        <div className="flex items-center justify-center gap-4 mt-6">
                                            <button
                                                onClick={() => setProblemPage(prev => Math.max(0, prev - 1))}
                                                disabled={problemPage === 0}
                                                className="w-10 h-10 rounded-full border border-slate-200 bg-white flex items-center justify-center text-slate-600 hover:bg-slate-50 disabled:opacity-30 disabled:cursor-not-allowed transition font-bold shadow-sm text-lg"
                                            >‹</button>
                                            <div className="flex gap-1.5 items-center">
                                                {Array.from({ length: totalPages }).map((_, i) => (
                                                    <button key={i} onClick={() => setProblemPage(i)} className={`transition-all rounded-full ${i === problemPage ? 'w-5 h-2 bg-[var(--primary-solid)]' : 'w-2 h-2 bg-slate-200 hover:bg-slate-300'}`} />
                                                ))}
                                            </div>
                                            <button
                                                onClick={() => setProblemPage(prev => Math.min(totalPages - 1, prev + 1))}
                                                disabled={problemPage >= totalPages - 1}
                                                className="w-10 h-10 rounded-full border border-slate-200 bg-white flex items-center justify-center text-slate-600 hover:bg-slate-50 disabled:opacity-30 disabled:cursor-not-allowed transition font-bold shadow-sm text-lg"
                                            >›</button>
                                        </div>
                                    )}

                                    <p className="text-center text-xs text-slate-400 font-medium mt-3">
                                        {problemPage * CARDS_PER_PAGE + 1}–{Math.min((problemPage + 1) * CARDS_PER_PAGE, problems.length)} / 총 {problems.length}문제
                                    </p>

                                    <div className="flex items-center justify-center gap-5 mt-4 text-[11px] text-slate-500">
                                        <div className="flex items-center gap-1.5">
                                            <div className="w-3 h-3 rounded bg-amber-400" />
                                            <span>해설 완성 → 오답노트 뷰어</span>
                                        </div>
                                        <div className="flex items-center gap-1.5">
                                            <div className="w-3 h-3 rounded bg-slate-300 border border-blue-400/40" />
                                            <span>해설 미완성 → 해설 작성</span>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    </>
                )}
            </main>
        </div>
    );
}
