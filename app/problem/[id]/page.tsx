"use client";
import { useEffect, useMemo, useRef, useState } from "react";
import { supabase } from "@/lib/supabase";
import { useRouter } from "next/navigation";
import Image from "next/image";
import dynamic from "next/dynamic";
import type { Problem } from "@/types";

const InfiniteCanvas = dynamic(() => import("@/components/problem/InfiniteCanvas"), { ssr: false });

const ADMIN_EMAIL = process.env.NEXT_PUBLIC_ADMIN_EMAIL || "";

// ============================================================
// CompletionModal — 해설 완성 축하 (최초 저장 시에만)
// ✅ 컴팩트 사이즈 + 깔끔한 오답노트 이미지 + CTA
// ============================================================
function CompletionModal({
    problem,
    onPrint,
    onClose,
}: {
    problem: Problem;
    onPrint: () => void;
    onClose: () => void;
}) {
    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 md:p-6 overflow-y-auto">
            <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden animate-fade-up my-auto">
                {/* 헤더 */}
                <div className="bg-gradient-to-r from-amber-400 via-yellow-300 to-amber-400 px-5 py-4 shrink-0 text-center relative overflow-hidden">
                    <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_50%,rgba(255,255,255,0.3),transparent_60%)] animate-pulse" />
                    <div className="relative z-10">
                        <div className="text-3xl mb-1">🎉</div>
                        <h2 className="text-lg md:text-xl font-black text-amber-900 leading-snug">
                            방금 당신만의 오답노트가 완성되었습니다!
                        </h2>
                        <p className="text-amber-800 text-[11px] font-bold mt-1 opacity-80">
                            손글씨 해설까지 완벽하게 저장되었습니다.
                        </p>
                    </div>
                </div>

                {/* 오답노트 미리보기 (인라인 렌더링) */}
                <div className="flex-1 overflow-y-auto bg-slate-100 p-4 md:p-6 py-6 md:py-8">
                    <div className="bg-white mx-auto w-full max-w-3xl rounded-xl shadow-sm border border-slate-200 overflow-hidden text-sm">
                        {/* 헤더 줄 */}
                        <div className="border-b border-slate-200 bg-slate-50 px-4 py-2 flex items-center justify-between text-xs font-bold text-slate-500">
                            <div>1 <span className="text-slate-300 mx-2">|</span> {problem.subject} · {(problem.unit_tags || []).join(', ')}</div>
                            <div className="text-green-600 bg-green-50 px-2 py-0.5 rounded-full border border-green-200">완성됨</div>
                        </div>
                        {/* 본문 2단락 */}
                        <div className="flex flex-col md:flex-row divide-y md:divide-y-0 md:divide-x divide-slate-200">
                            {/* 좌측 (문제) */}
                            <div className="w-full md:w-1/2 p-4 flex flex-col gap-4">
                                <div className="rounded-lg border border-slate-200 p-2 overflow-hidden bg-white relative w-full aspect-[4/3] flex items-center justify-center">
                                    {/* eslint-disable-next-line @next/next/no-img-element */}
                                    <img src={problem.image_url} alt="문제 이미지" className="max-w-full max-h-full object-contain" />
                                </div>
                                <div className="flex-1 bg-amber-50/50 rounded-lg border border-amber-100 p-3 pt-2">
                                    <div className="text-[11px] font-bold text-amber-700 mb-2">✏️ 한번 더 풀기</div>
                                    <div className="space-y-3 mt-1 pointer-events-none opacity-30">
                                        {Array.from({ length: 5 }).map((_, i) => (
                                            <div key={i} className="border-b border-amber-200 w-full" />
                                        ))}
                                    </div>
                                </div>
                            </div>

                            {/* 우측 (해설) */}
                            <div className="w-full md:w-1/2 p-4 flex flex-col gap-4 bg-slate-50/50">
                                <div className="bg-white rounded-lg border border-slate-200 p-3">
                                    <div className="text-[11px] font-bold text-slate-500 mb-2">📝 내 해설 / 오답 포인트</div>
                                    <div className="text-xs text-slate-700">
                                        {problem.memo ? problem.memo : <span className="text-slate-400 italic">작성된 메모가 없습니다.</span>}
                                    </div>
                                </div>

                                {problem.handwriting_url && (
                                    <div className="bg-white rounded-lg border border-slate-200 p-3 flex-1 flex flex-col">
                                        <div className="text-[11px] font-bold text-slate-500 mb-2">✍️ 메인 손글씨 풀이</div>
                                        <div className="relative flex-1 w-full min-h-[160px] flex items-center justify-center overflow-hidden">
                                            {/* eslint-disable-next-line @next/next/no-img-element */}
                                            <img src={problem.handwriting_url} alt="손글씨 풀이" className="max-w-full max-h-full object-contain mix-blend-multiply" />
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>

                {/* CTA */}
                <div className="px-5 py-4 shrink-0 bg-white border-t border-slate-100 flex flex-col md:flex-row gap-3 items-center justify-center">
                    <button
                        onClick={onPrint}
                        className="w-full md:w-auto md:min-w-[280px] py-3.5 px-6 rounded-xl bg-gradient-to-r from-amber-500 to-yellow-500 text-white font-black text-sm shadow-lg shadow-amber-400/30 hover:from-amber-600 hover:to-yellow-600 hover:-translate-y-0.5 transition-all text-center flex items-center justify-center gap-2"
                    >
                        🖨️ 완전한 오답노트로 인쇄하기
                    </button>
                    <button
                        onClick={onClose}
                        className="w-full md:w-auto py-3.5 px-6 text-slate-500 font-bold hover:bg-slate-50 rounded-xl transition-colors text-sm"
                    >
                        나중에 인쇄하기 →
                    </button>
                </div>
            </div>
        </div>
    );
}

// ============================================================
// PaymentModal — PDF 유료 인쇄 유도
// ============================================================
function PaymentModal({ onClose }: { onClose: () => void }) {
    const router = useRouter();
    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
            <div className="relative bg-white rounded-2xl shadow-2xl w-[min(360px,90vw)] overflow-hidden">
                <div className="bg-gradient-to-br from-slate-900 to-slate-800 px-5 py-6 text-center">
                    <div className="text-4xl mb-3">🔒</div>
                    <h2 className="text-lg font-black text-white leading-snug">
                        무료 인쇄 횟수를<br />모두 사용했어요
                    </h2>
                    <p className="text-slate-400 text-xs font-medium mt-2">
                        무료 PDF 인쇄는 <b className="text-white">2회</b>까지 제공돼요.<br />
                        PRO로 업그레이드하면 <b className="text-amber-400">무제한 PDF 인쇄</b> 가능.
                    </p>
                </div>
                <div className="p-4 space-y-2">
                    <button
                        onClick={() => router.push("/plans")}
                        className="w-full py-3 rounded-xl bg-gradient-to-r from-amber-500 to-yellow-500 text-white font-black text-sm shadow-md"
                    >
                        ⚡ PRO로 업그레이드
                    </button>
                    <button
                        onClick={onClose}
                        className="w-full py-2 text-slate-400 text-xs font-medium hover:text-slate-600"
                    >
                        닫기
                    </button>
                </div>
            </div>
        </div>
    );
}

// ============================================================
// Main Page
// ============================================================
export default function ProblemDetailPage({ params }: { params: { id: string } }) {
    const router = useRouter();
    const [problem, setProblem] = useState<Problem | null>(null);
    const [loading, setLoading] = useState(true);
    const [memoDraft, setMemoDraft] = useState("");
    const [solutionUploading, setSolutionUploading] = useState(false);
    const [solutionPreview, setSolutionPreview] = useState<string | null>(null);
    const [solutionFile, setSolutionFile] = useState<File | null>(null);
    const [solutionMemoDraft, setSolutionMemoDraft] = useState("");

    const [toast, setToast] = useState<string | null>(null);
    const [imgModal, setImgModal] = useState<string | null>(null);
    const [isAdmin, setIsAdmin] = useState(false);
    const [userId, setUserId] = useState<string>("");

    // ✅ 모달 상태
    const [showCompletionModal, setShowCompletionModal] = useState(false);
    const [showPaymentModal, setShowPaymentModal] = useState(false);

    // ✅ 저장 버튼 상태
    const [saveAllBtn, setSaveAllBtn] = useState<"전체 저장" | "저장 필요 ⚡" | "저장완료" | "저장중...">("전체 저장");
    const [isSaving, setIsSaving] = useState(false);

    // ✅ Dirty state
    const initialRef = useRef<{ memo: string; solutionMemo: string; solutionUrl: string; handwritingUrl: string } | null>(null);
    const [canvasDirty, setCanvasDirty] = useState(false);
    // ✅ 핵심: "이 문제에 이미 handwriting이 있었는지" (최초 저장 vs 재수정)
    const [hadHandwritingOnLoad, setHadHandwritingOnLoad] = useState(false);

    const showToast = (msg: string) => {
        setToast(msg);
        window.clearTimeout((showToast as any)._t);
        (showToast as any)._t = window.setTimeout(() => setToast(null), 2000);
    };

    // ✅ 캔버스 저장 대기
    const waitCanvasSave = async (problemId: string): Promise<string | null> => {
        return new Promise((resolve, reject) => {
            let done = false;
            const safeResolve = (v: string | null) => { if (done) return; done = true; resolve(v); };
            const safeReject = (err: any) => { if (done) return; done = true; reject(err); };

            window.dispatchEvent(
                new CustomEvent("remath_save_canvas", {
                    detail: { problemId, resolve: safeResolve, reject: safeReject },
                })
            );
            window.setTimeout(() => safeResolve(null), 10000);
        });
    };

    useEffect(() => {
        async function fetchProblem() {
            const { data: { user } } = await supabase.auth.getUser();
            if (ADMIN_EMAIL && user?.email === ADMIN_EMAIL) setIsAdmin(true);
            if (user) setUserId(user.id);

            const { data } = await supabase
                .from("problems")
                .select("*")
                .eq("id", params.id)
                .single();

            if (data) setProblem(data as Problem);
            if (data?.memo) setMemoDraft(data.memo ?? "");
            setSolutionMemoDraft(data?.solution_memo ?? "");

            // ✅ 최초 저장인지 재수정인지: handwriting_url 유무로 판단
            setHadHandwritingOnLoad(Boolean(data?.handwriting_url));

            initialRef.current = {
                memo: data?.memo ?? "",
                solutionMemo: data?.solution_memo ?? "",
                solutionUrl: data?.solution_url ?? "",
                handwritingUrl: data?.handwriting_url ?? "",
            };
            setLoading(false);
        }
        fetchProblem();
    }, [params.id]);

    const isDirty = useMemo(() => {
        if (!problem || !initialRef.current) return false;
        const base = initialRef.current;
        return (
            (memoDraft ?? "") !== base.memo ||
            (solutionMemoDraft ?? "") !== base.solutionMemo ||
            (problem.solution_url ?? "") !== base.solutionUrl ||
            (problem.handwriting_url ?? "") !== base.handwritingUrl ||
            Boolean(solutionFile) ||
            canvasDirty
        );
    }, [problem, memoDraft, solutionMemoDraft, solutionFile, canvasDirty]);

    // 캔버스 변경 감지
    useEffect(() => {
        const onDirty = (e: any) => { if (e?.detail?.problemId !== params.id) return; setCanvasDirty(true); };
        const onSaved = (e: any) => { if (e?.detail?.problemId !== params.id) return; setCanvasDirty(false); };
        window.addEventListener("remath_canvas_dirty", onDirty as any);
        window.addEventListener("remath_canvas_saved", onSaved as any);
        return () => {
            window.removeEventListener("remath_canvas_dirty", onDirty as any);
            window.removeEventListener("remath_canvas_saved", onSaved as any);
        };
    }, [params.id]);

    // 페이지 이탈 방지
    useEffect(() => {
        const handler = (e: BeforeUnloadEvent) => { if (!isDirty) return; e.preventDefault(); e.returnValue = ""; };
        window.addEventListener("beforeunload", handler);
        return () => window.removeEventListener("beforeunload", handler);
    }, [isDirty]);

    // ✅ Dirty → 재수정 모드에서만 "저장 필요 ⚡"로 전환
    useEffect(() => {
        if (isSaving) return;
        if (isDirty && hadHandwritingOnLoad) {
            // 재수정 모드에서만 "저장 필요" 배너
            setSaveAllBtn("저장 필요 ⚡");
        } else if (isDirty && !hadHandwritingOnLoad) {
            // 최초 등록: 그냥 "전체 저장" 유지
            setSaveAllBtn("전체 저장");
        } else if (!isDirty && saveAllBtn === "저장 필요 ⚡") {
            setSaveAllBtn("전체 저장");
        }
    }, [isDirty, isSaving, hadHandwritingOnLoad]);

    const saveMemo = async () => {
        if (!problem) return;
        await supabase.from("problems").update({ memo: memoDraft }).eq("id", problem.id);
        setProblem({ ...problem, memo: memoDraft });
    };

    const saveSolutionMemo = async () => {
        if (!problem) return;
        await supabase.from("problems").update({ solution_memo: solutionMemoDraft }).eq("id", problem.id);
        setProblem({ ...problem, solution_memo: solutionMemoDraft });
    };

    const onSolutionChange = (e: any) => {
        const f = e.target.files?.[0];
        if (!f) return;
        setSolutionFile(f);
        setSolutionPreview(URL.createObjectURL(f));
    };

    const uploadSolution = async () => {
        if (!problem || !solutionFile) return;
        setSolutionUploading(true);
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) throw new Error("로그인이 필요합니다.");
            const ext = solutionFile.name.split(".").pop();
            const filename = `${user.id}/${problem.id}/solution.${ext}`;
            const { error: upErr } = await supabase.storage
                .from("solutions")
                .upload(filename, solutionFile, { upsert: true });
            if (upErr) throw upErr;
            const { data: urlData } = supabase.storage.from("solutions").getPublicUrl(filename);
            // 🔥 캐시 브레이킹 (재수정 시 PDF/UI 즉시 반영)
            const publicUrl = `${urlData.publicUrl}?t=${Date.now()}`;
            const { error: colErr } = await supabase.from("problems").update({ solution_url: publicUrl }).eq("id", problem.id);
            if (!colErr) setProblem({ ...problem, solution_url: publicUrl });
            setSolutionFile(null);
            setSolutionPreview(null);
        } catch (e: any) {
            showToast(e?.message ?? "풀이 이미지 업로드 중 오류");
        } finally {
            setSolutionUploading(false);
        }
    };

    const deleteSolutionImage = async () => {
        if (!problem) return;
        if (!confirm("업로드된 풀이 사진을 삭제할까요?")) return;
        try {
            const url = problem.solution_url ?? "";
            if (url.includes("/solutions/")) {
                const path = url.split("/solutions/")[1];
                if (path) await supabase.storage.from("solutions").remove([path]);
            }
        } catch { }
        await supabase.from("problems").update({ solution_url: null, solution_memo: null }).eq("id", problem.id);
        setProblem({ ...problem, solution_url: undefined, solution_memo: undefined });
        setSolutionMemoDraft("");
    };

    // ✅ 전체 저장
    const runSaveAll = async () => {
        if (!problem) return;
        setIsSaving(true);
        setSaveAllBtn("저장중...");
        try {
            await saveMemo();
            if (solutionFile) await uploadSolution();
            if ((problem.solution_url || solutionPreview) && solutionMemoDraft.trim().length) {
                await saveSolutionMemo();
            }

            // ✅ 손글씨 저장(완료까지 await)
            const handwritingUrl = await waitCanvasSave(problem.id);
            if (handwritingUrl) {
                setProblem(prev => prev ? { ...prev, handwriting_url: handwritingUrl } : prev);
            }

            // Dirty 스냅샷 갱신
            initialRef.current = {
                memo: memoDraft ?? "",
                solutionMemo: solutionMemoDraft ?? "",
                solutionUrl: problem.solution_url ?? "",
                handwritingUrl: handwritingUrl ?? (problem.handwriting_url ?? ""),
            };
            setCanvasDirty(false);
            setSaveAllBtn("저장완료");

            const isHandwritingComplete = Boolean(handwritingUrl ?? problem.handwriting_url);

            // ✅ 최초 저장(이 문제에 handwriting이 없었는데 이번에 생김) → 축하 모달
            // ✅ 재수정(이미 handwriting이 있었음) → 바로 오답노트로 이동
            if (isHandwritingComplete && !hadHandwritingOnLoad) {
                // ✅ profiles.solution_complete_count 증가 (서버에서, .eq 포함!)
                try {
                    const { data: profileData } = await supabase
                        .from("profiles")
                        .select("solution_complete_count")
                        .eq("id", userId)
                        .single();

                    const currentCount = profileData?.solution_complete_count ?? 0;
                    await supabase
                        .from("profiles")
                        .update({ solution_complete_count: currentCount + 1 })
                        .eq("id", userId);
                } catch (e) {
                    console.warn("profiles 카운트 업데이트 실패 (무시):", e);
                }

                setHadHandwritingOnLoad(true); // 이제부터 재수정 모드
                showToast("저장완료 🎉");
                setTimeout(() => setShowCompletionModal(true), 500);
            } else {
                // 재수정이거나 handwriting 없이 저장 → 바로 오답노트
                showToast("저장완료 🎉 오답노트로 이동합니다!");
                setTimeout(() => {
                    router.push(`/notebook/${encodeURIComponent(problem.subject)}?focus=${problem.id}`);
                }, 800);
            }
        } catch (err: any) {
            showToast(err?.message ?? "저장 중 오류가 발생했어요.");
            setSaveAllBtn(hadHandwritingOnLoad ? "저장 필요 ⚡" : "전체 저장");
        } finally {
            setIsSaving(false);
        }
    };

    // ✅ PDF 인쇄 핸들러
    const handlePrint = async () => {
        try {
            const res = await fetch(`/api/pdf/print-gate?problemId=${problem?.id}`, { method: "POST" });
            const json = await res.json();
            if (json.allowed) {
                window.open(`/api/pdf?type=notebook&subject=${encodeURIComponent(problem?.subject || "")}&single=${problem?.id}`, "_blank");
                setShowCompletionModal(false);
                // 인쇄 후 → 오답노트 페이지로 이동
                setTimeout(() => {
                    router.push(`/notebook/${encodeURIComponent(problem?.subject || "all")}?focus=${problem?.id}`);
                }, 500);
            } else {
                setShowCompletionModal(false);
                setShowPaymentModal(true);
            }
        } catch {
            window.open(`/api/pdf?type=notebook`, "_blank");
            setShowCompletionModal(false);
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="w-10 h-10 border-4 border-slate-200 border-t-blue-500 rounded-full animate-spin" />
            </div>
        );
    }
    if (!problem) {
        return (
            <div className="min-h-screen flex items-center justify-center text-slate-500">
                문제를 찾을 수 없습니다.
            </div>
        );
    }

    const btnIsDirtyMode = saveAllBtn === "저장 필요 ⚡";
    const saveAllBtnClass =
        "px-4 py-2 rounded-xl text-white font-black text-sm shadow-lg transition " +
        (btnIsDirtyMode
            ? "bg-amber-500 hover:bg-amber-600 shadow-amber-500/20 save-pulse"
            : saveAllBtn === "저장중..."
                ? "bg-slate-500 cursor-not-allowed"
                : "bg-action hover:bg-blue-600 shadow-action/20");

    const isSolutionComplete = Boolean(problem.handwriting_url);

    return (
        <div className="flex flex-row h-screen bg-[#F9FAFB] text-slate-900 overflow-hidden">
            {toast && (
                <div className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-50 px-6 py-4 rounded-3xl bg-slate-900/95 text-white text-sm font-black shadow-2xl backdrop-blur-md animate-bounce whitespace-pre-line max-w-[92vw] text-center">
                    {toast}
                </div>
            )}

            {/* 완성 축하 모달 (최초 저장 시에만) */}
            {showCompletionModal && problem && (
                <CompletionModal
                    problem={problem}
                    onPrint={handlePrint}
                    onClose={() => {
                        setShowCompletionModal(false);
                        router.push(`/notebook/${encodeURIComponent(problem.subject)}?focus=${problem.id}`);
                    }}
                />
            )}

            {showPaymentModal && (
                <PaymentModal onClose={() => setShowPaymentModal(false)} />
            )}

            {/* 좌측 패널 */}
            <div className="w-[clamp(320px,33vw,400px)] bg-slate-900 text-white flex flex-col shadow-2xl z-10 border-r border-slate-800 shrink-0 h-full overflow-y-auto">
                {/* 헤더 */}
                <div className="p-5 border-b border-slate-800 flex justify-between items-center bg-slate-900/90 sticky top-0 backdrop-blur-md z-20">
                    <div className="flex-1 min-w-0 mr-4">
                        <h1 className="text-[clamp(1rem,1.5vw,1.25rem)] font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-cyan-300 truncate">
                            {problem.subject} · 해설 작성
                        </h1>
                        <div className="text-[10px] text-slate-400 mt-0.5 truncate">
                            {btnIsDirtyMode ? "⚡ 변경사항을 저장해주세요!" : "한 번에 저장 후 이동합니다."}
                        </div>
                    </div>
                    <button
                        onClick={runSaveAll}
                        disabled={isSaving}
                        className={saveAllBtnClass + " whitespace-nowrap min-h-[44px]"}
                    >
                        {saveAllBtn}
                    </button>
                </div>

                {/* 해설 완료 배지 */}
                {isSolutionComplete && (
                    <div className="mx-5 mt-4 px-4 py-2.5 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center gap-2">
                        <span className="text-amber-400 text-lg">✨</span>
                        <div>
                            <div className="text-amber-300 text-xs font-black">해설 완성!</div>
                            <div className="text-amber-400/70 text-[10px]">손글씨 해설이 저장된 문제입니다</div>
                        </div>
                    </div>
                )}

                <div className="p-6 flex-1 flex flex-col gap-6">
                    {/* 태그 + 중요도 */}
                    <div className="flex flex-wrap gap-2">
                        {problem.unit_tags.map(tag => (
                            <span key={tag} className="px-3 py-1 bg-slate-800 text-blue-300 rounded-full text-[11px] font-bold border border-slate-700 min-h-[28px] flex items-center">{tag}</span>
                        ))}
                        <span className="px-3 py-1 bg-yellow-500/10 text-yellow-500 rounded-full text-[11px] font-bold border border-yellow-500/20 min-h-[28px] flex items-center">★ {problem.importance || 2}</span>
                    </div>

                    {/* 문제 이미지 */}
                    <div className="relative w-full rounded-2xl bg-white p-2 overflow-hidden shrink-0 border border-slate-800" style={{ minHeight: "clamp(240px, 35vh, 400px)" }}>
                        <Image src={problem.image_url} alt="등록한 문제" fill sizes="(max-width: 768px) 100vw, 33vw" className="object-contain" />
                    </div>

                    {/* 해설 텍스트 */}
                    <div className="mt-2">
                        <div className="flex items-center justify-between mb-2">
                            <h2 className="text-sm font-bold text-slate-200">📝 내 해설 / 오답 포인트</h2>
                            <span className="text-[10px] text-slate-500 font-medium">자동 저장 제외</span>
                        </div>
                        <textarea
                            value={memoDraft}
                            onChange={(e) => setMemoDraft(e.target.value)}
                            placeholder="틀린 이유 / 핵심 아이디어 등을 적어두세요."
                            className="w-full min-h-[clamp(120px,20vh,280px)] resize-y rounded-2xl bg-slate-950/50 border border-slate-800 p-4 text-sm text-slate-100 outline-none focus:border-blue-500 transition-colors"
                        />
                    </div>

                    {/* 손글씨 안내 */}
                    <div className="px-4 py-3 rounded-xl bg-blue-500/10 border border-blue-500/20 text-blue-300 text-[11px] leading-relaxed">
                        <b className="font-black">✍️ 해설 완료 조건</b>: 오른쪽 캔버스에 손글씨 풀이를 작성하고 전체 저장을 누르면 이 문제의 해설이 완성됩니다.
                    </div>

                    {/* 풀이 이미지 업로드 */}
                    <div className="mt-2">
                        <h3 className="text-sm font-bold text-slate-200 mb-3">📎 풀이 이미지 추가 (선택)</h3>
                        {solutionPreview ? (
                            <div className="rounded-2xl overflow-hidden border border-slate-800 bg-black/20">
                                {/* eslint-disable-next-line @next/next/no-img-element */}
                                <img src={solutionPreview} alt="풀이 미리보기" className="w-full h-40 object-contain bg-black/10" />
                                <div className="p-3 flex gap-2">
                                    <div className="flex-1 py-2 rounded-xl bg-white/10 text-slate-300 font-bold text-[11px] flex items-center justify-center text-center leading-tight">상단 전체 저장 시<br />업로드됩니다</div>
                                    <button onClick={() => { setSolutionFile(null); setSolutionPreview(null); }} className="px-4 py-2 rounded-xl bg-white/10 text-slate-200 font-bold text-xs hover:bg-white/15 min-h-[44px]">취소</button>
                                </div>
                            </div>
                        ) : (
                            <div className="grid grid-cols-2 gap-3">
                                <label className="cursor-pointer rounded-2xl border border-slate-800 bg-white/5 hover:bg-white/10 p-5 flex flex-col items-center justify-center gap-2 transition-colors min-h-[100px]">
                                    <span className="text-3xl">📸</span>
                                    <span className="text-xs font-bold text-slate-200">사진 찍기</span>
                                    <input type="file" accept="image/*" capture="environment" className="hidden" onChange={onSolutionChange} />
                                </label>
                                <label className="cursor-pointer rounded-2xl border border-slate-800 bg-white/5 hover:bg-white/10 p-5 flex flex-col items-center justify-center gap-2 transition-colors min-h-[100px]">
                                    <span className="text-3xl">🖼️</span>
                                    <span className="text-xs font-bold text-slate-200">파일 업로드</span>
                                    <input type="file" accept="image/*" className="hidden" onChange={onSolutionChange} />
                                </label>
                            </div>
                        )}

                        {problem.solution_url && !solutionPreview && (
                            <div className="mt-3 rounded-2xl overflow-hidden border border-slate-800 bg-black/20">
                                {/* eslint-disable-next-line @next/next/no-img-element */}
                                <img src={problem.solution_url} alt="업로드된 풀이" className="w-full h-44 object-contain bg-black/10 cursor-zoom-in" onClick={() => setImgModal(problem.solution_url!)} />
                                <div className="px-3 pb-3 pt-2">
                                    <button onClick={deleteSolutionImage} className="w-full py-3 rounded-xl bg-white/10 hover:bg-red-500/20 text-red-300 font-bold text-xs border border-red-500/10 min-h-[44px] transition-colors">🗑️ 이미지 삭제 후 다시 업로드</button>
                                </div>
                            </div>
                        )}
                    </div>

                    {(problem.solution_url || solutionPreview) && (
                        <div className="mt-2 mb-4">
                            <h3 className="text-sm font-bold text-slate-200 mb-2">🗒️ 사진 아래 추가 메모</h3>
                            <textarea
                                value={solutionMemoDraft}
                                onChange={(e) => setSolutionMemoDraft(e.target.value)}
                                placeholder="풀이 사진에 대한 설명을 적어주세요."
                                className="w-full min-h-[120px] resize-y rounded-2xl bg-slate-950/50 border border-slate-800 p-4 text-sm text-slate-100 outline-none focus:border-blue-500 transition-colors"
                            />
                        </div>
                    )}
                </div>
            </div>

            {/* 우측 캔버스 */}
            <div className="flex-1 h-full relative bg-[#F3F4F6] overflow-hidden flex flex-col shadow-inner">
                <div className="absolute inset-0 pattern-dots border-slate-200 pointer-events-none opacity-40" />
                <InfiniteCanvas problemId={params.id} onToast={showToast} />
            </div>

            {/* 이미지 확대 모달 */}
            {imgModal && (
                <div className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-4" onClick={() => setImgModal(null)}>
                    <div className="max-w-5xl w-full bg-white rounded-2xl overflow-hidden" onClick={(e) => e.stopPropagation()}>
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={imgModal} alt="확대" className="w-full h-auto object-contain" />
                    </div>
                    <button className="fixed top-5 right-5 px-4 py-2 rounded-xl bg-white/10 text-white font-bold" onClick={() => setImgModal(null)}>닫기</button>
                </div>
            )}
        </div>
    );
}
