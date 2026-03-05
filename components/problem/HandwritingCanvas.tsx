"use client";
import React, { useState, useRef, useEffect, useCallback } from "react";
import { Stage, Layer, Line, Image as KonvaImage } from "react-konva";
import useImage from "use-image";

interface LineData {
    points: number[];
    color: string;
    strokeWidth: number;
    globalCompositeOperation?: string;
}

export default function HandwritingCanvas({
    onSave,
    initialUrl,
    problemId = "default"
}: {
    onSave: (dataUrl: string) => void;
    initialUrl?: string;
    problemId?: string;
}) {
    const stageRef = useRef<any>(null);
    const containerRef = useRef<HTMLDivElement>(null);
    const [lines, setLines] = useState<LineData[]>([]);
    const [isDrawing, setIsDrawing] = useState(false);
    const [tool, setTool] = useState<"pen" | "eraser">("pen");
    const [size, setSize] = useState({ width: 300, height: 280 });

    const [prevImage] = useImage(initialUrl || "", "anonymous");

    // 초기 사이즈 설정
    useEffect(() => {
        if (containerRef.current) {
            setSize({
                width: containerRef.current.offsetWidth,
                height: Math.max(containerRef.current.offsetHeight, 280),
            });
        }
    }, [containerRef]);

    // 로컬 스토리지 키
    const STORAGE_KEY = `remath_memo_canvas_${problemId}`;

    // 복구 로직
    useEffect(() => {
        const saved = localStorage.getItem(STORAGE_KEY);
        if (saved) {
            try {
                const parsed = JSON.parse(saved);
                if (Array.isArray(parsed)) setLines(parsed);
            } catch (e) {
                console.error("Failed to restore lines:", e);
            }
        }
    }, [STORAGE_KEY]);

    // 크롭 저장 로직
    const saveWithTrimming = useCallback(() => {
        if (!stageRef.current) return;
        const stage = stageRef.current;

        // 그려진 선들의 바운딩 박스 계산
        let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;

        lines.forEach(line => {
            for (let i = 0; i < line.points.length; i += 2) {
                const x = line.points[i];
                const y = line.points[i + 1];
                minX = Math.min(minX, x);
                minY = Math.min(minY, y);
                maxX = Math.max(maxX, x);
                maxY = Math.max(maxY, y);
            }
        });

        // ✅ 기존 저장된 이미지(prevImage)도 범위에 포함하여 잘리지 않게 함
        if (prevImage) {
            minX = Math.min(minX, 0);
            minY = Math.min(minY, 0);
            maxX = Math.max(maxX, size.width);
            maxY = Math.max(maxY, size.width * (prevImage.height / prevImage.width));
        }

        // 아무것도 안 써졌을 때
        if (minX === Infinity) return;

        const padding = 12;
        const finalX = Math.max(0, minX - padding);
        const finalY = Math.max(0, minY - padding);
        const finalW = Math.min(stage.width() - finalX, (maxX - minX) + padding * 2);
        const finalH = Math.min(stage.height() - finalY, (maxY - minY) + padding * 2);

        if (finalW < 5 || finalH < 5) return;

        const dataUrl = stage.toDataURL({
            x: finalX,
            y: finalY,
            width: finalW,
            height: finalH,
            pixelRatio: 3
        });
        onSave(dataUrl);
    }, [lines, onSave]);

    const handlePointerDown = (e: any) => {
        setIsDrawing(true);
        const stage = e.target.getStage();
        const pos = stage.getPointerPosition();
        if (!pos) return;

        const container = stage.container();
        const scrollY = container.parentElement?.scrollTop || 0;

        const newLine: LineData = {
            points: [pos.x, pos.y + scrollY],
            color: tool === "pen" ? "#000000" : "#ffffff",
            strokeWidth: tool === "pen" ? 3 : 24,
            globalCompositeOperation: tool === "eraser" ? "destination-out" : "source-over"
        };
        setLines(prev => [...prev, newLine]);
    };

    const handlePointerMove = (e: any) => {
        if (!isDrawing) return;
        const stage = e.target.getStage();
        const pos = stage.getPointerPosition();
        if (!pos) return;

        const container = stage.container();
        const scrollY = container.parentElement?.scrollTop || 0;

        setLines(prev => {
            if (prev.length === 0) return prev;
            const lastLine = { ...prev[prev.length - 1] };
            lastLine.points = lastLine.points.concat([pos.x, pos.y + scrollY]);
            return [...prev.slice(0, -1), lastLine];
        });
    };

    const handlePointerUp = () => {
        setIsDrawing(false);
        localStorage.setItem(STORAGE_KEY, JSON.stringify(lines));
        saveWithTrimming();
    };

    const clearCanvas = () => {
        if (confirm("정말 초기화할까요?")) {
            setLines([]);
            localStorage.removeItem(STORAGE_KEY);
            onSave("");
        }
    };

    return (
        <div className="w-full h-full flex flex-col bg-white rounded-2xl overflow-hidden border border-slate-800" ref={containerRef}>
            <div className="flex items-center gap-2 p-2 bg-slate-800 border-b border-slate-700">
                <button
                    onClick={() => setTool("pen")}
                    className={`px-3 py-1.5 rounded-lg text-xs font-black transition ${tool === "pen" ? "bg-blue-600 text-white shadow-lg" : "bg-slate-700 text-slate-400"}`}
                >
                    펜 (검정)
                </button>
                <button
                    onClick={() => setTool("eraser")}
                    className={`px-3 py-1.5 rounded-lg text-xs font-black transition ${tool === "eraser" ? "bg-blue-600 text-white shadow-lg" : "bg-slate-700 text-slate-400"}`}
                >
                    지우개
                </button>
                <button
                    onClick={clearCanvas}
                    className="ml-auto px-4 py-1.5 rounded-lg bg-red-500/10 text-red-500 text-xs font-black border border-red-500/20 hover:bg-red-500/20 transition-colors"
                >
                    초기화
                </button>
            </div>

            <div className="flex-1 overflow-y-auto overflow-x-hidden bg-slate-50/20 cursor-crosshair">
                <Stage
                    width={size.width}
                    height={Math.max(size.height, 1200)}
                    onPointerDown={handlePointerDown}
                    onPointerMove={handlePointerMove}
                    onPointerUp={handlePointerUp}
                    ref={stageRef}
                    style={{ background: "#ffffff" }}
                >
                    <Layer>
                        {prevImage && (
                            <KonvaImage
                                image={prevImage}
                                x={0}
                                y={0}
                                width={size.width}
                                height={size.width * (prevImage.height / prevImage.width)}
                            />
                        )}
                        {lines.map((line, i) => (
                            <Line
                                key={i}
                                points={line.points}
                                stroke={line.color}
                                strokeWidth={line.strokeWidth}
                                tension={0.5}
                                lineCap="round"
                                lineJoin="round"
                                globalCompositeOperation={line.globalCompositeOperation as any}
                            />
                        ))}
                    </Layer>
                </Stage>
            </div>
            <div className="p-1.5 text-[10px] text-center text-slate-500 bg-slate-50 border-t border-slate-100 font-medium">
                작성 후 상단 [전체 저장]을 눌러야 반영됩니다.
            </div>
        </div>
    );
}
