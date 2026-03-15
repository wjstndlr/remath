"use client";

import { useState } from "react";
import { FeedbackModal } from "./FeedbackModal";

export function FeedbackCTABar() {
    const [isOpen, setIsOpen] = useState(false);

    return (
        <div className="p-10 md:p-14 rounded-[3rem] bg-slate-900 text-center flex flex-col items-center relative shadow-2xl overflow-hidden">
            <div className="absolute top-0 right-0 p-12 opacity-5 scale-150 pointer-events-none">
                <span className="text-9xl">💡</span>
            </div>
            <h3 className="text-xl md:text-2xl font-black text-white mb-4">
                불편한 점이 있으셨나요?
            </h3>
            <p className="text-slate-400 font-medium mb-10 max-w-md">
                기능 제안, 버그 리포트, 혹은 단순한 응원의 메시지까지!<br />
                가장 빠르게 확인하고 개선하겠습니다.
            </p>
            <button
                onClick={() => setIsOpen(true)}
                className="inline-flex items-center gap-2 px-8 py-4 rounded-2xl bg-blue-600 text-white font-bold text-lg hover:bg-blue-500 transition-all shadow-xl shadow-blue-500/20 active:scale-95 z-10 relative"
            >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="2" y="4" width="20" height="16" rx="2"></rect>
                    <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"></path>
                </svg>
                개발팀에게 의견 보내기
            </button>

            <FeedbackModal isOpen={isOpen} onClose={() => setIsOpen(false)} />
        </div>
    );
}
