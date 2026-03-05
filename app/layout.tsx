import "./globals.css";
import type { ReactNode } from "react";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "ReMath - 찍고 해설만 쓰면 오답노트 완성",
  description: "당신은 정리하지 마세요. 수집부터 단원별 오답 시험지 생성까지 ReMath가 자동으로 해결합니다."
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="ko">
      <head>
        <link rel="stylesheet" as="style" crossOrigin="" href="https://cdn.jsdelivr.net/gh/orioncactus/pretendard@v1.3.8/dist/web/variable/pretendardvariable.css" />
      </head>
      <body className="min-h-screen bg-softbg text-primary font-pretendard">
        {children}
      </body>
    </html>
  );
}

