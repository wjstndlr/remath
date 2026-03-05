"use client";
import { useEffect, useState } from "react";
import { loadTossPayments } from "@tosspayments/payment-sdk";
import { supabase } from "@/lib/supabase";
import { useRouter } from "next/navigation";

const clientKey = process.env.NEXT_PUBLIC_TOSS_CLIENT_KEY || "test_ck_D5akZdBW3On50ra4z6bV30QY8q4A";

export default function UpgradePage() {
    const [loading, setLoading] = useState(false);
    const [user, setUser] = useState<any>(null);
    const router = useRouter();

    useEffect(() => {
        supabase.auth.getUser().then(({ data }) => {
            if (!data.user) {
                router.push("/auth");
            } else {
                setUser(data.user);
            }
        });
    }, [router]);

    const handlePayment = async () => {
        if (!user) return;
        setLoading(true);
        try {
            const tossPayments = await loadTossPayments(clientKey);
            const orderId = `order_${user.id}_${Date.now()}`;

            await tossPayments.requestPayment("카드", {
                amount: 6900,
                orderId,
                orderName: "ReMath Pro 1개월 구독",
                customerName: user.email?.split("@")[0] || "회원",
                successUrl: `${window.location.origin}/api/payment/confirm?userId=${user.id}`,
                failUrl: `${window.location.origin}/upgrade?fail=true`,
            });
        } catch (err) {
            console.error(err);
            alert("결제 요청 중 오류가 발생했습니다.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6">
            <div className="max-w-md w-full bg-white rounded-[3rem] shadow-2xl p-10 text-center border border-slate-100">
                <div className="mb-8">
                    <span className="inline-block px-4 py-1.5 rounded-full bg-blue-50 text-blue-600 text-[10px] font-black uppercase tracking-widest mb-4">Premium Membership</span>
                    <h1 className="text-3xl font-black text-slate-900 mb-2">ReMath Pro</h1>
                    <p className="text-slate-400 font-semibold text-sm">모든 기능을 무제한으로 이용하세요</p>
                </div>

                <div className="bg-slate-50 rounded-2xl p-6 mb-8 text-left">
                    <ul className="space-y-3">
                        {[
                            "취약 유형 맞춤 PDF 무제한 인쇄",
                            "AI 기출 변형 유사 문항 생성",
                            "1:1 정밀 성적 분석 리포트",
                            "모든 기기 실시간 동기화"
                        ].map((f, i) => (
                            <li key={i} className="flex items-center gap-3 text-sm font-bold text-slate-600">
                                <span className="text-blue-500">✓</span> {f}
                            </li>
                        ))}
                    </ul>
                </div>

                <div className="mb-10">
                    <div className="text-4xl font-black text-slate-900 mb-1">₩6,900</div>
                    <div className="text-xs text-slate-400 font-bold">매월 자동 결제 (언제든 해지 가능)</div>
                </div>

                <button
                    onClick={handlePayment}
                    disabled={loading}
                    className="w-full py-5 rounded-2xl bg-blue-600 text-white font-black text-lg shadow-xl shadow-blue-200 hover:scale-[1.02] active:scale-95 transition-all disabled:opacity-50"
                >
                    {loading ? "결제창 여는 중..." : "Pro로 지금 시작하기"}
                </button>

                <p className="mt-6 text-[11px] text-slate-400 font-medium">
                    결제 시 이용약관 및 개인정보처리방침에 동의하게 됩니다.
                </p>
            </div>
        </div>
    );
}
