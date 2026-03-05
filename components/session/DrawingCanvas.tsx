"use client";
// =============================================
// Konva.js 드로잉 캔버스
// 펜/지우개/색상/굵기 툴바 포함
// =============================================
import { useRef, useState } from "react";
import { Stage, Layer, Line } from "react-konva";

interface DrawLine {
    points: number[];
    color: string;
    width: number;
    tool: "pen" | "eraser";
}

const COLORS = ["#1E293B", "#3B82F6", "#10B981", "#F59E0B", "#EF4444"];
const WIDTHS = [2, 4, 8, 14];

export function DrawingCanvas({
    width,
    height,
}: {
    width: number;
    height: number;
}) {
    const [lines, setLines] = useState<DrawLine[]>([]);
    const [tool, setTool] = useState<"pen" | "eraser">("pen");
    const [color, setColor] = useState(COLORS[0]);
    const [strokeWidth, setStrokeWidth] = useState(WIDTHS[1]);
    const isDrawing = useRef(false);

    function getPos(e: any) {
        const stage = e?.target?.getStage?.();
        return stage?.getPointerPosition?.() ?? null;
    }

    function onPointerDown(e: any) {
        isDrawing.current = true;
        const pos = getPos(e);
        if (!pos) return;
        setLines((prev) => [
            ...prev,
            { points: [pos.x, pos.y], color, width: strokeWidth, tool },
        ]);
    }

    function onPointerMove(e: any) {
        if (!isDrawing.current) return;
        const pos = getPos(e);
        if (!pos) return;

        setLines((prev) => {
            const last = prev[prev.length - 1];
            if (!last) return prev;
            const updated = { ...last, points: [...last.points, pos.x, pos.y] };
            return [...prev.slice(0, -1), updated];
        });
    }

    function onPointerUp() {
        isDrawing.current = false;
    }

    // 툴바 높이(대략) 만큼만 캔버스 높이에서 빼기
    const TOOLBAR_H = 44;

    return (
        <div className="flex h-full flex-col">
            {/* 툴바 */}
            <div className="flex flex-wrap items-center gap-2 border-b border-slate-200 bg-white px-3 py-2">
                {/* 펜/지우개 */}
                <div className="flex overflow-hidden rounded-lg border border-slate-200 text-xs">
                    <button
                        onClick={() => setTool("pen")}
                        className={`px-2.5 py-1 transition ${tool === "pen"
                                ? "bg-primary text-white"
                                : "text-slate-500 hover:bg-slate-50"
                            }`}
                        type="button"
                    >
                        ✏️ 펜
                    </button>
                    <button
                        onClick={() => setTool("eraser")}
                        className={`px-2.5 py-1 transition ${tool === "eraser"
                                ? "bg-primary text-white"
                                : "text-slate-500 hover:bg-slate-50"
                            }`}
                        type="button"
                    >
                        🧹 지우개
                    </button>
                </div>

                {/* 색상 */}
                {tool === "pen" && (
                    <div className="flex items-center gap-1">
                        {COLORS.map((c) => (
                            <button
                                key={c}
                                onClick={() => setColor(c)}
                                style={{ backgroundColor: c }}
                                className={`h-5 w-5 rounded-full transition ${color === c ? "ring-2 ring-offset-1 ring-action" : ""
                                    }`}
                                type="button"
                            />
                        ))}
                    </div>
                )}

                {/* 굵기 */}
                <div className="flex items-center gap-1">
                    {WIDTHS.map((w) => (
                        <button
                            key={w}
                            onClick={() => setStrokeWidth(w)}
                            className={`flex h-6 w-6 items-center justify-center rounded transition ${strokeWidth === w
                                    ? "bg-blue-50 ring-1 ring-action"
                                    : "hover:bg-slate-50"
                                }`}
                            type="button"
                        >
                            <div
                                className="rounded-full bg-slate-700"
                                style={{ width: Math.min(w, 14), height: Math.min(w, 14) }}
                            />
                        </button>
                    ))}
                </div>

                {/* 전체 지우기 */}
                <button
                    onClick={() => setLines([])}
                    className="ml-auto rounded-lg px-2 py-1 text-xs text-slate-400 transition hover:bg-red-50 hover:text-red-500"
                    type="button"
                >
                    전체 지우기
                </button>
            </div>

            {/* 캔버스 */}
            <div className="flex-1 overflow-hidden bg-white">
                <Stage
                    width={width}
                    height={Math.max(100, height - TOOLBAR_H)}
                    // ✅ 이벤트 이름 반드시 카멜케이스
                    onMouseDown={onPointerDown}
                    onMouseMove={onPointerMove}
                    onMouseUp={onPointerUp}
                    onTouchStart={onPointerDown}
                    onTouchMove={onPointerMove}
                    onTouchEnd={onPointerUp}
                    style={{ cursor: tool === "eraser" ? "crosshair" : "pencil" }}
                >
                    <Layer>
                        {lines.map((line, i) => (
                            <Line
                                key={i}
                                points={line.points}
                                stroke={line.tool === "eraser" ? "#F8FAFC" : line.color}
                                strokeWidth={
                                    line.tool === "eraser" ? line.width * 4 : line.width
                                }
                                tension={0.4}
                                lineCap="round"
                                lineJoin="round"
                                globalCompositeOperation={
                                    line.tool === "eraser"
                                        ? "destination-out"
                                        : "source-over"
                                }
                            />
                        ))}
                    </Layer>
                </Stage>
            </div>
        </div>
    );
}