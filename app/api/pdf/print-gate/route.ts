// =============================================
// PDF 인쇄 게이트 API (서버사이드 카운트 관리)
// POST /api/pdf/print-gate
//
// - profiles.pdf_print_free_count 를 서버에서 조회/증가
// - 2회까지 → { allowed: true }
// - 3회부터 → { allowed: false, reason: "limit_exceeded" }
// - is_pro = true → 항상 { allowed: true }
// =============================================
import { NextResponse } from "next/server";
import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs";
import { cookies } from "next/headers";

export const dynamic = "force-dynamic";

const FREE_PDF_PRINT_LIMIT = 2;

export async function POST() {
    const supabase = createRouteHandlerClient({ cookies });
    const {
        data: { session },
    } = await supabase.auth.getSession();

    if (!session) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // 1. 현재 프로필 조회
    const { data: profile, error: fetchErr } = await supabase
        .from("profiles")
        .select("is_pro, pdf_print_free_count")
        .eq("id", session.user.id)
        .single();

    if (fetchErr || !profile) {
        // 프로필이 없는 경우 (최초) → 허용하고 생성
        return NextResponse.json({ allowed: true, remaining: FREE_PDF_PRINT_LIMIT - 1 });
    }

    // 2. PRO 사용자는 무조건 허용
    if (profile.is_pro) {
        return NextResponse.json({ allowed: true, remaining: -1 }); // -1 = unlimited
    }

    const currentCount = profile.pdf_print_free_count ?? 0;

    // 3. 무료 한도 초과 체크
    if (currentCount >= FREE_PDF_PRINT_LIMIT) {
        return NextResponse.json({
            allowed: false,
            reason: "limit_exceeded",
            used: currentCount,
            limit: FREE_PDF_PRINT_LIMIT,
        });
    }

    // 4. 카운트 증가 (서버사이드에서만 처리)
    const newCount = currentCount + 1;
    await supabase
        .from("profiles")
        .update({ pdf_print_free_count: newCount })
        .eq("id", session.user.id);

    const remaining = FREE_PDF_PRINT_LIMIT - newCount;

    return NextResponse.json({
        allowed: true,
        used: newCount,
        remaining,
        limit: FREE_PDF_PRINT_LIMIT,
    });
}
