"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { usePathname, useRouter } from "next/navigation";
import { FeedbackModal } from "@/components/ui/FeedbackModal";

export function MainHeader() {
  const router = useRouter();
  const pathname = usePathname();

  const [email, setEmail] = useState<string | null>(null);
  const [open, setOpen] = useState(false);
  const [feedbackOpen, setFeedbackOpen] = useState(false);

  // PWA Install Prompt 상태
  const [showPWA, setShowPWA] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser();
      setEmail(user?.email ?? null);
    }
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname]);

  // PWA 설치 배너 로직
  useEffect(() => {
    const isStandalone = window.matchMedia("(display-mode: standalone)").matches
      || (window.navigator as any).standalone;
    if (isStandalone) return; // 이미 PWA로 실행 중
    if (localStorage.getItem("pwaBannerDismissed") === "true") return;

    const ua = window.navigator.userAgent.toLowerCase();
    // iPadOS 13+ Safari는 UA에 "Macintosh"로 표시되므로 터치 지원 여부로 추가 판별
    const iosDevice = /iphone|ipad|ipod/.test(ua)
      || (ua.includes("macintosh") && navigator.maxTouchPoints > 1);
    setIsIOS(iosDevice);

    if (iosDevice) {
      setShowPWA(true);
    } else {
      const handler = (e: Event) => {
        e.preventDefault();
        setDeferredPrompt(e);
        setShowPWA(true);
      };
      window.addEventListener("beforeinstallprompt", handler);
      return () => window.removeEventListener("beforeinstallprompt", handler);
    }
  }, []);

  const handleInstallPWA = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === "accepted") setShowPWA(false);
      setDeferredPrompt(null);
    }
  };

  const dismissPWA = () => {
    setShowPWA(false);
    localStorage.setItem("pwaBannerDismissed", "true");
  };

  const logout = async () => {
    await supabase.auth.signOut();
    setEmail(null);
    setOpen(false);
    router.push("/");
  };

  const handleFeedbackClick = (e: React.MouseEvent) => {
    e.preventDefault();
    setOpen(false);
    setFeedbackOpen(true);
  };

  return (
    <>
      <div className="sticky top-0 z-50 flex flex-col w-full">
        {/* PWA 앱 설치 유도 배너 (초록색) */}
        {showPWA && (
          <div className="bg-emerald-600 text-white text-[11px] md:text-xs font-bold py-2.5 px-4 flex justify-center items-center gap-3 w-full relative">
            <span className="shrink-0">📲</span>
            {isIOS ? (
              <span className="text-center leading-snug">
                Safari 하단 <span className="inline-block mx-0.5 border border-white/40 rounded px-1 text-[10px]">⎋</span> 공유 버튼 → <strong>&apos;홈 화면에 추가&apos;</strong>로 앱처럼 사용하세요!
              </span>
            ) : (
              <span>ReMath를 홈 화면에 추가하고 앱처럼 빠르게 사용하세요!</span>
            )}
            {!isIOS && deferredPrompt && (
              <button onClick={handleInstallPWA} className="ml-1 px-3 py-1 bg-white text-emerald-700 rounded-lg text-[11px] font-black hover:bg-emerald-50 transition shrink-0">
                설치하기
              </button>
            )}
            <button onClick={dismissPWA} className="ml-2 text-white/60 hover:text-white transition shrink-0 text-sm">✕</button>
          </div>
        )}

        {/* Beta 안내 배너 */}
        <div className="bg-slate-900 text-white text-[11px] md:text-xs font-bold py-2 px-4 flex justify-center items-center gap-2 w-full relative">
          <span className="bg-blue-600 text-white px-1.5 py-0.5 rounded text-[9px] uppercase tracking-wider">Beta</span>
          <span>현재 베타 기간 동안 모든 기능을 무료로 제공합니다!</span>
          <button onClick={handleFeedbackClick} className="ml-2 underline text-blue-300 hover:text-white transition">문의/피드백 보내기 &rarr;</button>
        </div>
        <header className="border-b border-slate-200 bg-white/80 backdrop-blur-md w-full relative">
          <div className="mx-auto flex max-w-7xl items-center justify-between px-[var(--rm-pad-x)] h-[clamp(60px,8vh,72px)]">
            <Link href="/" className="flex items-center gap-2 pr-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-slate-900 text-xs font-black text-white shadow-sm shadow-slate-900/20">
                R
              </div>
              <div className="flex flex-col sm:flex-row sm:items-baseline sm:gap-1.5">
                <span className="text-base font-black text-slate-900 tracking-tight">ReMath</span>
                <span className="hidden sm:inline text-[9px] font-black text-slate-400 uppercase tracking-tighter">오답노트</span>
              </div>
            </Link>

            <nav className="flex items-center gap-2 text-sm">
              <Link href="/upload" className="flex items-center justify-center px-4 h-10 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold transition">
                📷 <span className="hidden sm:inline ml-1">오답 등록</span>
              </Link>
              <Link href="/dashboard" className="flex items-center justify-center px-4 h-10 rounded-xl bg-white border border-slate-200 hover:bg-slate-50 text-slate-800 font-bold transition">
                책장
              </Link>
              <Link href="/session/today" className="flex items-center justify-center px-4 h-10 rounded-xl bg-action text-white font-bold hover:bg-blue-600 transition shadow-lg shadow-blue-500/20">
                재시험
              </Link>

              <button
                onClick={() => setOpen(true)}
                className="ml-1 p-2 rounded-xl text-slate-600 hover:bg-slate-100 transition"
              >
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="3" y1="12" x2="21" y2="12"></line>
                  <line x1="3" y1="6" x2="21" y2="6"></line>
                  <line x1="3" y1="18" x2="21" y2="18"></line>
                </svg>
              </button>
            </nav>
          </div>
        </header>
      </div>

      <FeedbackModal
        isOpen={feedbackOpen}
        onClose={() => setFeedbackOpen(false)}
        userEmail={email}
      />

      {/* 콴다 스타일 사이드 드로어 메뉴 */}
      {open && (
        <div className="fixed inset-0 z-50 flex overflow-hidden">
          <div
            className="absolute inset-0 bg-black/30 backdrop-blur-sm transition-opacity animate-in fade-in duration-300"
            onClick={() => setOpen(false)}
          />
          <div className="relative ml-auto flex h-full w-full max-w-[280px] flex-col bg-white shadow-2xl animate-in slide-in-from-right duration-300">
            {/* 드로어 헤더 */}
            <div className="flex items-center justify-between border-b border-slate-100 p-6">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-full bg-slate-100 flex items-center justify-center text-lg">💡</div>
                <div className="flex flex-col">
                  <span className="text-xs font-bold text-slate-400">안녕하세요!</span>
                  <span className="text-sm font-black text-slate-900 truncate max-w-[140px]">{email?.split('@')[0]}님</span>
                </div>
              </div>
              <button
                onClick={() => setOpen(false)}
                className="p-2 rounded-lg text-slate-400 hover:bg-slate-50"
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="18" y1="6" x2="6" y2="18"></line>
                  <line x1="6" y1="6" x2="18" y2="18"></line>
                </svg>
              </button>
            </div>

            {/* 드로어 메뉴 목록 */}
            <div className="flex-1 overflow-y-auto p-4 space-y-1">
              {[
                { label: '홈', icon: '🏠', href: '/' },
                { label: '나의 오답 책장', icon: '📚', href: '/dashboard' },
                { label: '의견/버그 제보', icon: '💬', onClick: handleFeedbackClick },
              ].map((item) => (
                item.href ? (
                  <Link
                    key={item.label}
                    href={item.href}
                    onClick={() => setOpen(false)}
                    className="flex items-center gap-4 px-4 py-4 rounded-2xl text-[15px] font-bold text-slate-700 hover:bg-slate-50 transition"
                  >
                    <span className="text-xl">{item.icon}</span>
                    {item.label}
                  </Link>
                ) : (
                  <button
                    key={item.label}
                    onClick={item.onClick}
                    className="w-full flex items-center gap-4 px-4 py-4 rounded-2xl text-[15px] font-bold text-slate-700 hover:bg-slate-50 transition text-left"
                  >
                    <span className="text-xl">{item.icon}</span>
                    {item.label}
                  </button>
                )
              ))}
            </div>

            {/* 드로어 푸터 (로그아웃 버튼) */}
            <div className="border-t border-slate-100 p-6">
              {email ? (
                <button
                  onClick={logout}
                  className="flex items-center gap-3 text-sm font-bold text-rose-500 hover:text-rose-600 transition"
                >
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path>
                    <polyline points="16 17 21 12 16 7"></polyline>
                    <line x1="21" y1="12" x2="9" y2="12"></line>
                  </svg>
                  로그아웃
                </button>
              ) : (
                <Link
                  href="/auth"
                  onClick={() => setOpen(false)}
                  className="w-full flex items-center justify-center py-4 rounded-2xl bg-slate-900 text-white font-bold"
                >
                  로그인하기
                </Link>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
