// =============================================
// Supabase Auth OAuth 콜백 처리
// Google 로그인 후 이쪽으로 리다이렉트 됨
// =============================================
import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export async function GET(req: NextRequest) {
    const requestUrl = new URL(req.url);
    const code = requestUrl.searchParams.get("code");
    const next = requestUrl.searchParams.get("next") ?? "/dashboard";

    let finalNext = next;

    if (code) {
        const supabase = createRouteHandlerClient({ cookies });
        await supabase.auth.exchangeCodeForSession(code);

        // 추가 기획: 저장완료(saved) 또는 다시보기(review) 문제가 0개라면 /upload 로 강제 이동
        const { count } = await supabase
            .from("problems")
            .select("*", { count: "exact", head: true })
            .in("status", ["saved", "review"]);

        // 만약 next 파라미터가 명시적으로 다른 곳(/auth 등)을 가리키고 있지 않고 기본값(/dashboard)일 때 우선 적용
        if (count === 0 && (!requestUrl.searchParams.has("next") || requestUrl.searchParams.get("next") === "/dashboard")) {
            finalNext = "/upload";
        }
    }

    return NextResponse.redirect(`${requestUrl.origin}${finalNext}`);
}
