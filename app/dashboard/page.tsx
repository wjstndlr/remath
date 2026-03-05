"use client";
import { useEffect, useState, useRef } from "react";
import { supabase } from "@/lib/supabase";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { MainHeader } from "@/components/layout/MainHeader";
import type { Problem } from "@/types";

/** 과목 책장 카드 - hover 배너가 사라지지 않게 state 기반으로 관리 */
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

    const handleMouseEnter = () => {
        if (timeoutRef.current) clearTimeout(timeoutRef.current);
        setShowBanner(true);
    };

    // 마우스가 완전히 벗어날 때만(딜레이 후) 배너 숨김
    const handleMouseLeave = () => {
        timeoutRef.current = setTimeout(() => setShowBanner(false), 150);
    };

    return (
        <div
            className="flex flex-col relative"
            onMouseEnter={handleMouseEnter}
            onMouseLeave={handleMouseLeave}
        >
            {/* 책장 카드 */}
            <div
                onClick={() => onNavigate(subject)}
                className="cursor-pointer transition-all duration-500 ease-out hover:scale-105 active:scale-95"
            >
                <div className={`relative aspect-[3/4.2] w-full rounded-r-lg rounded-l-sm shadow-md ${showBanner ? 'shadow-2xl' : ''} ${colorClass}`}>
                    {/* 책 등 장식 */}
                    <div className="absolute left-0 top-0 bottom-0 w-2 bg-black/10 rounded-l-sm border-r border-white/5" />

                    {/* 표지 내용 */}
                    <div className="absolute inset-0 flex flex-col p-4 text-white">
                        <div className="text-[7px] font-black tracking-widest uppercase opacity-60 mb-1 leading-none">STRATEGY</div>
                        <h3 className="text-base md:text-lg font-black tracking-tight leading-tight">{subject}</h3>

                        <div className="mt-auto flex flex-col gap-1">
                            <div className="text-[20px] font-black leading-none">{count}</div>
                            <div className="text-[8px] font-bold opacity-70 uppercase tracking-tighter">Problems Saved</div>

                            {count > 0 && (
                                <div className="mt-2">
                                    <span className="bg-white/20 backdrop-blur-md px-2 py-1 rounded-md text-[8px] font-bold">
                                        {count}nd loop
                                    </span>
                                </div>
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

            {/* 호버 배너 - state 기반으로 표시/숨김 (mouse 이탈 딜레이 포함) */}
            <div
                className={`absolute top-full left-0 w-full z-20 pt-3 transition-all duration-200 ${showBanner ? 'opacity-100 translate-y-0 pointer-events-auto' : 'opacity-0 -translate-y-1 pointer-events-none'
                    }`}
            >
                <div className="relative">
                    {/* 말풍선 꼬리 */}
                    <div className="absolute -top-1.5 left-1/2 -translate-x-1/2 w-3 h-3 bg-slate-900 rotate-45" />
                    <button
                        onClick={(e) => {
                            e.stopPropagation();
                            onNavigate(subject);
                        }}
                        className="w-full bg-slate-900 shadow-2xl text-white text-[10px] font-black py-4 rounded-xl border border-white/10 relative z-10 hover:bg-black transition-colors"
                    >
                        {subject} 노트 보기
                    </button>
                </div>
            </div>
        </div>
    );
}

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

    // 최근 문제 슬라이더 상태
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
    }, [router, supabase]);

    // 슬라이더 페이지 계산
    const totalPages = Math.ceil(problems.length / CARDS_PER_PAGE);
    const pagedProblems = problems.slice(
        problemPage * CARDS_PER_PAGE,
        (problemPage + 1) * CARDS_PER_PAGE
    );

    return (
        <div className="flex min-h-screen flex-col bg-[var(--light-bg)]">
            <MainHeader />
            <main className="mx-auto w-full max-w-7xl flex-1 px-6 py-10 space-y-12">

                {/* 상단 메시지 */}
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
                        <div className="animate-fade-up px-2">
                            <div className="flex items-center justify-between mb-8">
                                <h2 className="text-lg font-bold text-[var(--dark-text)] flex items-center gap-2">
                                    과목별 컬렉션
                                </h2>
                                <Link href="/session/today" className="text-sm font-bold text-[var(--primary-solid)] hover:underline flex items-center group">
                                    통합 재시험 시작하기 <span className="ml-1 transition-transform group-hover:translate-x-1">→</span>
                                </Link>
                            </div>

                            {/* 5열 배치 레이아웃 */}
                            <div className="grid grid-cols-5 gap-4 md:gap-6 pb-20">
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

                        {/* 하단 섹션 - 최근 등록된 문제 (슬라이드형) */}
                        <div className="pt-12 border-t border-slate-100">
                            <div className="flex items-center justify-between mb-8">
                                <h2 className="text-lg font-bold text-[var(--dark-text)]">최근 등록된 문제</h2>
                                <Link href="/upload" className="text-sm font-bold text-[var(--secondary-text)] hover:text-[var(--dark-text)] transition">
                                    + 새 문제 등록
                                </Link>
                            </div>

                            {problems.length === 0 ? (
                                <div className="text-center py-12 bg-white rounded-3xl border border-slate-100">
                                    <p className="text-[var(--secondary-text)] font-medium text-sm mb-4">아직 보관된 문제가 없습니다.</p>
                                    <Link href="/upload" className="btn-premium inline-flex px-6 py-2.5 bg-[var(--primary-solid)] text-white rounded-xl text-sm font-bold">첫 문제 등록</Link>
                                </div>
                            ) : (
                                <div>
                                    {/* 슬라이드 카드 그리드 */}
                                    <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                                        {pagedProblems.map((p) => (
                                            <div
                                                key={p.id}
                                                className="group relative aspect-square bg-white rounded-2xl overflow-hidden border border-slate-100 hover:border-[var(--primary-solid)] transition-all cursor-pointer shadow-sm"
                                                onClick={() => router.push(`/notebook/all?focus=${p.id}`)}
                                            >
                                                <img src={p.image_url} alt="문제" className="w-full h-full object-cover group-hover:scale-105 transition duration-500" />
                                                <div className="absolute top-2 left-2 bg-white/95 px-2 py-0.5 rounded-md text-[9px] font-bold shadow-sm">
                                                    {p.status === "saved" ? "NEW" : p.status === "review" ? "REVIEW" : "MASTER"}
                                                </div>
                                            </div>
                                        ))}
                                    </div>

                                    {/* 페이지 네비게이션 (총 문제 > 5개일 때만) */}
                                    {totalPages > 1 && (
                                        <div className="flex items-center justify-center gap-4 mt-6">
                                            <button
                                                onClick={() => setProblemPage(prev => Math.max(0, prev - 1))}
                                                disabled={problemPage === 0}
                                                className="w-10 h-10 rounded-full border border-slate-200 bg-white flex items-center justify-center text-slate-600 hover:bg-slate-50 disabled:opacity-30 disabled:cursor-not-allowed transition font-bold shadow-sm text-lg"
                                                aria-label="이전 문제"
                                            >
                                                ‹
                                            </button>

                                            {/* 페이지 인디케이터 점 */}
                                            <div className="flex gap-1.5 items-center">
                                                {Array.from({ length: totalPages }).map((_, i) => (
                                                    <button
                                                        key={i}
                                                        onClick={() => setProblemPage(i)}
                                                        className={`transition-all rounded-full ${i === problemPage
                                                                ? 'w-5 h-2 bg-[var(--primary-solid)]'
                                                                : 'w-2 h-2 bg-slate-200 hover:bg-slate-300'
                                                            }`}
                                                        aria-label={`${i + 1}페이지`}
                                                    />
                                                ))}
                                            </div>

                                            <button
                                                onClick={() => setProblemPage(prev => Math.min(totalPages - 1, prev + 1))}
                                                disabled={problemPage >= totalPages - 1}
                                                className="w-10 h-10 rounded-full border border-slate-200 bg-white flex items-center justify-center text-slate-600 hover:bg-slate-50 disabled:opacity-30 disabled:cursor-not-allowed transition font-bold shadow-sm text-lg"
                                                aria-label="다음 문제"
                                            >
                                                ›
                                            </button>
                                        </div>
                                    )}

                                    {/* 문제 수 표시 */}
                                    <p className="text-center text-xs text-slate-400 font-medium mt-3">
                                        {problemPage * CARDS_PER_PAGE + 1}–{Math.min((problemPage + 1) * CARDS_PER_PAGE, problems.length)} / 총 {problems.length}문제
                                    </p>
                                </div>
                            )}
                        </div>
                    </>
                )}
            </main>
        </div>
    );
}
