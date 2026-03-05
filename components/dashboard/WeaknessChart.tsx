"use client";
// =============================================
// 약점 분석 막대그래프 (SVG 순수 구현)
// 단원별 해결/미해결 비율 시각화
// =============================================
import type { UnitStat } from "@/types";

const SUBJECT_COLORS: Record<string, string> = {
    수학1: "#3B82F6",
    수학2: "#8B5CF6",
    미적분: "#10B981",
    확통: "#F59E0B",
    기하: "#EF4444",
};

export function WeaknessChart({ stats }: { stats: UnitStat[] }) {
    if (stats.length === 0) {
        return (
            <div className="flex h-32 items-center justify-center text-sm text-slate-400">
                단원 데이터가 없어요. 문제를 등록하면 분석 결과가 나타납니다.
            </div>
        );
    }

    // 해결률 낮은 순 정렬 (취약 단원 상단)
    const sorted = [...stats].sort((a, b) => a.rate - b.rate).slice(0, 10);

    return (
        <div className="space-y-2.5">
            {sorted.map((stat) => {
                const color = SUBJECT_COLORS[stat.subject] ?? "#94A3B8";
                return (
                    <div key={stat.unit} className="flex items-center gap-3">
                        {/* 단원명 */}
                        <div className="w-20 shrink-0 text-right text-xs text-slate-600 font-medium truncate">
                            {stat.unit}
                        </div>
                        {/* 바 */}
                        <div className="relative flex-1 h-5 rounded-full bg-slate-100 overflow-hidden">
                            <div
                                className="absolute inset-y-0 left-0 rounded-full transition-all duration-700"
                                style={{
                                    width: `${Math.max(stat.rate, 2)}%`,
                                    backgroundColor: color,
                                    opacity: 0.85,
                                }}
                            />
                        </div>
                        {/* 수치 */}
                        <div className="w-14 shrink-0 text-xs text-slate-500">
                            <span style={{ color }} className="font-semibold">{stat.rate}%</span>
                            <span className="ml-1 text-slate-400">({stat.solved}/{stat.total})</span>
                        </div>
                    </div>
                );
            })}
            <p className="pt-1 text-[11px] text-slate-400">
                * 해결률 낮은 취약 단원 순
                {stats.length > 10 && ` (전체 ${stats.length}개 중 상위 10개 표시)`}
            </p>
        </div>
    );
}
