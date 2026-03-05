"use client";
import React, { useState, useRef, useEffect, useMemo, useCallback } from "react";
import { Stage, Layer, Line, Text, Rect } from "react-konva";
import { supabase } from "@/lib/supabase";
import type { KonvaEventObject } from "konva/lib/Node";

type Point = number;

interface LineData {
  id: string;
  points: Point[];
  color: string;
  strokeWidth: number;
  globalCompositeOperation: "source-over" | "destination-out";
}

interface TextData {
  id: string;
  x: number;
  y: number;
  text: string;
  fontSize: number;
  color: string;
  h?: number; // ✅ 실제 텍스트 높이(px) 저장 (캡쳐 안 잘리게)
}

type Snapshot = {
  lines: LineData[];
  texts: TextData[];
};

export default function InfiniteCanvas({
  problemId,
  onToast,
}: {
  problemId: string;
  onToast?: (msg: string) => void;
}) {
  const stageRef = useRef<any>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const [lines, setLines] = useState<LineData[]>([]);
  const [texts, setTexts] = useState<TextData[]>([]);
  const [isDrawing, setIsDrawing] = useState(false);
  const [tool, setTool] = useState<"pen" | "eraser" | "text" | "scroll">("pen");
  const [color, setColor] = useState("#000000");
  const [cloudSaving, setCloudSaving] = useState(false);

  const didInitRef = useRef(false);
  const [stageSize, setStageSize] = useState({ width: 800, height: 1200 });
  const [editingTextNode, setEditingTextNode] = useState<{ id: string; val: string } | null>(null);
  const [inputText, setInputText] = useState("");

  const STORAGE_KEY = `remath_canvas_${problemId}`;
  const TEXT_MARGIN_X = 24;

  // =========================
  // ✅ Undo/Redo (InfiniteCanvas 단독)
  // =========================
  const undoStackRef = useRef<Snapshot[]>([]);
  const redoStackRef = useRef<Snapshot[]>([]);
  const suppressHistoryRef = useRef(false); // undo/redo로 setLines/setTexts 할 때 push 막기
  const MAX_HISTORY = 80;

  const getSnapshot = useCallback((): Snapshot => {
    // deep-ish copy (points 배열 복사)
    const snapLines = lines.map((l) => ({ ...l, points: l.points.slice() }));
    const snapTexts = texts.map((t) => ({ ...t }));
    return { lines: snapLines, texts: snapTexts };
  }, [lines, texts]);

  const pushHistory = useCallback(() => {
    if (!didInitRef.current) return;
    if (suppressHistoryRef.current) return;

    const snap = getSnapshot();

    // 같은 상태 연속 저장(중복) 약간 방지: 마지막과 동일하면 skip
    const last = undoStackRef.current[undoStackRef.current.length - 1];
    const same =
      last &&
      JSON.stringify(last.lines) === JSON.stringify(snap.lines) &&
      JSON.stringify(last.texts) === JSON.stringify(snap.texts);

    if (!same) {
      undoStackRef.current.push(snap);
      if (undoStackRef.current.length > MAX_HISTORY) {
        undoStackRef.current.shift();
      }
    }
  }, [getSnapshot]);

  const canUndo = undoStackRef.current.length > 0;
  const canRedo = redoStackRef.current.length > 0;

  const doUndo = useCallback(() => {
    if (!canUndo) return;

    // 현재 상태는 redo로
    const currentSnap = getSnapshot();
    redoStackRef.current.push(currentSnap);
    if (redoStackRef.current.length > MAX_HISTORY) redoStackRef.current.shift();

    const prev = undoStackRef.current.pop()!;
    suppressHistoryRef.current = true;
    setLines(prev.lines);
    setTexts(prev.texts);
    // 다음 tick에 해제
    setTimeout(() => {
      suppressHistoryRef.current = false;
    }, 0);

    onToast?.("되돌리기 ↶");
  }, [canUndo, getSnapshot, onToast]);

  const doRedo = useCallback(() => {
    if (!canRedo) return;

    // 현재 상태는 undo로
    const currentSnap = getSnapshot();
    undoStackRef.current.push(currentSnap);
    if (undoStackRef.current.length > MAX_HISTORY) undoStackRef.current.shift();

    const next = redoStackRef.current.pop()!;
    suppressHistoryRef.current = true;
    setLines(next.lines);
    setTexts(next.texts);
    setTimeout(() => {
      suppressHistoryRef.current = false;
    }, 0);

    onToast?.("다시하기 ↷");
  }, [canRedo, getSnapshot, onToast]);

  // 키보드 단축키(데스크톱)
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const isMac = navigator.platform.toLowerCase().includes("mac");
      const mod = isMac ? e.metaKey : e.ctrlKey;

      if (!mod) return;

      // Ctrl/Cmd + Z
      if (e.key.toLowerCase() === "z" && !e.shiftKey) {
        e.preventDefault();
        doUndo();
      }
      // Ctrl/Cmd + Shift + Z OR Ctrl/Cmd + Y
      if ((e.key.toLowerCase() === "z" && e.shiftKey) || e.key.toLowerCase() === "y") {
        e.preventDefault();
        doRedo();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [doUndo, doRedo]);

  // =========================
  // Init: load local + size/resize
  // =========================
  useEffect(() => {
    // 1. 데이터 로드 (mount 시 1회)
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (parsed.lines) setLines(parsed.lines);
        if (parsed.texts) setTexts(parsed.texts);
        console.log("✅ [Canvas] 로컬 데이터 로드 완료");
      } catch (e) {
        console.error("❌ [Canvas] 로컬 데이터 파싱 에러", e);
      }
    }

    // 초기화: undo/redo 스택 비움
    undoStackRef.current = [];
    redoStackRef.current = [];
    didInitRef.current = true;

    // 2. 사이즈 측정 및 ResizeObserver 설정
    const el = containerRef.current;
    if (el) {
      const applySize = () => {
        setStageSize((prev) => ({
          width: el.offsetWidth,
          height: Math.max(prev.height, Math.max(1200, el.offsetHeight)),
        }));
      };

      applySize();

      let ro: ResizeObserver | null = null;
      if (typeof ResizeObserver !== "undefined") {
        ro = new ResizeObserver(() => applySize());
        ro.observe(el);
      } else {
        window.addEventListener("resize", applySize);
      }

      return () => {
        if (ro) ro.disconnect();
        window.removeEventListener("resize", applySize);
      };
    }
  }, [problemId, STORAGE_KEY]);

  // localStorage autosave
  useEffect(() => {
    const timer = setTimeout(() => {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({ lines, texts }));
    }, 1000);
    return () => clearTimeout(timer);
  }, [lines, texts, STORAGE_KEY]);

  // dirty 이벤트
  useEffect(() => {
    if (!didInitRef.current) return;
    window.dispatchEvent(new CustomEvent("remath_canvas_dirty", { detail: { problemId } }));
  }, [lines, texts, problemId]);

  // =========================
  // Content bounds (capture) - 사용자 요청: 사용자가 쓴 위치 그대로 상단 밀착 저장
  // =========================
  const getContentBounds = () => {
    let minX = Infinity,
      minY = Infinity,
      maxX = -Infinity,
      maxY = -Infinity;

    if (lines.length === 0 && texts.length === 0) return null;

    // 1. 선(Line) 범위 계산
    for (const l of lines) {
      for (let i = 0; i < l.points.length; i += 2) {
        const x = l.points[i];
        const y = l.points[i + 1];
        minX = Math.min(minX, x);
        minY = Math.min(minY, y);
        maxX = Math.max(maxX, x);
        maxY = Math.max(maxY, y);
      }
    }

    // 2. 텍스트(Text) 범위 계산
    for (const t of texts) {
      minX = Math.min(minX, t.x);
      minY = Math.min(minY, t.y);

      // 실제 텍스트가 차지하는 너비와 높이 반영 (SaaS 스타일의 타이트한 높이)
      const textW = t.x === TEXT_MARGIN_X ? stageSize.width - TEXT_MARGIN_X * 2 : 300;
      const textH = t.h ?? 32; // 기본 높이 축소하여 상단 밀착 유도

      maxX = Math.max(maxX, t.x + textW);
      maxY = Math.max(maxY, t.y + textH);
    }

    // 3. 최종 범위 결정 (콴다 스타일의 타이트한 여백)
    const padding = 24;

    if (!isFinite(minX) || !isFinite(minY)) return null;

    return {
      x: Math.max(0, minX - padding),
      y: Math.max(0, minY - padding),
      width: Math.min(stageSize.width, (maxX - minX) + padding * 2),
      height: Math.max(120, (maxY - minY) + padding * 2), // 최소 높이 보장
    };
  };

  // ☁️ 클라우드 저장 (원본 그대로)
  const saveToCloud = async (): Promise<string | null> => {
    console.log("🚀 [Canvas Save] 저장 프로세스 시작...");
    try {
      setCloudSaving(true);
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        console.error("❌ [Canvas Save] 로그인된 사용자가 없습니다.");
        throw new Error("로그인이 필요합니다.");
      }
      console.log("👤 [Canvas Save] 사용자 확인:", user.id);

      const stage = stageRef.current;
      if (!stage) {
        console.error("❌ [Canvas Save] Konva Stage를 찾을 수 없습니다.");
        throw new Error("캔버스 객체 오류");
      }

      const bounds = getContentBounds();
      if (!bounds) {
        console.warn("⚠️ [Canvas Save] 빈 캔버스 → handwriting_url 제거(DB 반영)");

        // ✅ 초기화/백지 상태를 "해설 없음"으로 DB에 반영
        const { error: clearErr } = await supabase
          .from("problems")
          .update({ handwriting_url: null })
          .eq("id", problemId);

        if (clearErr) {
          console.error("❌ [Canvas Save] handwriting_url 제거 실패:", clearErr);
          throw clearErr;
        }

        onToast?.("손글씨가 제거되었습니다.");
        window.dispatchEvent(
          new CustomEvent("remath_canvas_saved", { detail: { problemId, url: null } })
        );

        return null;
      }

      console.log("📸 [Canvas Save] 이미지 스냅샷 생성 중...", bounds);
      const dataUrl = stage.toDataURL({ pixelRatio: 3, ...bounds });
      const res = await fetch(dataUrl);
      const blob = await res.blob();

      const filename = `${user.id}/${problemId}/handwriting_${Date.now()}.png`;
      console.log("📤 [Canvas Save] 스토리지 업로드 시도:", filename);

      const { error: upErr } = await supabase.storage
        .from("solutions")
        .upload(filename, blob, { upsert: true, contentType: "image/png", cacheControl: "3600" });

      if (upErr) {
        console.error("❌ [Canvas Save] 스토리지 업로드 실패:", upErr);
        throw upErr;
      }
      console.log("✅ [Canvas Save] 스토리지 업로드 성공");

      const { data: urlData } = supabase.storage.from("solutions").getPublicUrl(filename);
      const publicUrl = urlData.publicUrl;
      console.log("🔗 [Canvas Save] 공개 URL 생성됨:", publicUrl);

      console.log("💾 [Canvas Save] DB 테이블 업데이트 시도 (problems)...");
      const { error: dbErr } = await supabase.from("problems").update({ handwriting_url: publicUrl }).eq("id", problemId);

      if (dbErr) {
        console.error("❌ [Canvas Save] DB 업데이트 실패 (RLS 정책 확인 필요):", dbErr);
        throw dbErr;
      }

      console.log("🎉 [Canvas Save] 모든 저장 프로세스 완료!");
      onToast?.("손글씨가 저장되었습니다.");
      window.dispatchEvent(new CustomEvent("remath_canvas_saved", { detail: { problemId, url: publicUrl } }));
      return publicUrl;
    } catch (e: any) {
      console.error("🚨 [Canvas Save] 최종 에러 발생:", e);
      onToast?.(`저장 실패: ${e.message}`);
      return null;
    } finally {
      setCloudSaving(false);
    }
  };

  // 외부 전체저장 (원본 그대로)
  useEffect(() => {
    const handleExternalSave = async (e: any) => {
      const pid = e?.detail?.problemId;
      if (!pid || pid !== problemId) return;

      console.log("📥 [Canvas Event] 외부로부터 저장 신호 수신");
      const resolve = e?.detail?.resolve;
      const reject = e?.detail?.reject;

      try {
        const url = await saveToCloud();
        resolve?.(url);
      } catch (err) {
        reject?.(err);
      }
    };

    window.addEventListener("remath_save_canvas", handleExternalSave);
    return () => window.removeEventListener("remath_save_canvas", handleExternalSave);
  }, [problemId, lines, texts]);

  // 드래그/그리기 핸들러
  const [isCanvasDragging, setIsCanvasDragging] = useState(false);
  const [startY, setStartY] = useState(0);
  const [scrollTop, setScrollTop] = useState(0);

  const checkAndExpandStage = (y: number) => {
    if (y > stageSize.height - 300) {
      setStageSize((prev) => ({ ...prev, height: prev.height + 600 }));
    }
  };

  const completeTextEdit = () => {
    if (!editingTextNode) return;

    const measuredH = textareaRef.current?.scrollHeight ?? 80;
    const safeH = Math.max(40, measuredH + 8);

    // ✅ 텍스트 완료/삭제도 Undo에 들어가야 함 → 변경 직전에 snapshot push
    pushHistory();
    redoStackRef.current = [];

    if (inputText.trim() === "") {
      setTexts((prev) => prev.filter((t) => t.id !== editingTextNode.id));
    } else {
      setTexts((prev) =>
        prev.map((t) =>
          t.id === editingTextNode.id
            ? {
              ...t,
              text: inputText,
              h: safeH,
            }
            : t
        )
      );
    }
    setEditingTextNode(null);
  };

  const handlePointerDown = (e: KonvaEventObject<PointerEvent>) => {
    // 편집중이면 종료
    if (editingTextNode) {
      completeTextEdit();
    }

    if (tool === "scroll") {
      setIsCanvasDragging(true);
      const clientY = e.evt.clientY || (e.evt as any).touches?.[0]?.clientY || 0;
      setStartY(clientY);
      if (containerRef.current) setScrollTop(containerRef.current.scrollTop);
      return;
    }

    const pos = stageRef.current?.getPointerPosition();
    if (!pos) return;

    if (tool === "text") {
      // ✅ 텍스트 추가도 Undo
      pushHistory();
      redoStackRef.current = [];

      const newId = Date.now().toString();
      setTexts((prev) => [
        ...prev,
        { id: newId, x: TEXT_MARGIN_X, y: pos.y, text: "", fontSize: 20, color, h: 80 },
      ]);
      setEditingTextNode({ id: newId, val: "" });
      setInputText("");
      return;
    }

    // ✅ 그리기 시작 시점에 Undo snapshot 1번만 저장
    pushHistory();
    redoStackRef.current = [];

    setIsDrawing(true);
    setLines((prev) => [
      ...prev,
      {
        id: Date.now().toString(),
        points: [pos.x, pos.y],
        color,
        strokeWidth: tool === "eraser" ? 20 : 3,
        globalCompositeOperation: tool === "eraser" ? "destination-out" : "source-over",
      },
    ]);
  };

  const handlePointerMove = (e: KonvaEventObject<PointerEvent>) => {
    if (!isDrawing && !isCanvasDragging) return;

    if (tool === "scroll" && isCanvasDragging && containerRef.current) {
      const clientY = e.evt.clientY || (e.evt as any).touches?.[0]?.clientY || 0;
      const dy = clientY - startY;
      containerRef.current.scrollTop = scrollTop - dy;
      return;
    }

    if (!isDrawing) return;
    const pos = stageRef.current?.getPointerPosition();
    if (!pos) return;

    checkAndExpandStage(pos.y);

    setLines((prev) => {
      if (!prev.length) return prev;
      const next = prev.slice();
      const last = { ...next[next.length - 1] };
      last.points = last.points.concat([pos.x, pos.y]);
      next[next.length - 1] = last;
      return next;
    });
  };

  const handlePointerUp = () => {
    setIsDrawing(false);
    setIsCanvasDragging(false);
  };

  const handleTextClick = (e: KonvaEventObject<any>, t: TextData) => {
    if (tool === "scroll" || tool === "eraser") return;
    e.cancelBubble = true;
    if (editingTextNode && editingTextNode.id !== t.id) completeTextEdit();
    setEditingTextNode({ id: t.id, val: t.text });
    setInputText(t.text);
    setTool("text");
  };

  const editingText = useMemo(() => {
    if (!editingTextNode) return null;
    return texts.find((t) => t.id === editingTextNode.id) || null;
  }, [editingTextNode, texts]);

  const editingWidthPx = useMemo(() => {
    if (!editingText) return 200;
    if (editingText.x === TEXT_MARGIN_X) {
      return Math.max(80, stageSize.width - TEXT_MARGIN_X * 2);
    }
    return Math.max(80, stageSize.width - editingText.x - 20);
  }, [editingText, stageSize.width]);

  // textarea 자동 높이 + stage 확장
  useEffect(() => {
    if (!editingTextNode || !editingText || !textareaRef.current) return;
    const el = textareaRef.current;

    el.style.height = "0px";
    el.style.height = `${el.scrollHeight}px`;

    const neededBottom = editingText.y + el.scrollHeight + 120;
    if (neededBottom > stageSize.height - 100) {
      setStageSize((prev) => ({ ...prev, height: Math.max(prev.height + 600, neededBottom + 300) }));
    }

    // 스크롤 따라가기
    if (containerRef.current) {
      const container = containerRef.current;
      const rect = el.getBoundingClientRect();
      const margin = 120;

      if (rect.bottom > window.innerHeight - margin) {
        container.scrollTop += rect.bottom - (window.innerHeight - margin);
      }
      if (rect.top < margin) {
        container.scrollTop -= margin - rect.top;
      }
    }
  }, [inputText, editingTextNode, editingText, stageSize.height]);

  const startTypingAtViewport = () => {
    setTool("text");
    if (editingTextNode) completeTextEdit();

    // ✅ 텍스트 추가도 Undo
    pushHistory();
    redoStackRef.current = [];

    const currentScrollTop = containerRef.current?.scrollTop || 0;
    const newId = Date.now().toString();
    setTexts((prev) => [
      ...prev,
      { id: newId, x: TEXT_MARGIN_X, y: currentScrollTop + 120, text: "", fontSize: 20, color, h: 80 },
    ]);
    setEditingTextNode({ id: newId, val: "" });
    setInputText("");
  };

  const clearAll = () => {
    // ✅ 초기화도 Undo 가능하게
    pushHistory();
    redoStackRef.current = [];

    setLines([]);
    setTexts([]);
    localStorage.removeItem(STORAGE_KEY);
    onToast?.("초기화 완료");
  };

  return (
    <div className="w-full h-full relative flex flex-col">
      {/* ✅ 상단 툴바 */}
      <div
        className="absolute top-4 left-1/2 -translate-x-1/2 z-20 bg-white/90 shadow-xl shadow-slate-200/50 rounded-2xl flex items-center p-2 gap-2 border border-slate-200 backdrop-blur-md"
        onPointerDown={(e) => e.stopPropagation()}
        onPointerUp={(e) => e.stopPropagation()}
      >
        {/* Undo / Redo */}
        <button
          onClick={doUndo}
          disabled={!canUndo}
          className={`px-3 py-2 rounded-xl transition font-black ${canUndo ? "text-slate-700 hover:bg-slate-100" : "text-slate-300 cursor-not-allowed"
            }`}
          title="되돌리기 (Ctrl/Cmd+Z)"
        >
          ↶
        </button>
        <button
          onClick={doRedo}
          disabled={!canRedo}
          className={`px-3 py-2 rounded-xl transition font-black ${canRedo ? "text-slate-700 hover:bg-slate-100" : "text-slate-300 cursor-not-allowed"
            }`}
          title="다시하기 (Ctrl/Cmd+Y 또는 Shift+Z)"
        >
          ↷
        </button>

        <div className="w-px h-6 bg-slate-200 mx-1"></div>

        <button
          onClick={() => setTool("scroll")}
          className={`p-3 rounded-xl transition ${tool === "scroll" ? "bg-blue-500 text-white" : "text-slate-500 hover:bg-slate-100"}`}
          title="스크롤 이동"
        >
          ✋
        </button>

        <button
          onClick={() => setTool("pen")}
          className={`p-3 rounded-xl transition ${tool === "pen" ? "bg-blue-500 text-white" : "text-slate-500 hover:bg-slate-100"}`}
          title="펜"
        >
          <svg viewBox="0 0 24 24" width="20" height="20" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 19l7-7 3 3-7 7-3-3z"></path>
            <path d="M18 13l-1.5-7.5L2 2l3.5 14.5L13 18l5-5z"></path>
            <path d="M2 2l7.586 7.586"></path>
            <circle cx="11" cy="11" r="2"></circle>
          </svg>
        </button>

        <div className="w-px h-6 bg-slate-200 mx-1"></div>

        {["#000000", "#EF4444", "#3B82F6", "#10B981"].map((c) => (
          <button
            key={c}
            onClick={() => {
              setColor(c);
              if (tool === "eraser" || tool === "scroll") setTool("pen");
            }}
            className={`w-6 h-6 rounded-full border-2 ${color === c && tool !== "eraser" && tool !== "scroll" ? "border-slate-800 scale-110" : "border-transparent"
              }`}
            style={{ backgroundColor: c }}
          />
        ))}

        <div className="w-px h-6 bg-slate-200 mx-1"></div>

        <button
          onClick={() => setTool("eraser")}
          className={`p-3 rounded-xl transition ${tool === "eraser" ? "bg-blue-500 text-white" : "text-slate-500 hover:bg-slate-100"}`}
          title="지우개"
        >
          <svg viewBox="0 0 24 24" width="20" height="20" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round">
            <path d="M20 20H7L3 16C2.5 15.5 2.5 14.5 3 14L13 4C13.5 3.5 14.5 3.5 15 4L20 9C20.5 9.5 20.5 10.5 20 11L11 20H20V20Z"></path>
            <path d="M16 8L10 14"></path>
          </svg>
        </button>

        <button
          onClick={startTypingAtViewport}
          className={`p-3 rounded-xl transition ${tool === "text" ? "bg-blue-500 text-white" : "text-slate-500 hover:bg-slate-100"}`}
          title="텍스트"
        >
          <svg viewBox="0 0 24 24" width="20" height="20" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="4 7 4 4 20 4 20 7"></polyline>
            <line x1="9" y1="20" x2="15" y2="20"></line>
            <line x1="12" y1="4" x2="12" y2="20"></line>
          </svg>
        </button>

        <button
          onClick={clearAll}
          className="px-4 py-2 text-sm font-bold text-red-500 hover:bg-red-50 rounded-xl whitespace-nowrap transition"
          title="초기화"
        >
          초기화
        </button>

        {cloudSaving && <span className="text-[10px] text-blue-500 font-bold animate-pulse whitespace-nowrap">저장중...</span>}
      </div>

      {/* ✅ 캔버스 */}
      <div
        className={`flex-1 w-full overflow-y-auto ${tool === "scroll" ? "cursor-grab active:cursor-grabbing" : "cursor-crosshair"}`}
        ref={containerRef}
        style={{ touchAction: tool === "scroll" ? "pan-y pan-x" : "none" }}
      >
        <div style={{ height: stageSize.height + 600, width: stageSize.width }} className="relative z-10 w-full">
          <Stage
            width={stageSize.width}
            height={stageSize.height + 600}
            onPointerDown={handlePointerDown}
            onPointerMove={handlePointerMove}
            onPointerUp={handlePointerUp}
            ref={stageRef}
            className="w-full"
          >
            <Layer>
              <Rect width={stageSize.width} height={stageSize.height + 600} fill="transparent" />

              {texts.map((t) => (
                <Text
                  key={t.id}
                  x={t.x}
                  y={t.y}
                  text={t.text}
                  fontSize={t.fontSize}
                  fontFamily="Pretendard, sans-serif"
                  fill={t.color}
                  width={t.x === TEXT_MARGIN_X ? stageSize.width - TEXT_MARGIN_X * 2 : stageSize.width - t.x - 20}
                  height={t.h ?? 80}
                  lineHeight={1.2}
                  onClick={(e) => handleTextClick(e, t)}
                  onTap={(e) => handleTextClick(e, t)}
                  visible={t.id !== editingTextNode?.id}
                />
              ))}

              {lines.map((line) => (
                <Line
                  key={line.id}
                  points={line.points}
                  stroke={line.color}
                  strokeWidth={line.strokeWidth}
                  tension={0.5}
                  lineCap="round"
                  lineJoin="round"
                  globalCompositeOperation={line.globalCompositeOperation}
                />
              ))}
            </Layer>
          </Stage>

          {editingTextNode && editingText && (
            <textarea
              ref={textareaRef}
              autoFocus
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  completeTextEdit();
                }
              }}
              onBlur={completeTextEdit}
              style={{
                position: "absolute",
                top: `${editingText.y}px`,
                left: `${editingText.x}px`,
                width: `${editingWidthPx}px`,
                fontSize: "20px",
                fontFamily: "Pretendard, sans-serif",
                color: editingText.color,
                background: "transparent",
                border: "none",
                outline: "none",
                resize: "none",
                overflow: "hidden",
                lineHeight: "1.2",
                minHeight: "30px",
                whiteSpace: "pre-wrap",
                wordBreak: "break-word",
                padding: 0,
                margin: 0,
                zIndex: 30,
                boxSizing: "border-box",
              }}
              placeholder="텍스트 입력"
            />
          )}
        </div>
      </div>
    </div>
  );
}