// =============================================
// 인증 미들웨어
// 로그인 안 된 유저를 /auth 로 리다이렉트
// ✅ 정적 파일(public 이미지/폰트/css/js 등)은 리다이렉트 제외 (랜딩 이미지 깨짐 방지)
// =============================================
import { createMiddlewareClient } from "@supabase/auth-helpers-nextjs";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

// 로그인 없이도 접근 가능한 경로
const PUBLIC_PATHS = ["/", "/auth", "/plans"];

// ✅ 확장자가 있는 정적 파일 요청은 인증 체크 제외
// (예: /hero_tablet_mockup.png, /fonts/Pretendard.woff2 등)
const PUBLIC_FILE = /\.(.*)$/;

export async function middleware(req: NextRequest) {
    const res = NextResponse.next();
    const supabase = createMiddlewareClient({ req, res });

    const { pathname } = req.nextUrl;

    // ✅ 1) 정적 파일은 바로 통과 (인증 리다이렉트 금지)
    if (PUBLIC_FILE.test(pathname)) {
        return res;
    }

    // ✅ 2) public 경로는 세션 체크 없이 통과
    const isPublic = PUBLIC_PATHS.some((p) => pathname === p || pathname.startsWith("/auth"));
    if (isPublic) {
        return res;
    }

    // ✅ 3) 그 외는 세션 체크 후 없으면 /auth로 리다이렉트
    const {
        data: { session },
    } = await supabase.auth.getSession();

    if (!session) {
        const redirectUrl = req.nextUrl.clone();
        redirectUrl.pathname = "/auth";
        redirectUrl.searchParams.set("redirectTo", pathname);
        return NextResponse.redirect(redirectUrl);
    }

    return res;
}

export const config = {
    matcher: [
        // 기존 제외 규칙 유지
        "/((?!_next/static|_next/image|favicon.ico|api).*)",
    ],
};