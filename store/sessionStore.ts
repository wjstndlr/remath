// =============================================
// Zustand 세션 스토어
// 오늘의 10문제 세션 진행 상태 관리
// =============================================
import { create } from "zustand";
import type { Problem } from "@/types";

interface SessionState {
    problems: Problem[];        // 오늘 선정된 10문제
    currentIndex: number;       // 현재 보고 있는 문제 인덱스
    results: Record<string, "mastered" | "review">; // 문제ID → 결과
    activeTab: "draw" | "memo" | "hint"; // 오른쪽 패널 탭
    isFinished: boolean;        // 세션 완료 여부

    // Actions
    setProblems: (problems: Problem[]) => void;
    goNext: () => void;
    goPrev: () => void;
    markResult: (id: string, result: "mastered" | "review") => void;
    setTab: (tab: "draw" | "memo" | "hint") => void;
    reset: () => void;
}

export const useSessionStore = create<SessionState>((set, get) => ({
    problems: [],
    currentIndex: 0,
    results: {},
    activeTab: "draw",
    isFinished: false,

    setProblems: (problems) => set({ problems, currentIndex: 0, results: {}, isFinished: false }),

    goNext: () => {
        const { currentIndex, problems } = get();
        if (currentIndex < problems.length - 1) {
            set({ currentIndex: currentIndex + 1 });
        } else {
            set({ isFinished: true });
        }
    },

    goPrev: () => {
        const { currentIndex } = get();
        if (currentIndex > 0) set({ currentIndex: currentIndex - 1 });
    },

    markResult: (id, result) => {
        set((s) => ({ results: { ...s.results, [id]: result } }));
    },

    setTab: (tab) => set({ activeTab: tab }),

    reset: () => set({ problems: [], currentIndex: 0, results: {}, activeTab: "draw", isFinished: false }),
}));
