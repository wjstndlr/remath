"use client";

import { useState } from "react";

interface FeedbackModalProps {
    isOpen: boolean;
    onClose: () => void;
    userEmail?: string | null;
}

export function FeedbackModal({ isOpen, onClose, userEmail }: FeedbackModalProps) {
    const [message, setMessage] = useState("");
    const [loading, setLoading] = useState(false);
    const [result, setResult] = useState<{ type: "success" | "error"; text: string } | null>(null);

    if (!isOpen) return null;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!message.trim()) return;

        setLoading(true);
        setResult(null);

        try {
            const res = await fetch("/api/feedback", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ message, userEmail }),
            });

            const data = await res.json();
            if (res.ok) {
                setResult({ type: "success", text: "의견이 성공적으로 전송되었습니다!" });
                setTimeout(() => {
                    onClose();
                    setMessage("");
                    setResult(null);
                }, 2000);
            } else {
                setResult({ type: "error", text: data.error || "전송에 실패했습니다." });
            }
        } catch (error) {
            setResult({ type: "error", text: "네트워크 오류가 발생했습니다." });
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            {/* 백그라운드 블러 */}
            <div
                className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm transition-opacity"
                onClick={onClose}
            />

            <div className="relative w-full max-w-md bg-white rounded-3xl shadow-2xl p-6 sm:p-8 animate-in fade-in zoom-in-95 duration-200">
                <button
                    onClick={onClose}
                    className="absolute top-4 right-4 p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full transition"
                >
                    ✕
                </button>

                <div className="text-center mb-6">
                    <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center text-xl mx-auto mb-4">
                        💡
                    </div>
                    <h2 className="text-2xl font-bold text-slate-900 mb-2">의견/버그 제보</h2>
                    <p className="text-sm text-slate-500 font-medium">
                        여러분의 소중한 의견이<br />ReMath를 더 나은 서비스로 만듭니다.
                    </p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <textarea
                            required
                            value={message}
                            onChange={(e) => setMessage(e.target.value)}
                            placeholder="예) 오답노트 생성 시 오류가 발생해요. / 이런 기능이 있었으면 좋겠어요!"
                            className="w-full h-32 p-4 rounded-xl border border-slate-200 bg-slate-50 text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition resize-none text-sm"
                            disabled={loading || result?.type === "success"}
                        />
                    </div>

                    {result && (
                        <div className={`p-3 rounded-lg text-sm font-bold text-center ${result.type === "success" ? "bg-emerald-50 text-emerald-600" : "bg-red-50 text-red-600"
                            }`}>
                            {result.text}
                        </div>
                    )}

                    <button
                        type="submit"
                        disabled={loading || !message.trim() || result?.type === "success"}
                        className="w-full py-4 rounded-xl bg-slate-900 text-white font-bold hover:bg-black transition disabled:opacity-50 disabled:active:scale-100 active:scale-[0.98]"
                    >
                        {loading ? "전송 중..." : "개발팀에게 보내기"}
                    </button>
                </form>
            </div>
        </div>
    );
}
