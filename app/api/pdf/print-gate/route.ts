// =============================================
// PDF 인쇄 게이트 API (서버사이드 카운트 관리)
// POST /api/pdf/print-gate
//
// - 베타 기간: 무제한 전면 무료
// =============================================
import { NextResponse } from "next/server";
import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs";
import { cookies } from "next/headers";

export const dynamic = "force-dynamic";

export async function POST() {
    const supabase = createRouteHandlerClient({ cookies });
    const {
        data: { session },
    } = await supabase.auth.getSession();

    if (!session) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // 베타 기간: 무조건 허용
    return NextResponse.json({
        allowed: true,
        used: 0,
        remaining: -1,
        limit: 999,
    });
}
