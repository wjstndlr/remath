"use client";
import { useEffect, useState, useRef } from "react";
import dynamic from "next/dynamic";
import { supabase } from "@/lib/supabase";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { useSessionStore } from "@/store/sessionStore";
import type { Problem } from "@/types";

const DrawingCanvas = dynamic(
    () =>
        import("@/components/session/DrawingCanvas").then((m) => ({
            default: m.DrawingCanvas,
        })),
    { ssr: false }
);

export default function PlaySessionPage() {
    const router = useRouter();
    const {
        problems,
        currentIndex,
        results,
        activeTab,
        isFinished,
        goNext,
        goPrev,
        markResult,
        setTab,
    } = useSessionStore();

    const [zoom, setZoom] = useState(1);
    const [memo, setMemo] = useState("");
    const panelRef = useRef<HTMLDivElement>(null);
    const [canvasSize, setCanvasSize] = useState({ w: 400, h: 500 });
    const [isClientOk, setIsClientOk] = useState(false);

    useEffect(() => {
        // Zustand store가 비어있다면 설정 페이지로 돌려보냄 (새로고침 방어)
        if (problems.length === 0) {
            router.replace("/session/today");
            return;
        }
        setIsClientOk(true);

        function resize() {
            if (panelRef.current) {
                setCanvasSize({
                    w: panelRef.current.offsetWidth,
                    h: panelRef.current.offsetHeight,
                });
            }
        }
        resize();
        window.addEventListener("resize", resize);
        return () => window.removeEventListener("resize", resize);
    }, [problems, router]);

    async function handleMark(result: "mastered" | "review") {
        const problem = problems[currentIndex];
        if (!problem) return;

        markResult(problem.id, result);
        const nextSolveCount = (problem.solve_count ?? 0) + 1;

        await supabase
            .from("problems")
            .update({
                status: result,
                solve_count: nextSolveCount,
                last_tried_at: new Date().toISOString(),
            })
            .eq("id", problem.id);

        goNext();
    }

    if (!isClientOk) return null; // 라우팅 전 블랭크

    if (isFinished) {
        const solved = Object.values(results).filter((r) => r === "mastered").length;
        const review = Object.values(results).filter((r) => r === "review").length;
        return (
            <div className="flex min-h-screen items-center justify-center bg-slate-50 px-[var(--rm-pad-x)]">
                <div className="bg-white max-w-sm w-full p-[clamp(1.5rem,4vw,2.5rem)] text-center space-y-8 rounded-[clamp(1.5rem,3vw,2.5rem)] shadow-2xl border border-slate-100">
                    <div className="text-6xl animate-bounce">🎉</div>
                    <div>
                        <h2 className="text-[clamp(1.5rem,3vw,2rem)] font-black text-slate-900 mb-2">세션 완료!</h2>
                        <p className="text-slate-500 font-medium">선택하신 문제들의 복습이 끝났습니다.</p>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div className="rounded-2xl bg-green-50 border border-green-100 p-5 shadow-inner">
                            <p className="text-3xl font-black text-green-600 mb-1">{solved}</p>
                            <p className="text-[11px] font-bold text-green-800">완벽히 이해함</p>
                        </div>
                        <div className="rounded-2xl bg-rose-50 border border-rose-100 p-5 shadow-inner">
                            <p className="text-3xl font-black text-rose-600 mb-1">{review}</p>
                            <p className="text-[11px] font-bold text-rose-800">다시보기</p>
                        </div>
                    </div>
                    <div className="pt-4">
                        <button onClick={() => router.push("/dashboard")} className="w-full bg-slate-900 text-white rounded-xl py-4 font-bold hover:bg-slate-800 transition min-h-[56px] shadow-lg shadow-slate-900/10">
                            나의 오답 책장으로
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    const problem = problems[currentIndex];
    const progress = ((currentIndex + 1) / problems.length) * 100;

    return (
        <div className="flex h-screen flex-col overflow-hidden bg-slate-100">
            {/* 상단 진행 상태 헤더 */}
            <div className="flex items-center gap-4 bg-white/80 backdrop-blur-md px-6 py-4 shadow-sm z-30 border-b border-slate-200">
                <button
                    onClick={() => router.push("/session/today")}
                    className="flex h-11 w-11 items-center justify-center rounded-full bg-slate-100 text-slate-500 hover:bg-slate-200 transition shrink-0"
                >
                    ✕
                </button>
                <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2 min-w-0">
                            <span className="bg-blue-50 text-action px-2.5 py-1 rounded-full text-[10px] font-black border border-blue-100 shrink-0">
                                {currentIndex + 1} / {problems.length}
                            </span>
                            <span className="text-[clamp(12px,1.5vw,14px)] font-bold text-slate-700 truncate">
                                {problem.subject} · {problem.unit_tags[0] || '기타'}
                            </span>
                        </div>
                        <span className="text-xs font-bold text-yellow-500 shrink-0 ml-2">★ {problem.importance || 2}</span>
                    </div>
                    <div className="h-2 rounded-full bg-slate-100 overflow-hidden">
                        <div
                            className="h-full bg-gradient-to-r from-blue-500 to-cyan-400 rounded-full transition-all duration-500"
                            style={{ width: `${progress}%` }}
                        />
                    </div>
                </div>
            </div>

            {/* 2-패널 본문 */}
            <div className="flex flex-1 overflow-hidden flex-col lg:flex-row">
                {/* 좌측: 문제 이미지 */}
                <div className="relative flex flex-1 flex-col items-center justify-center bg-[#F3F4F6] overflow-hidden min-h-[50svh] lg:min-h-0">
                    <div className="absolute inset-0 pattern-dots border-slate-200 pointer-events-none opacity-40" />
                    <div
                        className="relative z-10 p-4 transition-transform duration-300"
                        style={{ transform: `scale(${zoom})`, transformOrigin: "center center" }}
                    >
                        <div className="bg-white p-2 rounded-[clamp(1rem,2vw,1.5rem)] shadow-xl border border-slate-200">
                            <Image
                                src={problem.image_url}
                                alt="문제 이미지"
                                width={700}
                                height={900}
                                className="object-contain rounded-xl bg-white"
                                style={{ maxHeight: "calc(100vh - 200px)", maxWidth: "100%" }}
                                priority
                            />
                        </div>
                    </div>

                    <div className="absolute bottom-6 right-6 flex flex-col gap-2 z-20">
                        <button onClick={() => setZoom((z) => Math.min(3, z + 0.25))} className="w-11 h-11 rounded-full bg-white shadow-xl flex items-center justify-center text-slate-700 hover:bg-slate-50 font-black border border-slate-200">+</button>
                        <button onClick={() => setZoom((z) => Math.max(0.5, z - 0.25))} className="w-11 h-11 rounded-full bg-white shadow-xl flex items-center justify-center text-slate-700 hover:bg-slate-50 font-black border border-slate-200">−</button>
                        <button onClick={() => setZoom(1)} className="w-11 h-11 rounded-full bg-slate-900 shadow-xl flex items-center justify-center text-white hover:bg-slate-800 text-[10px] font-black mt-2">1:1</button>
                    </div>
                </div>

                {/* 우측: 드로잉/해설/판정 패널 */}
                <div className="flex w-full lg:w-[clamp(400px,38vw,520px)] lg:border-l border-t lg:border-t-0 flex-col bg-white shadow-[-10px_0_30px_rgba(0,0,0,0.03)] z-20 border-slate-200 h-[50svh] lg:h-auto" ref={panelRef}>
                    {/* 탭 헤더 */}
                    <div className="flex p-2 bg-slate-50 border-b border-slate-200">
                        {(["draw", "memo", "hint"] as const).map((tab) => (
                            <button
                                key={tab}
                                onClick={() => setTab(tab)}
                                className={`flex-1 py-3 text-sm font-bold rounded-xl transition min-h-[44px] ${activeTab === tab ? "bg-white text-action shadow-sm border border-slate-100" : "text-slate-500 hover:text-slate-800 hover:bg-slate-100"
                                    }`}
                            >
                                {tab === "draw" ? "✏️ 풀이" : tab === "memo" ? "📝 메모" : "💡 해설"}
                            </button>
                        ))}
                    </div>

                    <div className="flex-1 overflow-hidden relative bg-[#FAFAFA]">
                        {activeTab === "draw" && <DrawingCanvas width={canvasSize.w} height={canvasSize.h} />}
                        {activeTab === "memo" && (
                            <div className="h-full p-6">
                                <label className="block text-sm font-bold text-slate-700 mb-3 ml-1">이번 복습의 핵심</label>
                                <textarea
                                    value={memo}
                                    onChange={(e) => setMemo(e.target.value)}
                                    placeholder="어떤 함정에 빠졌나요? 어떻게 해결했나요?"
                                    className="h-[calc(100%-3rem)] w-full resize-none rounded-2xl border border-slate-200 bg-white p-5 text-sm outline-none focus:border-action transition shadow-inner font-medium"
                                />
                            </div>
                        )}
                        {activeTab === "hint" && (
                            <div className="h-full overflow-auto p-6 space-y-4">
                                <div className="bg-blue-50/50 rounded-2xl p-5 border border-blue-100">
                                    <h4 className="text-[10px] font-black text-blue-500 uppercase tracking-widest mb-3">Saved Memo</h4>
                                    <p className="text-sm font-medium text-slate-700 leading-relaxed whitespace-pre-wrap">
                                        {problem.memo || "과거에 등록해둔 메모가 없습니다."}
                                    </p>
                                </div>
                                <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm">
                                    <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4">Problem Info</h4>
                                    <div className="space-y-4">
                                        <div className="flex justify-between items-center text-sm">
                                            <span className="text-slate-500 font-medium">과목별 태그</span>
                                            <span className="font-bold text-slate-800">{problem.subject} · {problem.unit_tags[0]}</span>
                                        </div>
                                        <div className="flex justify-between items-center text-sm">
                                            <span className="text-slate-500 font-medium">현재 상태</span>
                                            <span className="font-bold text-slate-800">{problem.status === 'saved' ? '보관중' : problem.status === 'review' ? '다시보기' : '마스터'}</span>
                                        </div>
                                        <div className="flex justify-between items-center text-sm">
                                            <span className="text-slate-500 font-medium">누적 풀이 횟수</span>
                                            <span className="font-black text-action bg-blue-50 px-2.5 py-0.5 rounded-md border border-blue-100">{problem.solve_count}회</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* 하단 판정 액션바 */}
                    <div className="p-6 bg-white border-t border-slate-100 shadow-[0_-4px_20px_rgba(0,0,0,0.02)]">
                        <div className="text-center mb-4 text-[10px] font-black text-slate-400 uppercase tracking-wider">복습 결과 판정</div>
                        <div className="flex gap-3">
                            <button
                                onClick={() => handleMark("review")}
                                className="flex-1 py-4 rounded-2xl border border-slate-200 bg-white text-slate-600 font-bold hover:bg-slate-50 transition min-h-[56px] text-sm"
                            >
                                🔄 헷갈려요
                            </button>
                            <button
                                onClick={() => handleMark("mastered")}
                                className="flex-1 py-4 rounded-2xl bg-slate-900 text-white font-bold hover:bg-slate-800 transition shadow-lg shadow-slate-900/20 min-h-[56px] text-sm"
                            >
                                ✅ 완벽해요
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
