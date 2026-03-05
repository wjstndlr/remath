// =============================================
// Supabase 클라이언트 — 브라우저용 & 서버용
// =============================================
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

/** 클라이언트 컴포넌트용 (브라우저에서 호출) */
export const supabase = createClientComponentClient();

/** 타입 없이 사용하는 심플 클라이언트 (레거시 호환) */
export const createSupabaseClient = () =>
    createClient(supabaseUrl, supabaseAnonKey);
