"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import type { Problem } from "@/types";

const ADMIN_EMAIL = process.env.NEXT_PUBLIC_ADMIN_EMAIL || "";

function cx(...xs: Array<string | false | null | undefined>) {
  return xs.filter(Boolean).join(" ");
}

// ✅ 과목별 20문제까지 무료 풀이수정
const FREE_EDIT_LIMIT = 20;

export default function NotebookFlip({
  problems,
  subjectLabel,
  activeUnit,
  onUnitChange,
  focusId,
  isPro,
  onOpenPdf,
  onOpenTestPdf,
  userEmail,
}: {
  problems: Problem[];
  subjectLabel: string;
  activeUnit: string;
  onUnitChange: (u: string) => void;
  focusId?: string | null;
  isPro: boolean;
  onOpenPdf: (preview?: boolean) => void;
  onOpenTestPdf: (preview?: boolean) => void;
  userEmail?: string;
}) {
  // 관리자 계정이면 isPro처럼 취급
  const isAdmin = Boolean(ADMIN_EMAIL && userEmail === ADMIN_EMAIL);
  const effectiveIsPro = isPro || isAdmin;

  const units = useMemo(() => {
    const set = new Set<string>();
    for (const p of problems) {
      if (p.unit_tags?.length) p.unit_tags.forEach((t) => set.add(t));
      else set.add("기타");
    }
    return ["전체", ...Array.from(set)];
  }, [problems]);

  const filtered = useMemo(() => {
    if (activeUnit === "전체") return problems;
    return problems.filter((p) =>
      p.unit_tags?.length ? p.unit_tags.includes(activeUnit) : activeUnit === "기타"
    );
  }, [problems, activeUnit]);

  const [idx, setIdx] = useState(0);
  const [anim, setAnim] = useState<"next" | "prev" | "">("");
  const [imgModal, setImgModal] = useState<string | null>(null);
  const [paywall, setPaywall] = useState(false);
  const [editPaywall, setEditPaywall] = useState(false);

  const PREVIEW_LIMIT = 2;

  useEffect(() => {
    setIdx(0);
  }, [activeUnit]);

  // 대시보드 카드에서 특정 문제로 바로 진입
  useEffect(() => {
    if (!focusId) return;
    const found = filtered.findIndex((p) => p.id === focusId);
    if (found >= 0) setIdx(found);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [focusId, activeUnit, filtered.length]);

  // ✅ idx가 순간적으로 범위를 벗어나는 경우가 있어서 안전한 current를 만든다 (hooks 깨짐 방지)
  const safeIdx = filtered.length ? Math.min(idx, filtered.length - 1) : 0;
  const current = filtered[safeIdx];
  const hasItems = filtered.length > 0;


  // ✅ 캐시/순간 스왑 방지: 문제 row의 updated_at(없으면 created_at) 기반으로 버전 부여
  const handwritingUrl = hasItems ? ((current as any)?.handwriting_url as string | null) : null;
  const version = hasItems
    ? ((current as any)?.updated_at ?? (current as any)?.created_at ?? Date.now())
    : Date.now();

  const handwritingSrc =
    hasItems && handwritingUrl
      ? `${handwritingUrl}${handwritingUrl.includes("?") ? "&" : "?"}v=${encodeURIComponent(String(version))}`
      : null;

  const go = (dir: "next" | "prev") => {
    if (!filtered.length) return;
    if (dir === "next" && idx >= filtered.length - 1) return;
    if (dir === "prev" && idx <= 0) return;

    if (
      !effectiveIsPro &&
      dir === "next" &&
      filtered.length > PREVIEW_LIMIT &&
      idx >= PREVIEW_LIMIT - 1
    ) {
      setPaywall(true);
      return;
    }

    setAnim(dir);
    // 페이지가 끝까지 넘어가는 느낌을 위해, 인덱스 변경을 애니메이션 후반부로 미룸
    window.setTimeout(() => {
      setIdx((v) => v + (dir === "next" ? 1 : -1));
    }, 420);
    window.setTimeout(() => setAnim(""), 520);
  };

  // ✅ 스와이프/드래그는 오작동(버튼 클릭이 next로 먹힘) 위험이 커서 완전히 제거
  // ✅ 대신 키보드 ← → 로 넘김(PC UX)
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      // input/textarea/contenteditable에서는 키 넘김 막기
      const t = e.target as HTMLElement | null;
      if (t) {
        const tag = t.tagName?.toLowerCase();
        if (tag === "input" || tag === "textarea" || (t as any).isContentEditable) return;
      }
      if (e.key === "ArrowRight") go("next");
      if (e.key === "ArrowLeft") go("prev");
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [idx, filtered.length, effectiveIsPro, activeUnit]);

  useEffect(() => {
    if (filtered.length === 0) return;
    if (idx > filtered.length - 1) setIdx(0);
  }, [filtered.length, idx]);

  // ✅ 풀이 수정 클릭: 과목별 20문제 이하면 허용, 초과면 PRO 유도
  const handleEditClick = (e: React.MouseEvent, problemId: string) => {
    if (effectiveIsPro) return; // PRO면 바로 이동

    const sameSubjectProblems = problems.filter((p) => p.subject === current?.subject);
    const posInSubject = sameSubjectProblems.findIndex((p) => p.id === problemId);
    if (posInSubject < FREE_EDIT_LIMIT) return; // 20번째 이하: 허용(링크 동작)

    // 20번째 초과: 막기
    e.preventDefault();
    setEditPaywall(true);
  };

  return (
    <div className="w-full">
      {/* 상단 바: NOTEBOOK 라벨 + PDF 버튼 */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0">
          <div className="text-[10px] font-black tracking-[0.2em] text-slate-400">NOTEBOOK</div>
          <div className="text-[clamp(1.25rem,4vw,1.875rem)] font-black text-slate-900 truncate leading-tight mt-1">{subjectLabel}</div>
          <div className="text-sm text-slate-500 font-medium mt-1">
            ← → 키보드로 빠르게 복습하세요.
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => (effectiveIsPro ? onOpenPdf(false) : onOpenPdf(true))}
            className={cx(
              "px-4 py-2.5 rounded-xl font-bold text-sm border min-h-[44px] flex items-center justify-center",
              effectiveIsPro
                ? "bg-slate-900 text-white border-slate-900 hover:bg-slate-800"
                : "bg-white text-slate-700 border-slate-200 hover:bg-slate-50"
            )}
          >
            📄 {subjectLabel} pdf{effectiveIsPro ? "" : " 미리보기"}
          </button>
          <button
            onClick={() => (effectiveIsPro ? onOpenTestPdf(false) : onOpenTestPdf(true))}
            className={cx(
              "px-4 py-2.5 rounded-xl font-bold text-sm border min-h-[44px] flex items-center justify-center",
              effectiveIsPro
                ? "bg-action text-white border-action hover:bg-blue-600"
                : "bg-white text-slate-700 border-slate-200 hover:bg-slate-50"
            )}
          >
            🖨️ {subjectLabel.replace("오답노트", "시험지")} pdf{effectiveIsPro ? "" : " 미리보기"}
          </button>
        </div>
      </div>

      {/* 단원 필터 칩 */}
      <div className="mt-6 flex items-center gap-2 overflow-x-auto pb-2 -mx-1 px-1 hide-scrollbar">
        {units.map((u) => {
          const on = u === activeUnit;
          const cnt =
            u === "전체"
              ? problems.length
              : problems.filter((p) =>
                p.unit_tags?.length ? p.unit_tags.includes(u) : u === "기타"
              ).length;
          return (
            <button
              key={u}
              onClick={() => onUnitChange(u)}
              className={cx(
                "shrink-0 px-4 py-2 rounded-full text-sm font-bold border transition min-h-[38px]",
                on
                  ? "bg-slate-900 border-slate-900 text-white shadow-md shadow-slate-900/10"
                  : "bg-white border-slate-200 text-slate-600 hover:border-slate-300"
              )}
            >
              {u}{" "}
              <span className={cx("ml-1 text-[10px]", on ? "text-white/70" : "text-slate-400 font-medium")}>
                {cnt}
              </span>
            </button>
          );
        })}
      </div>

      {/* 책 뷰어 */}
      <div className="mt-8">
        {!filtered.length ? (
          <div className="bg-white rounded-[clamp(1.5rem,3vw,2rem)] border border-slate-200 shadow-sm p-[clamp(2rem,5vw,4rem)] text-center">
            <div className="text-4xl mb-4">📭</div>
            <div className="text-lg font-black text-slate-900">이 단원에는 아직 문제가 없어요</div>
            <p className="text-sm text-slate-500 mt-2">오답을 등록하면 여기서 책처럼 볼 수 있어요.</p>
            <div className="mt-8 flex justify-center gap-2">
              <Link
                href="/upload"
                className="px-6 py-3 rounded-xl bg-slate-900 text-white font-bold hover:bg-slate-800 min-h-[44px] flex items-center"
              >
                + 새 오답 등록
              </Link>
              <Link
                href="/dashboard"
                className="px-6 py-3 rounded-xl bg-white border border-slate-200 text-slate-700 font-bold hover:bg-slate-50 min-h-[44px] flex items-center"
              >
                ← 책장
              </Link>
            </div>
          </div>
        ) : (
          <div className="relative">
            {/* 페이지 카운터 + PRO 배너 */}
            <div className="flex items-center justify-between mb-4 text-sm font-bold text-slate-600">
              <div>
                <span className="text-slate-900 font-black">{idx + 1}</span> / {filtered.length}
                {!effectiveIsPro && filtered.length > PREVIEW_LIMIT && (
                  <span className="ml-3 text-xs font-black text-amber-600">
                    미리보기 {PREVIEW_LIMIT}문항
                  </span>
                )}
              </div>
              {!effectiveIsPro && filtered.length > PREVIEW_LIMIT && (
                <Link
                  href="/plans"
                  className="text-xs font-black px-4 py-2 rounded-xl text-white pro-shimmer hover:opacity-90 transition min-h-[36px] flex items-center"
                >
                  ⚡ PRO로 전체 보기
                </Link>
              )}
            </div>

            {/* ========== 책 본문 (3D flip 적용) ========== */}
            <div
              className={cx(
                "bg-white rounded-[clamp(1.5rem,3vw,2.5rem)] border border-slate-200 shadow-lg overflow-hidden select-none relative",
                "transition-shadow duration-300",
                anim === "next" && "book-shell-next",
                anim === "prev" && "book-shell-prev"
              )}
              style={{
                boxShadow:
                  "0 8px 40px rgba(0,0,0,0.10), inset 0 0 0 1px rgba(226,232,240,0.8)",
              }}
            >
              {/* 바인더 상단 라인 */}
              <div className="h-2.5 bg-gradient-to-r from-slate-900 via-blue-600 to-slate-900" />

              {/* ✅ 좌/우 화살표: '전체 높이' 덮지 말고 중앙만(버튼/배너 클릭 영역 침범 방지) */}
              <button
                aria-label="이전 페이지"
                onClick={() => go("prev")}
                disabled={idx <= 0}
                className={cx(
                  "absolute left-2 top-1/2 -translate-y-1/2 z-20",
                  "h-16 w-16 flex items-center justify-center",
                  "text-slate-900/50 hover:text-slate-900 disabled:opacity-20 transition"
                )}
              >
                <div className="h-11 w-11 rounded-full bg-white/80 backdrop-blur-md border border-slate-200 flex items-center justify-center shadow-sm text-lg font-black">
                  ‹
                </div>
              </button>

              <button
                aria-label="다음 페이지"
                onClick={() => go("next")}
                disabled={idx >= filtered.length - 1}
                className={cx(
                  "absolute right-2 top-1/2 -translate-y-1/2 z-20",
                  "h-16 w-16 flex items-center justify-center",
                  "text-slate-900/50 hover:text-slate-900 disabled:opacity-20 transition"
                )}
              >
                <div className="h-11 w-11 rounded-full bg-white/80 backdrop-blur-md border border-slate-200 flex items-center justify-center shadow-sm text-lg font-black">
                  ›
                </div>
              </button>

              {/* 중앙 스프링(바인딩) */}
              <div className="book-spine" aria-hidden />

              {/* ========== 좌우 2컬럼 ========== */}
              <div className="grid md:grid-cols-2 min-h-[clamp(540px,65vh,800px)] relative">
                {/* 왼쪽: 문제 이미지 */}
                <div
                  className={cx(
                    "page-left relative bg-[#F8F9FB] p-[clamp(1.5rem,3vw,2.5rem)] border-b md:border-b-0 md:border-r border-slate-200 notebook-lines",
                    anim === "prev" && "page-left-flip"
                  )}
                >
                  <div className="relative">
                    <div className="flex items-center justify-between mb-4">
                      <div className="text-[10px] font-black text-slate-400 tracking-widest">
                        PROBLEM
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="text-[11px] font-bold text-amber-500">
                          ★ {current.importance ?? 2}
                        </div>
                        <span
                          className={cx(
                            "text-[10px] font-black px-2 py-0.5 rounded-full",
                            current.status === "mastered"
                              ? "bg-green-100 text-green-700"
                              : current.status === "review"
                                ? "bg-blue-100 text-blue-700"
                                : "bg-slate-100 text-slate-500"
                          )}
                        >
                          {current.status === "mastered"
                            ? "✅ 마스터"
                            : current.status === "review"
                              ? "🔄 다시보기"
                              : "📚 보관"}
                        </span>
                      </div>
                    </div>
                    <div className="bg-white p-2 rounded-[clamp(1rem,2vw,1.5rem)] border border-slate-200 shadow-md">
                      <Image
                        src={current.image_url}
                        alt="문제"
                        width={900}
                        height={1200}
                        className="w-full h-auto object-contain rounded-xl"
                      />
                    </div>
                  </div>
                </div>

                {/* 오른쪽: MY NOTE */}
                <div
                  className={cx(
                    "page-right p-[clamp(1.5rem,3vw,2.5rem)] bg-[#fffdf7] notebook-lines",
                    anim === "next" && "page-right-flip"
                  )}
                >
                  <div className="flex items-start justify-between gap-3 mb-6">
                    <div className="min-w-0">
                      <div className="text-[10px] font-black text-slate-400 tracking-widest">
                        MY NOTE
                      </div>
                      <div className="text-base font-black text-slate-900 mt-1 truncate">
                        {current.subject} · {current.unit_tags?.[0] || "기타"}
                      </div>
                      <div className="text-[10px] text-slate-400 font-bold mt-0.5 uppercase">
                        {new Date(current.created_at).toLocaleDateString("ko-KR")}
                      </div>
                    </div>

                    {/* ✅ 풀이 수정 버튼: 과목별 20문제까지 무료 */}
                    {(() => {
                      const sameSubjectProbs = problems.filter((p) => p.subject === current.subject);
                      const posInSubject = sameSubjectProbs.findIndex((p) => p.id === current.id);
                      const canEditFree = effectiveIsPro || posInSubject < FREE_EDIT_LIMIT;

                      if (canEditFree) {
                        return (
                          <Link
                            href={`/problem/${current.id}`}
                            onClick={(e) => {
                              e.stopPropagation();
                              handleEditClick(e as any, current.id);
                            }}
                            // ✅ 어떤 환경에서도 클릭이 넘어가지 않게 이벤트 보호
                            onPointerDown={(e) => e.stopPropagation()}
                            onPointerUp={(e) => e.stopPropagation()}
                            className="px-4 py-2.5 rounded-xl bg-slate-900 text-white font-bold text-xs hover:bg-slate-800 shrink-0 transition min-h-[44px] flex items-center"
                          >
                            ✍️ 풀이 수정
                          </Link>
                        );
                      }

                      return (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setEditPaywall(true);
                          }}
                          onPointerDown={(e) => e.stopPropagation()}
                          onPointerUp={(e) => e.stopPropagation()}
                          className="px-4 py-2.5 rounded-xl text-white font-bold text-xs shrink-0 pro-shimmer save-pulse min-h-[44px] flex items-center"
                        >
                          🔒 PRO로 수정
                        </button>
                      );
                    })()}
                  </div>

                  {/* 메인: 손글씨 스냅샷 */}
                  <div className="rounded-[clamp(1rem,2vw,1.5rem)] border border-slate-200 bg-white overflow-hidden shadow-sm">
                    {handwritingUrl ? (
                      <div className="max-h-[clamp(320px,40vh,480px)] overflow-y-auto">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          key={`${current.id}_${String(version)}`}
                          src={handwritingSrc ?? ""}
                          alt="손글씨 풀이"
                          className="w-full h-auto object-contain bg-white"
                          onClick={() => setImgModal(handwritingSrc ?? handwritingUrl)}
                          style={{ cursor: "zoom-in" }}
                        />
                      </div>
                    ) : (
                      <div className="h-[300px] flex items-center justify-center bg-white p-6">
                        <div className="text-center">
                          <div className="text-3xl mb-3">✍️</div>
                          <div className="text-sm font-black text-slate-800">
                            손글씨 풀이가 아직 없어요
                          </div>
                          <div className="text-xs text-slate-500 mt-2 leading-relaxed max-w-[200px] mx-auto">
                            풀이 수정에서 오른쪽 백지에 쓰고 전체 저장을 눌러주세요.
                          </div>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* 서브: 텍스트 해설만 (memo_handwriting_url 제거) */}
                  <details className="mt-4 rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">
                    <summary className="cursor-pointer px-4 py-3.5 font-black text-slate-800 text-sm hover:bg-slate-50 transition-colors select-none">
                      📝 내 해설 / 오답 포인트
                    </summary>
                    <div className="px-4 pb-4">
                      <div className="whitespace-pre-wrap text-sm text-slate-700 leading-relaxed font-medium bg-slate-50/50 border border-slate-200 rounded-xl p-4">
                        {current.memo?.trim() ? current.memo : "(해설 없음)"}
                      </div>
                    </div>
                  </details>

                  {/* 서브: 풀이 사진 */}
                  {(current as any).solution_url && (
                    <details className="mt-2 rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">
                      <summary className="cursor-pointer px-4 py-3.5 font-black text-slate-800 text-sm hover:bg-slate-50 transition-colors select-none">
                        📎 풀이 사진
                      </summary>
                      <div className="px-4 pb-4">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={(current as any).solution_url}
                          alt="풀이 이미지"
                          className="w-full max-h-[300px] object-contain rounded-xl border border-slate-200 bg-white"
                          onClick={() => setImgModal((current as any).solution_url)}
                          style={{ cursor: "zoom-in" }}
                        />
                        {(current as any).solution_memo?.trim() && (
                          <div className="mt-3 whitespace-pre-wrap text-sm text-slate-700 leading-relaxed font-medium bg-[#fffdf7] border border-slate-200 rounded-xl p-4">
                            {(current as any).solution_memo}
                          </div>
                        )}
                      </div>
                    </details>
                  )}
                </div>
              </div>

              {/* =====  PRO 페이지 잠금 오버레이 ===== */}
              {paywall && (
                <div className="absolute inset-0 z-30 bg-white/80 backdrop-blur-sm flex items-center justify-center p-6">
                  <div className="max-w-sm w-full rounded-[2rem] border border-slate-200 bg-white shadow-2xl p-8 text-center animate-in fade-in zoom-in duration-300">
                    <div className="text-4xl mb-4">🔒</div>
                    <div className="text-xl font-black text-slate-900">여기부터는 PRO</div>
                    <p className="text-sm text-slate-600 mt-2 leading-relaxed">
                      미리보기는 <b>{PREVIEW_LIMIT}문항</b>까지만 볼 수 있어요.
                      <br />
                      PRO로 업그레이드하면 전체 오답노트를 책처럼 볼 수 있어요.
                    </p>
                    <div className="mt-8 flex gap-3">
                      <button
                        onClick={() => setPaywall(false)}
                        className="flex-1 px-4 py-3.5 rounded-xl border border-slate-200 font-bold text-slate-700 hover:bg-slate-50 transition min-h-[48px]"
                      >
                        닫기
                      </button>
                      <Link
                        href="/plans"
                        className="flex-1 px-4 py-3.5 rounded-xl bg-amber-500 text-white font-black hover:bg-amber-600 text-center transition min-h-[48px] flex items-center justify-center"
                      >
                        ⚡ PRO 보기
                      </Link>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* 풀이 수정 PRO 유도 모달 */}
      {editPaywall && (
        <div
          className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4"
          onClick={() => setEditPaywall(false)}
        >
          <div
            className="w-full max-w-sm rounded-3xl bg-white shadow-2xl p-7 text-center"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="text-4xl mb-3">✍️🔒</div>
            <div className="text-xl font-black text-slate-900">풀이 수정은 PRO 전용</div>
            <p className="text-sm text-slate-600 mt-2 leading-relaxed">
              각 과목별 <b>{FREE_EDIT_LIMIT}문제</b>까지는 무료로 수정할 수 있어요.
              <br />
              PRO로 업그레이드하면 <b>모든 문제를 무제한</b>으로 수정할 수 있어요.
            </p>
            <div className="mt-5 flex gap-2">
              <button
                onClick={() => setEditPaywall(false)}
                className="flex-1 px-4 py-3 rounded-xl border border-slate-200 font-bold text-slate-700 hover:bg-slate-50"
              >
                닫기
              </button>
              <Link
                href="/plans"
                className="flex-1 px-4 py-3 rounded-xl bg-amber-500 text-white font-black hover:bg-amber-600 text-center save-pulse"
              >
                ⚡ PRO 업그레이드
              </Link>
            </div>
          </div>
        </div>
      )}

      {/* 이미지 확대 모달 */}
      {imgModal && (
        <div
          className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-4"
          onClick={() => setImgModal(null)}
        >
          <div
            className="max-w-5xl w-full bg-white rounded-2xl overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={imgModal} alt="확대" className="w-full h-auto object-contain" />
          </div>
          <button
            className="fixed top-5 right-5 w-10 h-10 rounded-full bg-white/20 text-white font-bold flex items-center justify-center hover:bg-white/30"
            onClick={() => setImgModal(null)}
          >
            ✕
          </button>
        </div>
      )}
    </div>
  );
}