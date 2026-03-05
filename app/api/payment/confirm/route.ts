import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

export async function GET(req: NextRequest) {
    const { searchParams } = new URL(req.url);
    const paymentKey = searchParams.get("paymentKey");
    const orderId = searchParams.get("orderId");
    const amount = searchParams.get("amount");
    const userId = searchParams.get("userId");

    if (!paymentKey || !orderId || !amount || !userId) {
        return NextResponse.redirect(`${new URL(req.url).origin}/upgrade?error=missing_params`);
    }

    try {
        // 1. 토스 결제 승인 API 호출 (Secret Key 필요)
        const secretKey = process.env.TOSS_SECRET_KEY || "test_sk_Z61zYpQwq66bo097W7nrV9pxLvg2";
        const basicAuth = Buffer.from(`${secretKey}:`).toString("base64");

        const response = await fetch("https://api.tosspayments.com/v1/payments/confirm", {
            method: "POST",
            headers: {
                Authorization: `Basic ${basicAuth}`,
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                paymentKey,
                orderId,
                amount,
            }),
        });

        const result = await response.json();

        if (response.ok) {
            // 2. 결제 성공 시 Supabase DB 업데이트
            const { error } = await supabase
                .from("profiles")
                .update({
                    is_pro: true,
                    // 만료일 설정 (30일 뒤)
                    pro_expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
                } as any)
                .eq("id", userId);

            if (error) {
                console.error("DB Update Error:", error);
                return NextResponse.redirect(`${new URL(req.url).origin}/upgrade?error=db_update_failed`);
            }

            // 3. 성공 페이지로 이동 (또는 홈으로)
            return NextResponse.redirect(`${new URL(req.url).origin}/notebook/all?payment=success`);
        } else {
            console.error("Toss Confirm Error:", result);
            return NextResponse.redirect(`${new URL(req.url).origin}/upgrade?error=payment_failed`);
        }
    } catch (err) {
        console.error("Payment Confirm API Error:", err);
        return NextResponse.redirect(`${new URL(req.url).origin}/upgrade?error=server_error`);
    }
}
