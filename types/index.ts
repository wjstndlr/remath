// =============================================
// 수학 오답노트 - 공통 타입 정의
// =============================================

/** 과목 */
export type Subject = "수학1" | "수학2" | "미적분" | "확통" | "기하";

/** 단원 태그 */
export interface UnitTag {
  id: string;
  name: string;
  subject: Subject;
}

/** 오답 문제 */
export interface Problem {
  id: string;
  user_id: string;
  subject: Subject;
  unit_tags: string[]; // 단원 이름 배열
  image_url: string;
  memo?: string;
  // (선택) 풀이 이미지 URL — 스키마에 solution_url 컬럼을 추가하면 깔끔하게 관리 가능
  // 컬럼이 없다면, 코드가 memo에 URL을 fallback으로 붙입니다.
  solution_url?: string;
  // (선택) 풀이 이미지 아래 추가 메모
  solution_memo?: string;
  // (선택) 태블릿 손글씨 캔버스 스냅샷(이미지) URL
  handwriting_url?: string;
  status: "saved" | "review" | "mastered"; // 저장완료 / 다시보기 / 마스터
  importance: number; // 1~5 별점 (중요도)
  solve_count: number; // 재시험 시도 횟수
  last_tried_at?: string; // ISO 날짜
  created_at: string;
  updated_at: string;
}

/** 세션 (오늘의 10문제) */
export interface SessionProblem {
  problem: Problem;
  result?: "solved" | "review"; // 이번 세션 결과
}

/** 대시보드 통계 */
export interface DashboardStats {
  total: number;
  solved: number;
  unsolved: number;
  solveRate: number; // 0~100
  streakDays: number; // 연속 재시험 일수
}

/** 단원별 통계 */
export interface UnitStat {
  unit: string;
  subject: Subject;
  total: number;
  solved: number;
  rate: number; // 0~100
}

/** 유저 프로필 */
export interface UserProfile {
  id: string;
  email: string;
  is_pro: boolean;
  stripe_customer_id?: string;
  created_at: string;
}
