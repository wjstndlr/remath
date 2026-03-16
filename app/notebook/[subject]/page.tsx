"use client";

import { useEffect, useState, Suspense } from "react";
import { supabase } from "@/lib/supabase";
import { useRouter } from "next/navigation";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { MainHeader } from "@/components/layout/MainHeader";
import NotebookFlip from "@/components/notebook/NotebookFlip";
import type { Problem, Subject, UserProfile } from "@/types";

function NotebookSubjectPageInner({ params }: { params: { subject: Subject } }) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const subject = decodeURIComponent(params.subject) as Subject;

  const [loading, setLoading] = useState(true);
  const [problems, setProblems] = useState<Problem[]>([]);
  const [activeUnit, setActiveUnit] = useState<string>("전체");
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [userEmail, setUserEmail] = useState<string>("");
  const [toast, setToast] = useState<string | null>(null);

  const focusId = searchParams.get("focus");

  const showToast = (msg: string) => {
    setToast(msg);
    window.clearTimeout((showToast as any)._t);
    (showToast as any)._t = window.setTimeout(() => setToast(null), 1800);
  };

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.push("/auth");
        return;
      }
      setUserEmail(user.email ?? "");

      const [{ data: probs }, { data: prof }] = await Promise.all([
        supabase
          .from("problems")
          .select("*")
          .eq("user_id", user.id)
          .eq("subject", subject)
          .order("created_at", { ascending: false }),
        supabase.from("profiles").select("*").eq("id", user.id).maybeSingle(),
      ]);

      setProblems((probs ?? []) as Problem[]);
      setProfile((prof as any) ?? null);
      setLoading(false);
    }
    load();
  }, [router, supabase, subject]);

  const openPdfNotebook = () => {
    const u = encodeURIComponent(activeUnit || "전체");
    const s = encodeURIComponent(subject);
    const unitParam = activeUnit === "전체" ? "" : `&unit=${u}`;
    window.open(`/api/pdf?type=notebook&subject=${s}${unitParam}`, "_blank");
  };

  const openPdfTest = () => {
    const u = encodeURIComponent(activeUnit || "전체");
    const s = encodeURIComponent(subject);
    const unitParam = activeUnit === "전체" ? "" : `&unit=${u}`;
    window.open(`/api/pdf?type=test&subject=${s}${unitParam}`, "_blank");
  };

  return (
    <div className="flex min-h-screen flex-col bg-[#F9FAFB]">
      <MainHeader />

      {toast && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 px-4 py-3 rounded-2xl bg-slate-900 text-white text-sm font-bold shadow-2xl">
          {toast}
        </div>
      )}

      <main className="mx-auto w-full max-w-6xl flex-1 px-4 sm:px-6 py-8">
        <div className="flex items-center justify-between mb-6">
          <Link
            href="/dashboard"
            className="px-4 py-2 rounded-xl bg-white border border-slate-200 text-slate-700 font-bold text-sm hover:bg-slate-50"
          >
            ← 책장
          </Link>
          <div className="text-xs font-bold text-slate-500">
            {loading ? "" : `${problems.length}문항`}
          </div>
        </div>

        {loading ? (
          <div className="flex justify-center py-20">
            <div className="w-10 h-10 border-4 border-slate-200 border-t-action rounded-full animate-spin" />
          </div>
        ) : (
          <NotebookFlip
            problems={problems}
            subjectLabel={`${subject} 오답노트`}
            activeUnit={activeUnit}
            onUnitChange={setActiveUnit}
            focusId={focusId}
            isPro={!!profile?.is_pro}
            userEmail={userEmail}
            onOpenPdf={openPdfNotebook}
            onOpenTestPdf={openPdfTest}
          />
        )}
      </main>
    </div>
  );
}

export default function NotebookSubjectPage({ params }: { params: { subject: Subject } }) {
  return (
    <Suspense fallback={<div className="flex min-h-screen items-center justify-center">Loading...</div>}>
      <NotebookSubjectPageInner params={params} />
    </Suspense>
  );
}
