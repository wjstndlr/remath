"use client";
import { useEffect, useMemo, useRef, useState } from "react";
import { supabase } from "@/lib/supabase";
import { useRouter } from "next/navigation";
import Image from "next/image";
import dynamic from "next/dynamic";
import type { Problem } from "@/types";

// Canvas 컴포넌트는 SSR에서 에러를 유발하므로 CSR로 동적 로드
const InfiniteCanvas = dynamic(() => import("@/components/problem/InfiniteCanvas"), { ssr: false });

// ✅ 관리자 계정 환경변수 (PRO 기능 전체 우회)
const ADMIN_EMAIL = process.env.NEXT_PUBLIC_ADMIN_EMAIL || "";

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

    // ✅ 저장 버튼 상태
    // - 최초(더티 없음): "전체 저장" (파란색)
    // - 변경 감지 후: "저장 필요 ⚡" (앰버색 + pulse)
    // - 저장 중: "저장중..." (비활성)
    const [saveAllBtn, setSaveAllBtn] = useState<"전체 저장" | "저장 필요 ⚡" | "저장완료" | "저장중...">("전체 저장");
    const [isSaving, setIsSaving] = useState(false);

    // ✅ Dirty state(변경 감지) + 캔버스 변경 감지
    const initialRef = useRef<{ memo: string; solutionMemo: string; solutionUrl: string; handwritingUrl: string } | null>(null);
    const [canvasDirty, setCanvasDirty] = useState(false);
    // 최초 저장인지 재수정인지 구분
    const [hasEverSaved, setHasEverSaved] = useState(false);

    const showToast = (msg: string) => {
        setToast(msg);
        window.clearTimeout((showToast as any)._t);
        (showToast as any)._t = window.setTimeout(() => setToast(null), 2000);
    };

    // ✅ 전체 저장에서 손글씨 저장까지 기다리기 (PDF에 반영되려면 반드시 필요)
    const waitCanvasSave = async (problemId: string): Promise<string | null> => {
        return new Promise((resolve, reject) => {
            let done = false;
            const safeResolve = (v: string | null) => {
                if (done) return;
                done = true;
                resolve(v);
            };
            const safeReject = (err: any) => {
                if (done) return;
                done = true;
                reject(err);
            };

            window.dispatchEvent(
                new CustomEvent("remath_save_canvas", {
                    detail: {
                        problemId,
                        resolve: safeResolve,
                        reject: safeReject,
                    },
                })
            );

            // 안전망: 10초 대기 후 강제 resolve (무한 대기 방지)
            window.setTimeout(() => safeResolve(null), 10000);
        });
    };

    useEffect(() => {
        async function fetchProblem() {
            const { data: { user } } = await supabase.auth.getUser();
            if (ADMIN_EMAIL && user?.email === ADMIN_EMAIL) {
                setIsAdmin(true);
            }

            const { data } = await supabase
                .from("problems")
                .select("*")
                .eq("id", params.id)
                .single();
            if (data) setProblem(data as Problem);
            if (data?.memo) setMemoDraft((data as any).memo ?? "");
            setSolutionMemoDraft(((data as any).solution_memo ?? "") as any);

            // 최초 저장 여부: 이미 뭔가 작성된 데이터가 있으면 "재수정" 모드
            const hasPriorData = Boolean(
                (data as any)?.memo || (data as any)?.handwriting_url || (data as any)?.solution_url
            );
            setHasEverSaved(hasPriorData);

            // 초기 스냅샷(Dirty 기준)
            initialRef.current = {
                memo: ((data as any)?.memo ?? "") as string,
                solutionMemo: ((data as any)?.solution_memo ?? "") as string,
                solutionUrl: ((data as any)?.solution_url ?? "") as string,
                handwritingUrl: ((data as any)?.handwriting_url ?? "") as string,
            };
            setLoading(false);
        }
        fetchProblem();
    }, [params.id, supabase]);

    const isDirty = useMemo(() => {
        if (!problem || !initialRef.current) return false;
        const base = initialRef.current;
        const currentSolutionUrl = (((problem as any).solution_url ?? "") as string) || "";
        const currentHandwritingUrl = (((problem as any).handwriting_url ?? "") as string) || "";
        return (
            (memoDraft ?? "") !== base.memo ||
            (solutionMemoDraft ?? "") !== base.solutionMemo ||
            currentSolutionUrl !== base.solutionUrl ||
            currentHandwritingUrl !== base.handwritingUrl ||
            Boolean(solutionFile) ||
            canvasDirty
        );
    }, [problem, memoDraft, solutionMemoDraft, solutionFile, canvasDirty]);

    // 캔버스 변경 감지 이벤트
    useEffect(() => {
        const onDirty = (e: any) => {
            if (e?.detail?.problemId !== params.id) return;
            setCanvasDirty(true);
        };
        const onSaved = (e: any) => {
            if (e?.detail?.problemId !== params.id) return;
            setCanvasDirty(false);
        };
        window.addEventListener("remath_canvas_dirty", onDirty as any);
        window.addEventListener("remath_canvas_saved", onSaved as any);
        return () => {
            window.removeEventListener("remath_canvas_dirty", onDirty as any);
            window.removeEventListener("remath_canvas_saved", onSaved as any);
        };
    }, [params.id]);

    // 페이지 이탈 방지(새로고침/닫기)
    useEffect(() => {
        const handler = (e: BeforeUnloadEvent) => {
            if (!isDirty) return;
            e.preventDefault();
            e.returnValue = "";
        };
        window.addEventListener("beforeunload", handler);
        return () => window.removeEventListener("beforeunload", handler);
    }, [isDirty]);

    // ✅ 더티 감지 → 재수정 모드일 때 버튼 "저장 필요 ⚡"로 전환
    useEffect(() => {
        if (isSaving) return;
        if (isDirty) {
            setSaveAllBtn("저장 필요 ⚡");
        } else if (!isDirty && saveAllBtn === "저장 필요 ⚡") {
            setSaveAllBtn("전체 저장");
        }
    }, [isDirty, isSaving]);

    const saveMemo = async () => {
        if (!problem) return;
        await supabase.from("problems").update({ memo: memoDraft }).eq("id", problem.id);
        setProblem({ ...problem, memo: memoDraft });
    };

    const saveSolutionMemo = async () => {
        if (!problem) return;
        await supabase.from("problems").update({ solution_memo: solutionMemoDraft } as any).eq("id", problem.id);
        setProblem({ ...(problem as any), solution_memo: solutionMemoDraft } as any);
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
            const filename = `${user.id}/${problem.id}/solution_${Date.now()}.${ext}`;

            const { error: upErr } = await supabase.storage
                .from("solutions")
                .upload(filename, solutionFile, { upsert: true });
            if (upErr) throw upErr;

            const { data: urlData } = supabase.storage.from("solutions").getPublicUrl(filename);
            const publicUrl = urlData.publicUrl;

            const { error: colErr } = await supabase.from("problems").update({ solution_url: publicUrl } as any).eq("id", problem.id);
            if (!colErr) {
                setProblem({ ...(problem as any), solution_url: publicUrl } as any);
            }
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
            const url = (((problem as any).solution_url ?? "") as string) || "";
            if (url.includes("/solutions/")) {
                const path = url.split("/solutions/")[1];
                if (path) await supabase.storage.from("solutions").remove([path]);
            }
        } catch { }
        await supabase.from("problems").update({ solution_url: null, solution_memo: null } as any).eq("id", problem.id);
        setProblem({ ...(problem as any), solution_url: undefined, solution_memo: undefined } as any);
        setSolutionMemoDraft("");
    };

    // ✅ 전체 저장 → 오답노트로 바로 이동
    const runSaveAll = async () => {
        if (!problem) return;
        setIsSaving(true);
        setSaveAllBtn("저장중...");
        try {
            await saveMemo();
            if (solutionFile) await uploadSolution();
            if (((problem as any).solution_url || solutionPreview) && solutionMemoDraft.trim().length) {
                await saveSolutionMemo();
            }
            // ✅ 손글씨 저장(완료까지 await)
            const handwritingUrl = await waitCanvasSave(problem.id);
            if (handwritingUrl) {
                setProblem({ ...(problem as any), handwriting_url: handwritingUrl } as any);
            }

            // Dirty 스냅샷 갱신
            initialRef.current = {
                memo: memoDraft ?? "",
                solutionMemo: solutionMemoDraft ?? "",
                solutionUrl: (((problem as any).solution_url ?? "") as string) || "",
                handwritingUrl: handwritingUrl ?? ((((problem as any).handwriting_url ?? "") as string) || ""),
            };
            setCanvasDirty(false);
            setHasEverSaved(true);
            setSaveAllBtn("저장완료");

            showToast("저장완료 🎉 오답노트로 이동합니다!");

            // ✅ 잠깐 토스트 보여주고 오답노트로 이동
            setTimeout(() => {
                router.push(`/notebook/all?focus=${problem.id}`);
            }, 900);
        } catch (err: any) {
            showToast(err?.message ?? "저장 중 오류가 발생했어요.");
            setSaveAllBtn(hasEverSaved ? "저장 필요 ⚡" : "전체 저장");
        } finally {
            setIsSaving(false);
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

    // 저장 버튼 스타일 결정
    const btnIsDirtyMode = saveAllBtn === "저장 필요 ⚡";
    const saveAllBtnClass =
        "px-4 py-2 rounded-xl text-white font-black text-sm shadow-lg transition " +
        (btnIsDirtyMode
            ? "bg-amber-500 hover:bg-amber-600 shadow-amber-500/20 save-pulse"
            : saveAllBtn === "저장중..."
                ? "bg-slate-500 cursor-not-allowed"
                : "bg-action hover:bg-blue-600 shadow-action/20");

    return (
        <div className="flex flex-row h-screen bg-[#F9FAFB] text-slate-900 overflow-hidden">
            {toast && (
                <div className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-50 px-6 py-4 rounded-3xl bg-slate-900/95 text-white text-sm font-black shadow-2xl backdrop-blur-md animate-bounce whitespace-pre-line max-w-[92vw] text-center">
                    {toast}
                </div>
            )}

            {/* 좌측: 문제 확인 카드 */}
            <div className="w-[clamp(320px,33vw,400px)] bg-slate-900 text-white flex flex-col shadow-2xl z-10 border-r border-slate-800 shrink-0 h-full overflow-y-auto">
                {/* 헤더: 과목명 + 전체 저장 버튼 */}
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
                        title="해설/사진/손글씨를 한 번에 저장 후 오답노트로 이동"
                    >
                        {saveAllBtn}
                    </button>
                </div>

                <div className="p-6 flex-1 flex flex-col gap-6">
                    {/* 단원 태그 + 중요도 */}
                    <div className="flex flex-wrap gap-2">
                        {problem.unit_tags.map(tag => (
                            <span key={tag} className="px-3 py-1 bg-slate-800 text-blue-300 rounded-full text-[11px] font-bold border border-slate-700 min-h-[28px] flex items-center">
                                {tag}
                            </span>
                        ))}
                        <span className="px-3 py-1 bg-yellow-500/10 text-yellow-500 rounded-full text-[11px] font-bold border border-yellow-500/20 min-h-[28px] flex items-center">
                            ★ {problem.importance || 2}
                        </span>
                    </div>

                    {/* 문제 이미지 */}
                    <div className="relative w-full rounded-2xl bg-white p-2 overflow-hidden shrink-0 border border-slate-800" style={{ minHeight: "clamp(240px, 35vh, 400px)" }}>
                        <Image src={problem.image_url} alt="등록한 문제" fill className="object-contain" />
                    </div>

                    {/* 해설(텍스트) 작성 */}
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

                    {/* 풀이 이미지 업로드 */}
                    <div className="mt-2">
                        <h3 className="text-sm font-bold text-slate-200 mb-3">📎 풀이 이미지 추가 (선택)</h3>
                        {solutionPreview ? (
                            <div className="rounded-2xl overflow-hidden border border-slate-800 bg-black/20">
                                {/* eslint-disable-next-line @next/next/no-img-element */}
                                <img src={solutionPreview} alt="풀이 미리보기" className="w-full h-40 object-contain bg-black/10" />
                                <div className="p-3 flex gap-2">
                                    <div className="flex-1 py-2 rounded-xl bg-white/10 text-slate-300 font-bold text-[11px] flex items-center justify-center text-center leading-tight">
                                        상단 전체 저장 시<br />업로드됩니다
                                    </div>
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

                        {(problem as any).solution_url && !solutionPreview && (
                            <div className="mt-3 rounded-2xl overflow-hidden border border-slate-800 bg-black/20">
                                {/* eslint-disable-next-line @next/next/no-img-element */}
                                <img
                                    src={(problem as any).solution_url}
                                    alt="업로드된 풀이"
                                    className="w-full h-44 object-contain bg-black/10 cursor-zoom-in"
                                    onClick={() => setImgModal((problem as any).solution_url)}
                                />
                                <div className="px-3 pb-3 pt-2">
                                    <button onClick={deleteSolutionImage} className="w-full py-3 rounded-xl bg-white/10 hover:bg-red-500/20 text-red-300 font-bold text-xs border border-red-500/10 min-h-[44px] transition-colors">
                                        🗑️ 이미지 삭제 후 다시 업로드
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* 사진 아래 추가 메모 */}
                    {((problem as any).solution_url || solutionPreview) && (
                        <div className="mt-2 mb-4">
                            <div className="flex items-center justify-between mb-2">
                                <h3 className="text-sm font-bold text-slate-200">🗒️ 사진 아래 추가 메모</h3>
                            </div>
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

            {/* 우측: 드로잉 & 타이핑 캔버스 */}
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
                    <button className="fixed top-5 right-5 px-4 py-2 rounded-xl bg-white/10 text-white font-bold" onClick={() => setImgModal(null)}>
                        닫기
                    </button>
                </div>
            )}
        </div>
    );
}
