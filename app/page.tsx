import Link from "next/link";
import { MainHeader } from "@/components/layout/MainHeader";
import { FeedbackCTABar } from "@/components/ui/FeedbackCTABar";

export default function LandingPage() {
  return (
    <div className="flex min-h-screen flex-col bg-[var(--light-bg)]">
      <MainHeader />
      <main className="flex-1 w-full">
        {/* =========================================
            1. HERO SECTION – 압도적 첫인상
        ========================================= */}
        <section className="relative min-h-screen flex items-center justify-center pt-24 pb-12 border-b border-slate-50">
          <div className="absolute inset-0 z-0 pointer-events-none">
            <div className="absolute top-[10%] left-[-10%] w-[50%] h-[50%] bg-blue-50/50 rounded-full blur-[160px]" />
            <div className="absolute bottom-[20%] right-[-10%] w-[40%] h-[40%] bg-indigo-50/50 rounded-full blur-[160px]" />
          </div>

          <div className="relative z-10 mx-auto max-w-7xl px-[var(--rm-pad-x)] flex flex-col items-center text-center">
            <div className="animate-fade-up">
              <span className="inline-block px-4 py-1.5 rounded-full bg-slate-900 text-white text-[10px] font-bold tracking-widest uppercase mb-10 shadow-xl shadow-slate-900/20">
                Premium Exam Strategy Platform
              </span>
              <h1 className="text-[clamp(42px,8vw,72px)] font-bold tracking-tighter text-slate-900 leading-[1.05] mb-8">
                오답을 모아,<br />
                <span className="text-blue-600">전략</span>으로 만듭니다.
              </h1>
              <p className="max-w-2xl text-lg md:text-xl text-slate-400 font-semibold leading-relaxed mb-12 mx-auto">
                단순히 문제를 다시 푸는 것이 아닙니다.<br />
                당신이 수능장에서 펼칠 '필승의 한 수'를 준비하는 과정입니다.
              </p>

              <div className="flex flex-col sm:flex-row items-center justify-center gap-6">
                <Link href="/auth" className="w-full sm:w-auto px-12 py-5 rounded-full bg-slate-900 text-white font-bold text-lg hover:scale-105 active:scale-95 transition-all shadow-xl">
                  무료로 시작하기
                </Link>
                <div className="flex items-center gap-4 text-left">
                  <div className="flex -space-x-3">
                    {[1, 2, 3].map(i => (
                      <div key={i} className="w-10 h-10 rounded-full border-4 border-white bg-slate-100 flex items-center justify-center text-sm shadow-sm opacity-80">🎓</div>
                    ))}
                  </div>
                  <div>
                    <div className="text-xs font-bold text-slate-900">9.5만+ 수료생 누적</div>
                    <div className="text-[9px] font-semibold text-slate-400">명문대 합격생들의 오답 전략</div>
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-24 w-full max-w-5xl animate-fade-up delay-200">
              <div className="relative group">
                <div className="absolute -inset-2 bg-blue-100/50 rounded-[3rem] blur-xl opacity-50 transition duration-1000 group-hover:opacity-100" />
                <img
                  src="/hero_tablet_mockup_1772116534475.png"
                  alt="Dashboard View"
                  className="relative w-full rounded-[3.5rem] shadow-[0_50px_100px_-20px_rgba(0,0,0,0.15)] transition-transform duration-700 hover:translate-y-[-10px]"
                />
              </div>
            </div>
          </div>
        </section>

        {/* =========================================
            2. STRATEGY FLOW – ReMath 핵심 기능 3가지
        ========================================= */}
        <section className="py-24 bg-white relative overflow-hidden">
          <div className="mx-auto max-w-7xl px-[var(--rm-pad-x)] relative z-10">
            <div className="text-center mb-20 max-w-2xl mx-auto space-y-4">
              <h2 className="text-[clamp(26px,3.5vw,38px)] font-bold text-slate-900 tracking-tighter leading-tight">
                찍고, 쓰고, 뽑아내세요.<br />
                <span className="text-blue-600">ReMath</span>가 오답노트를 자동 완성합니다.
              </h2>
              <p className="text-base text-slate-400 font-semibold">
                가위와 풀 없이, 스마트폰 하나로 끝내는 나만의 수학 전략
              </p>
            </div>

            <div className="grid md:grid-cols-2 gap-6">
              {/* 카드 1: 언제든지 사진 찍기 */}
              <div className="bg-blue-50 rounded-[2rem] border border-blue-100 overflow-hidden flex flex-col md:flex-row items-center p-8 gap-6 group hover:bg-white hover:shadow-lg transition duration-500">
                <div className="flex-1 space-y-3 text-center md:text-left">
                  <h3 className="text-xl font-bold text-slate-900 tracking-tight">언제든지, 어디서든 사진 한 장</h3>
                  <p className="text-sm font-semibold text-slate-400 leading-relaxed">
                    틀린 문제를 스마트폰으로 찍기만 하면 끝.<br />
                    수업 중이든, 자습 중이든 즉시 저장됩니다.
                  </p>
                </div>
                <div className="w-full md:w-[160px] aspect-square bg-white rounded-[1.5rem] flex items-center justify-center p-4 overflow-hidden shadow-sm group-hover:scale-105 transition duration-500">
                  <svg viewBox="0 0 120 120" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
                    {/* 폰 외곽 */}
                    <rect x="28" y="8" width="64" height="104" rx="12" fill="#1e293b" />
                    <rect x="31" y="11" width="58" height="98" rx="10" fill="#f8fafc" />
                    {/* 카메라 UI */}
                    <rect x="35" y="25" width="50" height="55" rx="6" fill="#0f172a" />
                    {/* 초점 사각형 */}
                    <rect x="47" y="36" width="26" height="26" rx="2" fill="none" stroke="#60a5fa" strokeWidth="1.5" />
                    <line x1="47" y1="36" x2="51" y2="36" stroke="#2563eb" strokeWidth="2" strokeLinecap="round" />
                    <line x1="47" y1="36" x2="47" y2="40" stroke="#2563eb" strokeWidth="2" strokeLinecap="round" />
                    <line x1="73" y1="36" x2="69" y2="36" stroke="#2563eb" strokeWidth="2" strokeLinecap="round" />
                    <line x1="73" y1="36" x2="73" y2="40" stroke="#2563eb" strokeWidth="2" strokeLinecap="round" />
                    <line x1="47" y1="62" x2="51" y2="62" stroke="#2563eb" strokeWidth="2" strokeLinecap="round" />
                    <line x1="47" y1="62" x2="47" y2="58" stroke="#2563eb" strokeWidth="2" strokeLinecap="round" />
                    <line x1="73" y1="62" x2="69" y2="62" stroke="#2563eb" strokeWidth="2" strokeLinecap="round" />
                    <line x1="73" y1="62" x2="73" y2="58" stroke="#2563eb" strokeWidth="2" strokeLinecap="round" />
                    {/* 수식 미리보기 */}
                    <text x="53" y="52" fill="#94a3b8" fontSize="7" fontFamily="monospace">x²+2x</text>
                    {/* 셔터 버튼 */}
                    <circle cx="60" cy="92" r="7" fill="#e2e8f0" />
                    <circle cx="60" cy="92" r="5" fill="white" />
                    <circle cx="60" cy="92" r="3" fill="#2563eb" />
                    {/* 플래시 표시 */}
                    <polygon points="43,88 40,95 43,94 41,101 47,92 44,93" fill="#fbbf24" />
                  </svg>
                </div>
              </div>

              {/* 카드 2: 단원별 오답노트 */}
              <div className="bg-indigo-50 rounded-[2rem] border border-indigo-100 overflow-hidden flex flex-col md:flex-row items-center p-8 gap-6 group hover:bg-white hover:shadow-lg transition duration-500">
                <div className="flex-1 space-y-3 text-center md:text-left">
                  <h3 className="text-xl font-bold text-slate-900 tracking-tight">단원별로 자동 정리되는 오답노트</h3>
                  <p className="text-sm font-semibold text-slate-400 leading-relaxed">
                    수학1, 수학2, 미적분… 과목·단원별로 자동 분류.<br />
                    시험 전 필요한 유형만 10초 만에 찾아냅니다.
                  </p>
                </div>
                <div className="w-full md:w-[160px] aspect-square bg-white rounded-[1.5rem] flex items-center justify-center p-4 overflow-hidden shadow-sm group-hover:scale-105 transition duration-500">
                  <svg viewBox="0 0 120 120" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
                    {/* 책 탭들 (단원 폴더) */}
                    <rect x="15" y="38" width="90" height="72" rx="6" fill="#e0e7ff" />
                    <rect x="15" y="30" width="22" height="12" rx="4" fill="#6366f1" />
                    <rect x="40" y="32" width="22" height="10" rx="4" fill="#ec4899" />
                    <rect x="65" y="34" width="22" height="8" rx="4" fill="#10b981" />
                    <rect x="15" y="40" width="90" height="68" rx="6" fill="white" stroke="#e0e7ff" strokeWidth="1" />
                    {/* 내용 라인 */}
                    <line x1="25" y1="58" x2="95" y2="58" stroke="#e2e8f0" strokeWidth="1.5" strokeLinecap="round" />
                    <line x1="25" y1="68" x2="80" y2="68" stroke="#e2e8f0" strokeWidth="1.5" strokeLinecap="round" />
                    <line x1="25" y1="78" x2="90" y2="78" stroke="#e2e8f0" strokeWidth="1.5" strokeLinecap="round" />
                    <line x1="25" y1="88" x2="70" y2="88" stroke="#e2e8f0" strokeWidth="1.5" strokeLinecap="round" />
                    {/* 선택된 탭 배지 */}
                    <rect x="18" y="48" width="40" height="6" rx="3" fill="#6366f1" opacity="0.15" />
                    <text x="22" y="53" fill="#6366f1" fontSize="5" fontWeight="bold">수학1 · 지수/로그</text>
                    {/* 체크 아이콘 */}
                    <circle cx="93" cy="58" r="5" fill="#10b981" />
                    <path d="M90 58 L92 60 L96 56" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </div>
              </div>

              {/* 카드 3: PDF 내보내기 */}
              <div className="bg-emerald-50 rounded-[2rem] border border-emerald-100 overflow-hidden flex flex-col md:flex-row items-center p-8 gap-6 group hover:bg-white hover:shadow-lg transition duration-500">
                <div className="flex-1 space-y-3 text-center md:text-left">
                  <h3 className="text-xl font-bold text-slate-900 tracking-tight">시험 직전, 나만의 PDF 한 번에</h3>
                  <p className="text-sm font-semibold text-slate-400 leading-relaxed">
                    틀린 문제만 모아 실제 시험지처럼 인쇄.<br />
                    나만을 위한 모의고사가 단 1초 만에 완성됩니다.
                  </p>
                </div>
                <div className="w-full md:w-[160px] aspect-square bg-white rounded-[1.5rem] flex items-center justify-center p-4 overflow-hidden shadow-sm group-hover:scale-105 transition duration-500">
                  <svg viewBox="0 0 120 120" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
                    {/* PDF 문서 */}
                    <rect x="25" y="10" width="55" height="70" rx="5" fill="white" stroke="#d1fae5" strokeWidth="2" />
                    <rect x="25" y="10" width="55" height="70" rx="5" fill="#f0fdf4" />
                    {/* PDF 라벨 */}
                    <rect x="55" y="10" width="25" height="14" rx="0" fill="#10b981" />
                    <rect x="63" y="10" width="17" height="14" rx="3" fill="#10b981" />
                    <text x="60" y="21" fill="white" fontSize="7" fontWeight="bold">PDF</text>
                    {/* 문서 내용 라인 */}
                    <line x1="33" y1="35" x2="72" y2="35" stroke="#bbf7d0" strokeWidth="2" strokeLinecap="round" />
                    <line x1="33" y1="43" x2="65" y2="43" stroke="#bbf7d0" strokeWidth="2" strokeLinecap="round" />
                    <line x1="33" y1="51" x2="70" y2="51" stroke="#bbf7d0" strokeWidth="2" strokeLinecap="round" />
                    <line x1="33" y1="59" x2="60" y2="59" stroke="#bbf7d0" strokeWidth="2" strokeLinecap="round" />
                    {/* 다운로드 화살표 */}
                    <circle cx="60" cy="95" r="18" fill="#10b981" />
                    <path d="M60 86 L60 97" stroke="white" strokeWidth="2.5" strokeLinecap="round" />
                    <path d="M54 92 L60 98 L66 92" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
                    <line x1="52" y1="102" x2="68" y2="102" stroke="white" strokeWidth="2.5" strokeLinecap="round" />
                  </svg>
                </div>
              </div>

              {/* 카드 4: 오답 분석 */}
              <div className="bg-amber-50 rounded-[2rem] border border-amber-100 overflow-hidden flex flex-col md:flex-row items-center p-8 gap-6 group hover:bg-white hover:shadow-lg transition duration-500">
                <div className="flex-1 space-y-3 text-center md:text-left">
                  <h3 className="text-xl font-bold text-slate-900 tracking-tight">내 약점, 데이터로 확인하기</h3>
                  <p className="text-sm font-semibold text-slate-400 leading-relaxed">
                    어떤 단원에서 가장 많이 틀리는지 한눈에.<br />
                    취약 유형 맞춤 복습으로 빈틈없이 대비합니다.
                  </p>
                </div>
                <div className="w-full md:w-[160px] aspect-square bg-white rounded-[1.5rem] flex items-center justify-center p-4 overflow-hidden shadow-sm group-hover:scale-105 transition duration-500">
                  <svg viewBox="0 0 120 120" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
                    {/* 차트 배경 */}
                    <rect x="12" y="12" width="96" height="80" rx="8" fill="#fffbeb" />
                    {/* Y축 */}
                    <line x1="28" y1="20" x2="28" y2="82" stroke="#fde68a" strokeWidth="1.5" />
                    {/* X축 */}
                    <line x1="28" y1="82" x2="100" y2="82" stroke="#fde68a" strokeWidth="1.5" />
                    {/* 막대들 */}
                    <rect x="34" y="45" width="12" height="37" rx="3" fill="#f59e0b" opacity="0.9" />
                    <rect x="52" y="30" width="12" height="52" rx="3" fill="#f59e0b" />
                    <rect x="70" y="55" width="12" height="27" rx="3" fill="#fbbf24" opacity="0.8" />
                    <rect x="88" y="38" width="12" height="44" rx="3" fill="#f59e0b" opacity="0.9" />
                    {/* 라벨 */}
                    <text x="34" y="92" fill="#92400e" fontSize="5">수1</text>
                    <text x="52" y="92" fill="#92400e" fontSize="5">수2</text>
                    <text x="70" y="92" fill="#92400e" fontSize="5">미적</text>
                    <text x="88" y="92" fill="#92400e" fontSize="5">확통</text>
                    {/* 최고 막대에 별 표시 */}
                    <text x="54" y="27" fill="#f59e0b" fontSize="10">★</text>
                    {/* 제목 */}
                    <text x="28" y="108" fill="#92400e" fontSize="6" fontWeight="bold">단원별 오답 현황</text>
                  </svg>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* =========================================
            3. STRATEGIC TRANSFORMATION – 사이드 바이 사이드 비교
        ========================================= */}
        <section className="py-32 bg-[#F8FAFC] overflow-hidden relative">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[80%] h-[1px] bg-gradient-to-r from-transparent via-slate-200 to-transparent" />

          <div className="mx-auto max-w-6xl px-[var(--rm-pad-x)]">
            <div className="text-center mb-24 space-y-6">
              <h2 className="text-[clamp(32px,6vw,54px)] font-black text-slate-900 tracking-tighter leading-[1.1]">
                당신의 오답은<br />
                <span className="text-blue-600">‘전략’</span>으로 가공되고 있나요?
              </h2>
              <p className="text-base md:text-lg text-slate-400 font-bold max-w-xl mx-auto leading-relaxed">
                복잡한 과정은 공부의 적입니다. 가위와 풀을 버리고 스마트하게.<br />
                단 3번의 클릭으로, 오답은 완벽한 수능 자료가 됩니다.
              </p>
            </div>

            <div className="flex flex-col md:flex-row items-stretch gap-8 relative">
              {/* ─ OLD WAY (LEFT VERTICAL) ─ */}
              <div className="flex-1 group relative z-10 bg-white rounded-[3rem] border border-slate-200 p-10 shadow-[0_30px_60px_-15px_rgba(0,0,0,0.03)] transition-all hover:shadow-2xl flex flex-col min-h-[600px]">
                <div className="flex items-center gap-4 mb-10">
                  <div className="h-10 w-10 rounded-2xl bg-slate-100 flex items-center justify-center text-slate-400 font-black text-sm">OLD</div>
                  <h3 className="text-lg font-black text-slate-400 italic tracking-tight">기존의 수동 오답관리</h3>
                </div>

                <div className="flex-1 flex flex-col justify-between gap-6">
                  {[
                    { icon: "✂️", label: "교재 오리기 / 손으로 베끼기" },
                    { icon: "🧪", label: "풀칠해서 노트에 붙이기" },
                    { icon: "✏️", label: "해설지 일일이 필기하기" },
                    { icon: "📁", label: "과목마다 따로 보관하기" },
                    { icon: "🔍", label: "시험 전 오답 찾아 헤매기" },
                    { icon: "🖨️", label: "복사해서 다시 문제 만들기" }
                  ].map((step, i) => (
                    <div key={i} className="flex items-center gap-4 p-4 rounded-2xl bg-slate-50 border border-slate-50 grayscale opacity-60 group-hover:opacity-100 group-hover:grayscale-0 transition-all duration-500">
                      <span className="text-2xl">{step.icon}</span>
                      <span className="text-[12px] font-black text-slate-400">{step.label}</span>
                    </div>
                  ))}
                </div>

                <div className="mt-10 pt-8 border-t border-slate-100 text-center">
                  <div className="text-xl font-black text-slate-300 italic">“너무 많은 시간이 낭비됩니다.”</div>
                </div>
              </div>

              {/* ── VS CENTER CIRCLE ── */}
              <div className="flex md:flex-col items-center justify-center md:absolute md:left-1/2 md:top-1/2 md:-translate-x-1/2 md:-translate-y-1/2 z-20">
                <div className="w-20 h-20 md:w-24 md:h-24 rounded-full bg-slate-900 border-8 border-[#F8FAFC] flex items-center justify-center text-white font-black text-xl md:text-2xl shadow-2xl">V S</div>
              </div>

              {/* ─ NEW WAY (RIGHT VERTICAL) ─ */}
              <div className="flex-1 group relative z-10 bg-slate-900 rounded-[3rem] p-10 shadow-[0_50px_100px_-20px_rgba(30,58,138,0.25)] ring-1 ring-white/10 transition-all hover:scale-[1.02] flex flex-col min-h-[600px]">
                <div className="absolute top-0 right-0 p-12 opacity-5 scale-150 pointer-events-none group-hover:rotate-12 transition-transform duration-1000">
                  <span className="text-9xl">💎</span>
                </div>

                <div className="flex items-center gap-4 mb-10">
                  <div className="h-10 w-10 rounded-2xl bg-blue-600 flex items-center justify-center text-white font-black text-sm shadow-lg shadow-blue-500/30">NEW</div>
                  <h3 className="text-lg font-black text-blue-400 italic tracking-tight">ReMath 스마트 전략</h3>
                </div>

                <div className="flex-1 flex flex-col justify-between gap-6">
                  {[
                    { icon: "📸", title: "스마트 촬영", sub: "폰으로 찍으면 즉시 DB화" },
                    { icon: "✍️", title: "전략적 손글씨", sub: "태블릿에 바로 쓰고 정리" },
                    { icon: "📄", title: "PDF 즉시 추출", sub: "시험 전 1초 만에 모음집 완성" },
                    { icon: "🗂️", title: "영구적 보존", sub: "시간이 지나도 언제든 확인 가능" },
                    { icon: "⚡", title: "압도적 효율", sub: "오직 공부에만 집중하는 환경" }
                  ].map((item, i) => (
                    <div key={i} className="flex items-center gap-4 p-5 rounded-[2rem] bg-white/5 border border-white/10 hover:bg-white/10 transition-colors">
                      <div className="w-12 h-12 rounded-2xl bg-blue-600 flex items-center justify-center text-xl shadow-xl shadow-blue-500/20 group-hover:scale-110 transition-transform shrink-0">{item.icon}</div>
                      <div>
                        <div className="text-sm font-black text-white leading-tight">{item.title}</div>
                        <div className="text-[11px] font-bold text-slate-400 mt-0.5">{item.sub}</div>
                      </div>
                    </div>
                  ))}
                  <div className="mt-4 p-4 rounded-2xl bg-blue-500/10 border border-blue-400/20 text-blue-400 text-xs font-black text-center animate-pulse">
                    “가장 단순한 것이 가장 강력합니다”
                  </div>
                </div>

                <div className="mt-10 pt-8 border-t border-white/5 text-center">
                  <div className="text-2xl font-black text-blue-500 italic tracking-tighter">SUCCESS WITH REMATH</div>
                </div>
              </div>
            </div>
          </div>
        </section>


        {/* =========================================
            4. ACCUMULATION – 명예의 전당 (무한 슬라이더)
        ========================================= */}
        <section className="py-32 bg-slate-900 border-y border-white/5 overflow-hidden">
          <div className="mx-auto max-w-7xl px-[var(--rm-pad-x)] mb-20 text-center">
            <h2 className="text-2xl md:text-3xl font-black text-white tracking-tighter mb-4">
              수학 1등급 선배들의 리얼 후기
            </h2>
            <p className="text-base text-slate-500 font-bold italic">
              "따로 오답노트 만들 시간이 아까운 분들만 보세요."
            </p>
          </div>

          <div className="flex flex-col gap-12">
            {/* 정량적인 후기 나열 – 속도를 늦춰 가독성을 확보함 */}
            <div className="flex animate-marquee-slow gap-8 w-max">
              {[...Array(2)].map((_, groupIdx) => (
                <div key={groupIdx} className="flex gap-8">
                  {[
                    { user: "서울대 의예과 이**", text: "수학 수식이 너무 깔끔하게 인식돼서 놀랐어요. 수능 직전 약점 보완에 최고입니다.", stars: 5 },
                    { user: "수능 수학 100점 김**", text: "태블릿 필기 기능 덕분에 손맛을 잃지 않으면서도 오답 관리가 완벽해졌습니다.", stars: 5 },
                    { user: "성균관대 공학 박**", text: "미적분 단원 오답만 따로 모아 PDF로 뽑아 본 게 성적 향상의 핵심이었어요.", stars: 5 },
                    { user: "📊 수학 4→1등급 최**", text: "고2 때부터 ReMath 썼는데, 오답 사진 찍는 재미에 수학 공부가 질리지 않았어요.", stars: 5 },
                    { user: "연세대 경제 정**", text: "시험 전날 내 오답만 뽑아서 2시간 복습했는데 실제 시험에서 비슷한 문제가 나왔어요!", stars: 5 },
                    { user: "고려대 수학 윤**", text: "가위질 안 해도 된다는 게 이렇게 편할 줄 몰랐어요. 오답노트 드디어 꾸준히 씁니다.", stars: 5 },
                    { user: "수능수학 1등급 강**", text: "단원별 자동 분류가 정말 신기해요. 내가 약한 단원이 한눈에 보여서 효율적이에요.", stars: 5 },
                    { user: "외대 영어 손**", text: "수포자 직전이었는데, 오답 관리만 ReMath로 바꿨더니 점수가 20점이나 올랐어요.", stars: 5 },
                    { user: "서강대 물리 장**", text: "PDF 뽑아서 실제 시험지처럼 다시 풀었는데 훨씬 실전 감각이 살아났어요.", stars: 5 },
                    { user: "포항공대 지**", text: "오답노트 정리할 시간에 킬러 문항 하나 더 푸는 게 1등급으로 가는 지름길입니다.", stars: 5 },
                  ].map((rev, i) => (
                    <div key={`${groupIdx}-${i}`} className="bg-white/5 p-10 rounded-[3rem] border border-white/10 w-[450px] whitespace-normal hover:bg-white/10 hover:border-blue-500/30 transition-all duration-700 shrink-0">
                      <div className="flex gap-1 text-blue-500 mb-6 text-sm">{Array.from({ length: rev.stars }).map((_, j) => <span key={j}>★</span>)}</div>
                      <p className="font-bold text-slate-200 mb-8 leading-relaxed text-base italic">&ldquo;{rev.text}&rdquo;</p>
                      <div className="text-xs font-black text-blue-600 uppercase tracking-widest">{rev.user}</div>
                    </div>
                  ))}
                </div>
              ))}
            </div>
          </div>
        </section>


        {/* =========================================
            5. PRICING & FAQ – 수학 1등급을 위한 선택
        ========================================= */}
        <section id="beta-feedback" className="py-32 bg-white">
          <div className="mx-auto max-w-4xl px-[var(--rm-pad-x)]">
            <div className="text-center mb-16">
              <span className="inline-block px-4 py-1.5 rounded-full bg-blue-50 text-blue-600 text-[10px] font-black uppercase tracking-widest mb-4">Beta Version</span>
              <h2 className="text-2xl md:text-3xl font-bold text-slate-900 tracking-tighter mb-4">
                현재 모든 기능을 무료로 제공합니다
              </h2>
              <p className="text-base text-slate-500 font-semibold max-w-xl mx-auto">
                ReMath는 더 나은 서비스를 만들기 위해 베타 테스트를 진행 중입니다. <br className="hidden md:block" />
                여러분의 소중한 의견이 수학 1등급을 위한 서비스로 성장하는 밑거름이 됩니다.
              </p>
            </div>

            <FeedbackCTABar />
          </div>
        </section>

        {/* =========================================
            6. FINAL CTA – 수학 성공의 첫걸음
        ========================================= */}
        <section className="relative py-48 flex flex-col items-center text-center bg-slate-50">
          <div className="absolute inset-x-0 top-0 h-40 bg-gradient-to-b from-white to-transparent" />
          <div className="absolute -bottom-40 -left-20 w-[400px] h-[400px] bg-blue-500/5 rounded-full blur-[100px]" />

          <div className="relative z-10 max-w-3xl px-[var(--rm-pad-x)] flex flex-col items-center">
            <h2 className="text-[clamp(22px,4vw,42px)] font-bold text-slate-900 leading-[1.2] mb-10 tracking-tighter">
              모르는 문제를 남겨두지 마세요.<br />
              <span className="text-blue-600 italic font-bold">수학 1등급</span>은 오답에서 시작됩니다.
            </h2>
            <Link href="/auth" className="px-12 py-5 rounded-full bg-slate-900 text-white font-bold text-lg hover:scale-105 active:scale-95 transition-all shadow-xl">
              지금 바로 무료 시작하기
            </Link>
            <p className="mt-6 text-slate-400 font-semibold text-sm">가장 쉽고 강력한 수학 전략 도구, ReMath</p>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="py-16 bg-white border-t border-slate-50">
        <div className="mx-auto max-w-7xl px-[var(--rm-pad-x)] flex flex-col md:flex-row justify-between items-center gap-10">
          <div className="flex items-center gap-3">
            <span className="w-8 h-8 rounded-lg bg-slate-900 text-white flex items-center justify-center font-black text-xs">R</span>
            <span className="font-bold text-xl tracking-tighter">ReMath</span>
          </div>
          <div className="text-[11px] text-slate-300 font-bold tracking-tight text-center md:text-left">
            © 2024 ReMath. 수학 오답 전략의 기준. All rights reserved.
          </div>
          <div className="flex gap-8 text-[11px] font-bold text-slate-400">
            <Link href="/terms" className="hover:text-blue-600 transition">이용약관</Link>
            <Link href="/privacy" className="hover:text-blue-600 transition">개인정보처리방침</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
