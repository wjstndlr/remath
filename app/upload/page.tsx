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

export default function UploadPage() {
    const router = useRouter();

    const [imageFile, setImageFile] = useState<File | null>(null);
    const [preview, setPreview] = useState<string | null>(null);
    const [subject, setSubject] = useState<Subject>("수학1");
    const [selectedUnits, setSelectedUnits] = useState<string[]>([]);
    const [importance, setImportance] = useState<number>(2); // 1~3
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const fileRef = useRef<HTMLInputElement>(null);

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

            // 3. DB에 문제 저장 (status를 saved 로 가정, schema 변경 필요 시 별도로 진행)
            const { data: insertedData, error: dbError } = await supabase.from("problems").insert({
                user_id: user.id,
                subject,
                unit_tags: selectedUnits,
                image_url: urlData.publicUrl,
                // ✅ memo는 "해설/오답 포인트" 용도. 업로드 단계에서는 비워두고,
                //    /problem/[id] 에서 사용자가 직접 해설을 작성하게 한다.
                memo: "",
                status: "saved",
                importance: importance,
                solve_count: 0,
            }).select("id").single();

            if (dbError) throw dbError;

            // 추가: 바로 문제 풀이/해설 등록 화면으로 이동!
            if (insertedData?.id) {
                router.push(`/problem/${insertedData.id}`);
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
