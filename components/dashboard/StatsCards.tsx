"use client";
// =============================================
// 대시보드 통계 카드 (총 오답, 해결률, 연속일수)
// =============================================
import type { DashboardStats } from "@/types";

export function StatsCards({ stats }: { stats: DashboardStats }) {
    const cards = [
        {
            label: "총 오답 수",
            value: stats.total,
            unit: "문제",
            icon: "📚",
            color: "text-primary",
        },
        {
            label: "해결 완료",
            value: stats.solved,
            unit: "문제",
            icon: "✅",
            color: "text-success",
        },
        {
            label: "해결률",
            value: stats.solveRate,
            unit: "%",
            icon: "📈",
            color: stats.solveRate >= 70 ? "text-success" : stats.solveRate >= 40 ? "text-action" : "text-red-500",
        },
        {
            label: "연속 재시험",
            value: stats.streakDays,
            unit: "일",
            icon: "🔥",
            color: stats.streakDays >= 7 ? "text-action" : "text-primary",
        },
    ];

    return (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {cards.map((c) => (
                <div key={c.label} className="card p-4 text-center">
                    <div className="mb-2 text-2xl">{c.icon}</div>
                    <p className={`text-2xl font-bold ${c.color}`}>
                        {c.value}
                        <span className="text-sm font-normal text-slate-400 ml-0.5">{c.unit}</span>
                    </p>
                    <p className="mt-1 text-xs text-slate-500">{c.label}</p>
                </div>
            ))}
        </div>
    );
}
