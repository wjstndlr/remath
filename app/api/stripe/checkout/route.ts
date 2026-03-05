// =============================================
// Stripe Checkout 세션 생성 API
// POST /api/stripe/checkout
// =============================================
import { NextResponse } from "next/server";
import Stripe from "stripe";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
    apiVersion: "2024-06-20",
});

export async function POST(req: Request) {
    try {
        const { userId, email } = await req.json();
        if (!userId) return NextResponse.json({ error: "userId required" }, { status: 400 });

        const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

        const session = await stripe.checkout.sessions.create({
            mode: "subscription",
            customer_email: email,
            line_items: [
                {
                    price: process.env.STRIPE_PRO_PRICE_ID!,
                    quantity: 1,
                },
            ],
            success_url: `${appUrl}/dashboard?subscribed=1`,
            cancel_url: `${appUrl}/plans`,
            metadata: { userId },
            subscription_data: {
                trial_period_days: 7,
                metadata: { userId },
            },
        });

        return NextResponse.json({ url: session.url });
    } catch (e) {
        console.error("[Stripe Checkout Error]", e);
        return NextResponse.json({ error: "결제 세션 생성 실패" }, { status: 500 });
    }
}
