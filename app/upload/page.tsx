"use client";
// =============================================
// ReMath 프리미엄 오답 문제 등록 페이지 (좌우 분할)
// =============================================
import { useState, useRef } from "react";
import { supabase } from "@/lib/supabase";
import { useRouter } from "next/navigation";
import Image from "next/image";
import type { Subject } from "@/types";

const UNITS: Record<Subject, string[]> = {
    수학1: ["지수/로그", "삼각함수", "수열", "수1 기타"],
    수학2: ["함수극한", "미분", "적분", "수2 기타"],
    미적분: ["수열극한", "미분법", "적분법", "미적 기타"],
    확통: ["경우의수", "확률", "통계", "확통 기타"],
    기하: ["이차곡선", "평면벡터", "공간도형", "기하 기타"],
};
const SUBJECTS: Subject[] = ["수학1", "수학2", "미적분", "확통", "기하"];

// ============================================================
// 등록 완료 팝업 — 미끼 던지기 UX
// ============================================================
function RegistrationSuccessPopup({
    problemId,
    problemImageUrl,
    onStart,
    onSkip,
}: {
    problemId: string;
    problemImageUrl: string;
    onStart: () => void;
    onSkip: () => void;
}) {
    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/75 backdrop-blur-sm p-4">
            <div className="relative bg-white rounded-[2rem] shadow-2xl max-w-lg w-full overflow-hidden animate-fade-up">
                {/* 상단 헤더 */}
                <div className="bg-gradient-to-r from-blue-600 to-indigo-600 p-6 text-white text-center relative overflow-hidden">
                    <div className="absolute inset-0 bg-[radial-gradient(circle_at_70%_30%,rgba(255,255,255,0.15),transparent_50%)]" />
                    <div className="relative z-10">
                        <div className="text-4xl mb-2">🎉</div>
                        <h2 className="text-xl font-black leading-tight">
                            축하합니다!<br />
                            문제가 오답노트 양식으로<br />
                            변환될 준비가 되었습니다
                        </h2>
                    </div>
                </div>

                <div className="p-6">
                    {/* PDF "반쪽짜리" 미리보기 */}
                    <div className="flex gap-3 rounded-2xl overflow-hidden border border-slate-200 mb-5 shadow-inner bg-slate-50" style={{ height: 200 }}>
                        {/* 왼쪽: 문제 이미지 (정상) */}
                        <div className="flex-1 relative bg-white border-r border-slate-200 p-2 flex items-center justify-center">
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img
                                src={problemImageUrl}
                                alt="등록한 문제"
                                className="w-full h-full object-contain rounded-lg"
                            />
                            <div className="absolute bottom-2 left-2 bg-slate-900/80 text-white text-[9px] font-bold px-2 py-0.5 rounded-full">문제</div>
                        </div>

                        {/* 오른쪽: 해설 영역 (blur 처리 - 반쪽짜리) */}
                        <div className="flex-1 relative flex flex-col items-center justify-center gap-2 p-3 select-none">
                            {/* blur 콘텐츠 */}
                            <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 p-3 blur-[6px] opacity-40">
                                <div className="w-3/4 h-3 bg-slate-300 rounded-full" />
                                <div className="w-1/2 h-3 bg-slate-300 rounded-full" />
                                <div className="w-2/3 h-3 bg-slate-300 rounded-full" />
                                <div className="w-full h-16 bg-slate-200 rounded-xl mt-2" />
                                <div className="w-3/4 h-3 bg-slate-300 rounded-full" />
                            </div>
                            {/* 중앙 오버레이 텍스트 */}
                            <div className="relative z-10 text-center">
                                <div className="text-slate-400 text-[10px] font-bold">✍️ 해설 영역</div>
                                <div className="text-slate-300 text-[9px] mt-0.5">작성 후 완성</div>
                            </div>
                        </div>
                    </div>

                    {/* 심리 자극 문구 */}
                    <p className="text-slate-600 text-sm leading-relaxed text-center mb-5">
                        여기에 손글씨 풀이만 추가하면,<br />
                        <span className="font-black text-slate-900">세상에 하나뿐인 당신만의 오답 노트</span>가 완성됩니다.
                    </p>

                    {/* CTA 버튼 */}
                    <button
                        onClick={onStart}
                        className="w-full py-4 rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-black text-base shadow-lg shadow-blue-500/30 hover:from-blue-700 hover:to-indigo-700 transition-all hover:-translate-y-0.5 active:translate-y-0 flex items-center justify-center gap-2"
                    >
                        <span>✏️</span>
                        <span>지금 30초 만에 해설 쓰고 완성하기</span>
                        <span className="ml-1">→</span>
                    </button>

                    <button
                        onClick={onSkip}
                        className="w-full mt-2 py-2.5 text-slate-600 text-sm font-bold hover:text-slate-900 transition-colors underline underline-offset-2"
                    >
                        지금은 건너뛰고 대시보드로 →
                    </button>
                </div>
            </div>
        </div>
    );
}

// ============================================================
// Main Page
// ============================================================
export default function UploadPage() {
    const router = useRouter();

    const [imageFile, setImageFile] = useState<File | null>(null);
    const [preview, setPreview] = useState<string | null>(null);
    const [subject, setSubject] = useState<Subject>("수학1");
    const [selectedUnits, setSelectedUnits] = useState<string[]>([]);
    const [importance, setImportance] = useState<number>(2);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const fileRef = useRef<HTMLInputElement>(null);

    // ✅ 등록 완료 팝업 상태
    const [completedProblemId, setCompletedProblemId] = useState<string | null>(null);
    const [completedImageUrl, setCompletedImageUrl] = useState<string | null>(null);

    function onFileChange(e: React.ChangeEvent<HTMLInputElement>) {
        const file = e.target.files?.[0];
        if (!file) return;
        setImageFile(file);
        setPreview(URL.createObjectURL(file));
    }

    function toggleUnit(unit: string) {
        setSelectedUnits((prev) =>
            prev.includes(unit) ? prev.filter((u) => u !== unit) : [...prev, unit]
        );
    }

    async function handleSubmit() {
        if (!imageFile) { setError("문제 사진을 먼저 선택해 주세요."); return; }
        if (selectedUnits.length === 0) { setError("단원을 최소 1개 선택해 주세요."); return; }

        setLoading(true);
        setError(null);

        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) throw new Error("로그인이 필요합니다.");

            // 1. Storage에 이미지 업로드
            const ext = imageFile.name.split(".").pop();
            const filename = `${user.id}/${Date.now()}.${ext}`;
            const { error: uploadError } = await supabase.storage
                .from("problems")
                .upload(filename, imageFile, { upsert: false });
            if (uploadError) throw uploadError;

            // 2. Public URL 가져오기
            const { data: urlData } = supabase.storage
                .from("problems")
                .getPublicUrl(filename);

            // 3. DB에 문제 저장
            const { data: insertedData, error: dbError } = await supabase.from("problems").insert({
                user_id: user.id,
                subject,
                unit_tags: selectedUnits,
                image_url: urlData.publicUrl,
                memo: "",
                status: "saved",
                importance: importance,
                solve_count: 0,
            }).select("id").single();

            if (dbError) throw dbError;

            if (insertedData?.id) {
                // ✅ 등록 완료 팝업 표시 (바로 이동하지 않고 팝업 먼저)
                setCompletedProblemId(insertedData.id);
                setCompletedImageUrl(urlData.publicUrl);
            } else {
                router.push("/dashboard");
            }
        } catch (e: any) {
            setError(e.message || "저장 중 오류가 발생했어요.");
        } finally {
            setLoading(false);
        }
    }

    return (
        <div className="flex min-h-screen bg-slate-50 relative">
            {/* ✅ 등록 완료 팝업 */}
            {completedProblemId && completedImageUrl && (
                <RegistrationSuccessPopup
                    problemId={completedProblemId}
                    problemImageUrl={completedImageUrl}
                    onStart={() => router.push(`/problem/${completedProblemId}`)}
                    onSkip={() => router.push("/dashboard")}
                />
            )}

            {/* 우상단 X 버튼 → 메인 랜딩 페이지로 */}
            <button
                onClick={() => router.push("/")}
                className="absolute top-5 right-5 z-50 w-10 h-10 rounded-full bg-white border border-slate-200 shadow-md flex items-center justify-center text-slate-500 hover:text-slate-900 hover:bg-slate-100 transition font-bold text-lg"
                title="홈으로 돌아가기"
            >
                ✕
            </button>

            {/* 왼쪽: 브랜드 철학 / 그래픽 (데스크탑에서만 보임) */}
            <div className="hidden lg:flex lg:w-[42%] bg-slate-900 flex-col justify-between p-[clamp(2rem,5vw,4rem)] text-white relative overflow-hidden">
                <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_top_right,_var(--tw-gradient-stops))] from-blue-900/40 via-slate-900 to-slate-900" />
                <div className="relative z-10 w-full max-w-md">
                    <h1 className="text-[clamp(1.5rem,3vw,2.25rem)] font-bold tracking-tight mb-4">ReMath 오답 등록</h1>
                    <p className="text-slate-400 leading-relaxed font-medium text-[clamp(0.875rem,1.1vw,1rem)]">
                        하나를 제대로 푸는 것이 열 문제를 기계적으로 푸는 것보다 낫습니다.
                        틀린 문제를 찍고, 당신의 언어로 해설을 등록하세요.
                    </p>
                </div>

                {/* 그래픽 장식 */}
                <div className="relative z-10 w-full max-w-md mt-16 aspect-square rounded-[clamp(1.5rem,3vw,2.5rem)] bg-slate-800/50 border border-slate-700 p-8 flex flex-col gap-4 overflow-hidden backdrop-blur-sm shadow-2xl">
                    <div className="absolute top-4 right-4 bg-action/20 text-action text-[10px] font-bold px-3 py-1 rounded-full border border-action/30">Auto Categorization</div>
                    <div className="w-16 h-16 bg-blue-500 rounded-2xl flex items-center justify-center text-3xl mb-2 shadow-lg shadow-blue-500/30">📸</div>
                    <div className="space-y-3 mt-4">
                        <div className="h-4 w-3/4 bg-slate-700/50 rounded-full"></div>
                        <div className="h-4 w-1/2 bg-slate-700/50 rounded-full"></div>
                    </div>
                </div>

                <div className="relative z-10 mt-auto pt-16">
                    <p className="text-xs font-bold text-slate-500 tracking-wider">ReMath.AI 2026</p>
                </div>
            </div>

            {/* 오른쪽: 업로드 기능 */}
            <div className="w-full lg:w-[58%] flex items-center justify-center p-[var(--rm-pad-x)]">
                <div className="w-full max-w-[clamp(320px,95%,520px)]">
                    <div className="mb-10 lg:hidden">
                        <h1 className="text-[clamp(1.5rem,4vw,2rem)] font-bold text-slate-900 mb-2">문제 보관하기</h1>
                        <p className="text-sm text-slate-500">방금 틀린 문제를 찍어 나만의 책장에 보관하세요.</p>
                    </div>

                    <div className="space-y-[clamp(1.5rem,4vh,2.5rem)]">
                        {/* 1. 이미지 업로드/미리보기 구역 */}
                        <div>
                            <div className="flex items-center justify-between mb-4">
                                <label className="text-sm font-bold text-slate-700">1. 문제 사진 등록</label>
                            </div>

                            {preview ? (
                                <div
                                    className="relative flex flex-col items-center justify-center w-full h-[clamp(240px,40vh,360px)] rounded-[clamp(1.5rem,3vw,2rem)] overflow-hidden shadow-xl cursor-pointer group border border-slate-200"
                                    onClick={() => setPreview(null)}
                                >
                                    <Image src={preview} alt="문제 미리보기" fill className="object-contain bg-slate-100" />
                                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                        <span className="bg-white/90 text-slate-900 px-6 py-3 rounded-full text-sm font-bold shadow-lg">사진 삭제하기</span>
                                    </div>
                                </div>
                            ) : (
                                <div className="grid grid-cols-2 gap-4">
                                    {/* 카메라 버튼 */}
                                    <div
                                        onClick={() => document.getElementById('cameraInput')?.click()}
                                        className="relative flex flex-col items-center justify-center w-full aspect-[4/3] rounded-[clamp(1.25rem,2.5vw,2rem)] border-2 border-slate-200 bg-white hover:border-action hover:bg-blue-50/50 transition-all cursor-pointer shadow-sm group min-h-[140px]"
                                    >
                                        <div className="w-14 h-14 mb-3 rounded-2xl bg-blue-50 border border-blue-100 flex items-center justify-center text-3xl shadow-inner group-hover:bg-blue-100 transition">📸</div>
                                        <div className="text-center text-sm font-bold text-slate-700">직접 촬영하기</div>
                                    </div>

                                    {/* 앨범 버튼 */}
                                    <div
                                        onClick={() => fileRef.current?.click()}
                                        className="relative flex flex-col items-center justify-center w-full aspect-[4/3] rounded-[clamp(1.25rem,2.5vw,2rem)] border-2 border-slate-200 bg-white hover:border-action hover:bg-blue-50/50 transition-all cursor-pointer shadow-sm group min-h-[140px]"
                                    >
                                        <div className="w-14 h-14 mb-3 rounded-2xl bg-slate-50 border border-slate-200 flex items-center justify-center text-3xl shadow-inner group-hover:bg-slate-200 transition">🖼️</div>
                                        <div className="text-center text-sm font-bold text-slate-700">앨범에서 선택</div>
                                    </div>
                                </div>
                            )}

                            {/* 숨김 Input 두 개 */}
                            <input
                                id="cameraInput"
                                type="file"
                                accept="image/*"
                                capture="environment"
                                className="hidden"
                                onChange={onFileChange}
                            />
                            <input
                                ref={fileRef}
                                id="galleryInput"
                                type="file"
                                accept="image/*"
                                className="hidden"
                                onChange={onFileChange}
                            />
                        </div>

                        {/* 2. 과목/단원 선택 */}
                        <div>
                            <label className="text-sm font-bold text-slate-700 mb-3 block">2. 과목 및 단원 선택</label>
                            <div className="p-1.5 bg-slate-200/50 rounded-2xl flex gap-1 mb-4 overflow-x-auto hide-scrollbar">
                                {SUBJECTS.map((s) => (
                                    <button
                                        key={s}
                                        onClick={() => { setSubject(s); setSelectedUnits([]); }}
                                        className={`shrink-0 px-4 py-2.5 text-sm font-bold rounded-xl transition min-h-[44px] ${subject === s ? "bg-white text-action shadow-sm" : "text-slate-500 hover:text-slate-700"
                                            }`}
                                    >
                                        {s}
                                    </button>
                                ))}
                            </div>
                            <div className="flex flex-wrap gap-2">
                                {UNITS[subject].map((unit) => (
                                    <button
                                        key={unit}
                                        onClick={() => toggleUnit(unit)}
                                        className={`px-4 py-2.5 text-sm font-medium rounded-xl border transition min-h-[44px] ${selectedUnits.includes(unit)
                                            ? "border-action bg-blue-50 text-action"
                                            : "border-slate-200 text-slate-600 bg-white hover:border-slate-300"
                                            }`}
                                    >
                                        {unit}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* 3. 중요도 선택 */}
                        <div>
                            <label className="text-sm font-bold text-slate-700 mb-3 flex items-center gap-2">
                                3. 문제 중요도
                                <span className="text-[10px] bg-slate-200 text-slate-600 px-2 py-0.5 rounded-md font-medium">ReMath 전용</span>
                            </label>
                            <div className="flex gap-3">
                                {[1, 2, 3].map((num) => (
                                    <button
                                        key={num}
                                        onClick={() => setImportance(num)}
                                        className={`flex-1 py-4 flex justify-center gap-1 rounded-xl border transition min-h-[52px] ${importance >= num
                                            ? "border-yellow-400 bg-yellow-50 text-yellow-500"
                                            : "border-slate-200 bg-white text-slate-300"
                                            }`}
                                    >
                                        <svg viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6"><path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z" /></svg>
                                    </button>
                                ))}
                            </div>
                            <p className="text-xs text-slate-500 mt-2 text-center font-medium">
                                {importance === 1 ? '실수 방지용' : importance === 2 ? '응용 필수 문제' : '고난도 킬러 문제'}
                            </p>
                        </div>

                        {error && (
                            <div className="p-4 bg-red-50 rounded-xl border border-red-100 text-sm text-red-600 font-medium">
                                {error}
                            </div>
                        )}

                        <div className="pt-6 border-t border-slate-200">
                            <button
                                onClick={handleSubmit}
                                disabled={loading}
                                className="w-full bg-slate-900 text-white rounded-[1.25rem] py-4 text-base font-bold shadow-lg shadow-slate-900/20 hover:bg-slate-800 hover:-translate-y-0.5 disabled:opacity-50 disabled:hover:translate-y-0 transition-all flex items-center justify-center gap-2 min-h-[56px]"
                            >
                                {loading ? "처리 중..." : "등록하고 내 해설 쓰러가기"}
                                {!loading && <svg viewBox="0 0 24 24" fill="none" className="w-4 h-4" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 18 15 12 9 6" /></svg>}
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
