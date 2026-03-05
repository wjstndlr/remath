// =============================================
// 10문제 세션 선정 로직 (가중치 알고리즘)
// =============================================
import type { Problem } from "@/types";

/**
 * 가중치 점수 계산
 * - 오래된 문제일수록 점수 높음 (최대 50점)
 * - 다시보기 상태일수록 점수 높음 (+30점)
 * - 미해결 상태 +20점
 * - solve_count가 낮을수록 점수 높음
 */
function calcWeight(problem: Problem): number {
    let score = 0;
    const now = Date.now();
    const lastTried = problem.last_tried_at
        ? new Date(problem.last_tried_at).getTime()
        : new Date(problem.created_at).getTime();

    // 경과일수 점수 (최대 50점, 30일 이후부터 만점)
    const daysPassed = (now - lastTried) / (1000 * 60 * 60 * 24);
    score += Math.min(50, daysPassed * 1.67);

    // 상태 점수
    if (problem.status === "review") score += 30;
    if (problem.status === "saved") score += 20;

    // 시도 횟수 역점수 (덜 본 문제 우선)
    score += Math.max(0, 20 - problem.solve_count * 5);

    return score;
}

/**
 * 오늘의 10문제 선정
 * problems: 미해결 + 다시보기 상태의 전체 오답 목록
 */
export function selectTodayProblems(problems: Problem[]): Problem[] {
    const eligible = problems.filter(
        (p) => p.status === "saved" || p.status === "review"
    );

    const weighted = eligible
        .map((p) => ({ problem: p, weight: calcWeight(p) }))
        .sort((a, b) => b.weight - a.weight);

    return weighted.slice(0, 10).map((w) => w.problem);
}

/**
 * 단원별 통계 계산
 */
export function calcUnitStats(problems: Problem[]) {
    const map: Record<string, { total: number; solved: number; subject: string }> = {};

    for (const p of problems) {
        for (const unit of p.unit_tags) {
            if (!map[unit]) map[unit] = { total: 0, solved: 0, subject: p.subject };
            map[unit].total++;
            if (p.status === "mastered") map[unit].solved++;
        }
    }

    return Object.entries(map).map(([unit, s]) => ({
        unit,
        subject: s.subject,
        total: s.total,
        solved: s.solved,
        rate: s.total > 0 ? Math.round((s.solved / s.total) * 100) : 0,
    }));
}
