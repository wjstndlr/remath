// =============================================
// PDF 생성 API (유료급 / 인쇄 안정 최종 + PRO 유도 포함)
// GET /api/pdf?type=notebook|test&subject=...&unit=...&preview=1
//
// ✅ notebook: "한 문제 = 한 페이지" 고정 (A4)
//    - 우측(텍스트/이미지)만 절제된 범위 내 자동 축소
//    - 그래도 넘치면: 2페이지로 자동 이어쓰기(안잘림 보장)
//
// ✅ test: "한 페이지 = 2문제(좌/우)" 고정 (PPT 템플릿처럼)
//
// ✅ preview=1: 2문제까지만 정상, 3번째부터 blur + 스크롤 시 PRO 오버레이 노출
// =============================================
import { NextResponse } from "next/server";
import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs";
import { cookies } from "next/headers";
import type { Problem } from "@/types";

export const dynamic = "force-dynamic";

function esc(s: string) {
  return s
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}
function nl2br(s: string) {
  return esc(s).replace(/\n/g, "<br/>");
}

export async function GET(req: Request) {
  const supabase = createRouteHandlerClient({ cookies });
  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const url = new URL(req.url);
  const type = (url.searchParams.get("type") || "test").toLowerCase();
  const preview = url.searchParams.get("preview") === "1";
  const subject = url.searchParams.get("subject") || undefined;
  const unit = url.searchParams.get("unit") || undefined;
  const singleId = url.searchParams.get("single") || undefined;
  const statusParam = url.searchParams.get("status") || undefined;

  let q = supabase.from("problems").select("*").eq("user_id", session.user.id);
  if (singleId) {
    // ✅ 단일 문제 모드: 특정 문제 1개만 PDF로 렌더링
    q = q.eq("id", singleId);
  } else {
    if (type === "test") {
      if (statusParam) q = q.eq("status", statusParam);
      else q = q.in("status", ["saved", "review"]);
    }
    if (subject) q = q.eq("subject", subject);
    if (unit) q = q.contains("unit_tags", [unit]);
  }

  const { data } = await q
    .order("created_at", { ascending: false })
    .limit(singleId ? 1 : 120); // 미리보기도 120개 가져옴 (제한 해제)

  const problems = (data ?? []) as Problem[];

  const title =
    `${subject ? `${subject} ` : ""}` +
    (type === "notebook" ? "오답노트" : "재시험") +
    (preview ? " PDF 미리보기" : " PDF");

  // ✅ 제한 해제
  const LIMIT = 9999;

  function headerHtml(p: Problem, idx: number) {
    const tags = `${p.subject} | ${(p.unit_tags || []).join(" · ")}`;
    const status =
      p.status === "review"
        ? "🔄 다시보기"
        : p.status === "mastered"
          ? "✅ 마스터"
          : "📚 보관";

    return `
      <div class="hdr">
        <div class="hdrL">
          <span class="num">${idx + 1}</span>
          <span class="tags">${esc(tags)}</span>
        </div>
        <span class="status">${status}</span>
      </div>
    `;
  }

  function notebookSheet(p: Problem, idx: number) {
    const locked = false; // 제한 없음

    const memo = ((p.memo || "") as string).trim();
    const solutionUrl = (p as any).solution_url as string | null;
    const solutionMemo = (((p as any).solution_memo || "") as string).trim();
    const handwritingUrl = (p as any).handwriting_url as string | null;
    const memoHandwritingUrl = (p as any).memo_handwriting_url as string | null;

    return `
      <section class="sheet ${locked ? "locked" : ""}" data-kind="notebook" data-index="${idx}">
        <div class="sheetInner">
          ${headerHtml(p, idx)}

          <div class="nbGrid">
            <div class="nbLeft">
              <div class="imgCard">
                <img crossorigin="anonymous" src="${p.image_url}" alt="문제 ${idx + 1}" />
              </div>

              <div class="retryBox">
                <div class="retryLabel">✏️ 한번 더 풀기</div>
                <div class="lines">
                  ${Array.from({ length: 18 })
        .map(() => `<div class="line"></div>`)
        .join("")}
                </div>
              </div>
            </div>

            <div class="nbRight" data-fit="right">
              <div class="blk">
                <div class="blkT">📝 내 해설 / 오답 포인트</div>
                <div class="memo-area">
                  ${memoHandwritingUrl
        ? `<div class="imgBox memoImg"><img crossorigin="anonymous" src="${memoHandwritingUrl}" alt="메모 손글씨" /></div>`
        : (memo ? `<div class="memo">${nl2br(memo)}</div>` : `<div class="memo muted">(해설 없음)</div>`)
      }
                </div>
              </div>

              ${handwritingUrl
        ? `
                <div class="blk">
                  <div class="blkT">✍️ 메인 손글씨 풀이</div>
                  <div class="imgBox"><img crossorigin="anonymous" src="${handwritingUrl}" alt="손글씨" /></div>
                </div>
              `
        : ""
      }

              ${solutionUrl
        ? `
                <div class="blk">
                  <div class="blkT">📎 풀이 이미지</div>
                  <div class="imgBox"><img crossorigin="anonymous" src="${solutionUrl}" alt="풀이 이미지" /></div>
                </div>
              `
        : ""
      }

              ${solutionMemo
        ? `
                <div class="blk">
                  <div class="blkT">🗒️ 추가 메모</div>
                  <div class="memo">${nl2br(solutionMemo)}</div>
                </div>
              `
        : ""
      }
            </div>
          </div>
        </div>
      </section>
    `;
  }

  function testSheet(pair: Problem[], pageIndex: number, startProblemIndex: number) {
    const leftP = pair[0];
    const rightP = pair[1] ?? null;

    const leftIdx = startProblemIndex;
    const rightIdx = startProblemIndex + 1;

    const leftLocked = false;
    const rightLocked = false;

    const cell = (p: Problem | null, idx: number, locked: boolean) => {
      if (!p) return `<div class="testCell empty"></div>`;
      return `
        <div class="testCell ${locked ? "locked" : ""}" data-index="${idx}">
          ${headerHtml(p, idx)}
          <div class="testImg">
            <img crossorigin="anonymous" src="${p.image_url}" alt="문제 ${idx + 1}" />
          </div>
          <div class="answerBox">
            <div class="answerLabel">✏️ 풀이 공간</div>
            <div class="lines">
              ${Array.from({ length: 20 })
          .map(() => `<div class="line"></div>`)
          .join("")}
            </div>
          </div>
        </div>
      `;
    };

    return `
      <section class="sheet" data-kind="test" data-page="${pageIndex}">
        <div class="sheetInner">
          <div class="testGrid">
            ${cell(leftP, leftIdx, leftLocked)}
            ${cell(rightP, rightIdx, rightLocked)}
          </div>
        </div>
      </section>
    `;
  }

  let bodyHtml = "";
  if (type === "notebook") {
    bodyHtml = problems.map((p, i) => notebookSheet(p, i)).join("");
  } else {
    const pages: Problem[][] = [];
    for (let i = 0; i < problems.length; i += 2) {
      pages.push([problems[i], problems[i + 1]].filter(Boolean) as Problem[]);
    }
    bodyHtml = pages
      .map((pair, pageIdx) => testSheet(pair, pageIdx, pageIdx * 2))
      .join("");
  }

  const html = `<!DOCTYPE html>
<html lang="ko">
<head>
  <meta charset="UTF-8" />
  <title>${esc(title)}</title>
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Noto+Sans+KR:wght@400;600;700;900&display=swap');

    * { box-sizing: border-box; }
    html, body { margin:0; padding:0; width:100%; }
    body { font-family:'Noto Sans KR', system-ui, -apple-system, Segoe UI, Roboto, sans-serif; background:#f8fafc; color:#0f172a; }

    /* ✅ 프린터 안전 여백 */
    @page { size: A4; margin: 8mm; }

    .wrap { max-width: 980px; margin: 24px auto; padding: 0 12px; }
    .screenTop { margin: 0 0 14px; text-align:center; }
    .screenTop h1 { margin: 0; font-size: 18px; font-weight: 900; }
    .screenTop p { margin: 6px 0 0; color:#64748b; font-size: 12px; }

    .printTips {
      margin: 14px auto 18px;
      padding: 12px 14px;
      border: 1px solid #e2e8f0;
      border-radius: 12px;
      background: #fff;
      color:#334155;
      font-size: 12px;
      line-height: 1.6;
    }
    .printTips b { font-weight: 900; }

    /* ✅ 공통: 한 시트 = 한 페이지 */
    .sheet {
      width: 210mm;
      min-height: 297mm;
      background:#fff;
      border: 1px solid #e2e8f0;
      border-radius: 12px;
      box-shadow: 0 10px 30px rgba(0,0,0,0.08);
      margin: 0 auto 18px;
      page-break-after: always;
      break-after: page;
      overflow: hidden;
      position: relative;
    }
    .sheetInner { width: 100%; height: 100%; padding: 10mm; }

    .hdr {
      display:flex; align-items:center; justify-content:space-between;
      padding: 10px 12px;
      background:#f8fafc;
      border: 1px solid #e2e8f0;
      border-radius: 12px;
      margin-bottom: 10px;
    }
    .hdrL { display:flex; align-items:center; gap:10px; min-width: 0; }
    .num { font-weight: 900; color:#3b82f6; font-size: 18px; min-width: 28px; }
    .tags { font-weight: 800; font-size: 12px; color:#64748b; white-space: nowrap; overflow:hidden; text-overflow: ellipsis; }
    .status { font-weight: 900; font-size: 12px; color:#ef4444; }

    /* ✅ 미리보기 잠금 */
    .locked {
      filter: blur(10px);
      opacity: 0.85;
      pointer-events: none;
      user-select: none;
    }
    .locked::after {
      content: "🔒 PRO 전용 미리보기";
      position:absolute;
      inset:0;
      display:flex;
      align-items:center;
      justify-content:center;
      font-weight: 900;
      color: rgba(15,23,42,0.55);
      font-size: 18px;
      background: rgba(255,255,255,0.15);
    }

    /* notebook */
    .nbGrid {
      display:grid;
      grid-template-columns: 1fr 1fr;
      gap: 10px;
      height: calc(297mm - 8mm*2 - 10mm*2 - 64px);
      min-height: 0;
    }
    .nbLeft, .nbRight { min-width: 0; min-height: 0; }

    .nbLeft {
      background:#f8fafc;
      border: 1px solid #e2e8f0;
      border-radius: 14px;
      padding: 10px;
      display:flex;
      flex-direction: column;
      gap: 10px;
      min-height: 0;
    }
    .imgCard img {
      width:100%;
      height:auto;
      display:block;
      border-radius: 12px;
      border: 1px solid #e2e8f0;
      max-height: 108mm;
      object-fit: contain;
      background:#fff;
    }

    .retryBox {
      border: 1px dashed #fed7aa;
      border-radius: 12px;
      padding: 10px;
      background: #fff7ed;
      flex: 1;
      min-height: 0;
    }
    .retryLabel { font-weight: 900; color:#f97316; font-size: 12px; margin-bottom: 8px; }
    .lines .line { height: 7mm; border-bottom: 1px solid #e2e8f0; }

    .nbRight {
      border: 1px solid #e2e8f0;
      border-radius: 14px;
      padding: 10px;
      display:flex;
      flex-direction: column;
      gap: 10px;
      min-height: 0;
      overflow: hidden;
    }
    .blk { min-height: 0; }
    .blkT { font-weight: 900; font-size: 12px; margin-bottom: 6px; }
    .memo {
      font-size: 12px;
      line-height: 1.55;
      color:#334155;
      background:#f8fafc;
      border: 1px solid #e2e8f0;
      border-radius: 12px;
      padding: 10px;
      word-break: break-word;
    }
    .muted { color:#94a3b8; }

    .imgBox {
      background:#fff;
      border: 1px solid #e2e8f0;
      border-radius: 12px;
      padding: 8px;
    }
    .imgBox img {
      width:100%;
      height:auto;
      display:block;
      border-radius: 10px;
      max-height: 58mm;
      object-fit: contain;
      background:#fff;
    }
    .memoImg img {
      max-height: 40mm; /* 메모는 조금 더 작게 */
      width: auto;
      max-width: 100%;
      margin: 0 auto;
    }

    /* test: 한 페이지 2문제(좌/우) */
    .testGrid {
      display:grid;
      grid-template-columns: 1fr 1fr;
      gap: 10px;
      height: calc(297mm - 8mm*2 - 10mm*2);
      min-height: 0;
    }
    .testCell {
      border: 1px solid #e2e8f0;
      border-radius: 14px;
      padding: 10px;
      display:flex;
      flex-direction: column;
      gap: 10px;
      min-height: 0;
      overflow: hidden;
      position: relative;
    }
    .testCell.empty {
      border: 1px dashed #e2e8f0;
      background: #fbfdff;
    }
    .testImg img{
      width:100%;
      height:auto;
      display:block;
      border-radius: 12px;
      border: 1px solid #e2e8f0;
      max-height: 78mm;
      object-fit: contain;
      background:#fff;
    }
    .answerBox {
      border: 1px dashed #cbd5e1;
      border-radius: 12px;
      padding: 10px 12px;
      background:#fff;
      flex: 1;
      min-height: 0;
    }
    .answerLabel { font-weight: 900; color:#64748b; font-size: 12px; margin-bottom: 8px; }

    /* 워터마크/닫기 */
    .watermark {
      position: fixed; inset: 0; pointer-events: none;
      display:flex; align-items:center; justify-content:center;
      opacity: 0.07; font-size: 64px; font-weight: 900;
      transform: rotate(-18deg); color: #0f172a;
    }
    .close-btn {
      position: fixed; top: 16px; right: 20px; z-index: 100;
      width: 40px; height: 40px; border-radius: 50%;
      background: #0f172a; color: white;
      font-size: 20px; font-weight: 900; border: none; cursor: pointer;
      display:flex; align-items:center; justify-content:center;
      box-shadow: 0 4px 12px rgba(0,0,0,0.3);
    }

    /* ✅ PRO 유도 오버레이 */
    .pro-overlay {
      display: none;
      position: fixed; inset: 0; z-index: 200;
      background: linear-gradient(to bottom, transparent 0%, rgba(248,250,252,0.65) 30%, rgba(248,250,252,0.98) 60%);
    }
    .pro-overlay.visible { display:block; }
    .pro-card {
      position: absolute;
      left: 50%;
      transform: translateX(-50%);
      bottom: 18px;
      width: min(520px, calc(100% - 28px));
      background: white;
      border: 1px solid #e2e8f0;
      border-radius: 18px;
      padding: 22px 18px 18px;
      box-shadow: 0 18px 60px rgba(0,0,0,0.18);
      text-align:center;
    }
    .pro-card .lock { font-size: 44px; margin-bottom: 8px; }
    .pro-card h2 { margin: 0; font-size: 18px; font-weight: 900; color:#0f172a; }
    .pro-card p { margin: 8px 0 16px; font-size: 13px; color:#64748b; line-height: 1.6; }
    .pro-card .pro-btn {
      display:inline-block;
      background:#f59e0b;
      color:white;
      font-size: 15px;
      font-weight: 900;
      padding: 12px 26px;
      border-radius: 999px;
      text-decoration:none;
      border: none;
      cursor:pointer;
      box-shadow: 0 10px 26px rgba(245,158,11,0.35);
    }
    .pro-card .dismiss-btn {
      display:block;
      margin: 10px auto 0;
      font-size: 12px;
      color:#94a3b8;
      background:none;
      border:none;
      cursor:pointer;
      text-decoration: underline;
    }

    /* print */
    @media print {
      body { background:#fff; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
      .wrap { max-width:none; margin:0; padding:0; }
      .screenTop, .printTips, .close-btn, .pro-overlay { display:none !important; }
      .sheet { box-shadow:none; border:none; border-radius:0; margin:0; }
      .watermark { display:none !important; }
    }
  </style>
</head>
<body>
  ${preview ? `<div class="watermark">REMATH PREVIEW</div>` : ""}
  <button class="close-btn" onclick="window.close()" title="닫기">✕</button>

  ${preview ? `<div class="watermark">REMATH PREVIEW</div>` : ""}
  <button class="close-btn" onclick="window.close()" title="닫기">✕</button>

  <div class="wrap">
    <div class="screenTop">
      <h1>${esc(title)}</h1>
      <p>생성일: ${esc(new Date().toLocaleDateString("ko-KR"))} | 총 ${problems.length}문제${subject ? ` | ${esc(subject)}` : ""}${unit ? ` | ${esc(unit)}` : ""}</p>
    </div>

    <div class="printTips">
      <b>권장 인쇄 설정</b><br/>
      용지 <b>A4</b> · 배율 <b>실제 크기(100%)</b> · 여백 <b>기본값</b> · <b>머리글/바닥글 OFF</b><br/>
      (브라우저/프린터마다 “인쇄 가능 영역에 맞추기”는 스케일이 흔들릴 수 있어요)
    </div>

    ${bodyHtml}
  </div>

  <script>
    // ============================================================
    // notebook "안잘림" 전략 (네가 쓰던 안정 로직 그대로)
    // ============================================================
    const IS_PREVIEW = ${preview ? "true" : "false"};
    const LIMIT = ${LIMIT};

    function measureOverflow(sheet) {
      const inner = sheet.querySelector('.sheetInner');
      return inner && (inner.scrollHeight > sheet.clientHeight + 2);
    }

    function fitRightColumn(sheet) {
      const right = sheet.querySelector('[data-fit="right"]');
      if (!right) return { done:false, stillOverflow:false };

      const memoEls = right.querySelectorAll('.memo');
      const imgEls = right.querySelectorAll('.imgBox img');

      const steps = [
        { memo: 12, img: 58 },
        { memo: 11, img: 50 },
        { memo: 10, img: 44 },
      ];

      for (const st of steps) {
        memoEls.forEach(el => { el.style.fontSize = st.memo + 'px'; el.style.lineHeight = (st.memo === 10 ? '1.45' : '1.55'); });
        imgEls.forEach(el => { el.style.maxHeight = st.img + 'mm'; });
        if (!measureOverflow(sheet)) return { done:true, stillOverflow:false };
      }
      return { done:true, stillOverflow:true };
    }

    function cloneContinuationSheet(origSheet) {
      const clone = origSheet.cloneNode(true);
      clone.classList.remove('locked');

      const tags = clone.querySelector('.hdr .tags');
      if (tags) tags.innerHTML = tags.innerHTML + ' <span style="color:#94a3b8;font-weight:900;">(계속)</span>';

      const left = clone.querySelector('.nbLeft');
      if (left) {
        const imgCard = left.querySelector('.imgCard');
        if (imgCard) imgCard.remove();
      }
      return clone;
    }

    function splitNotebookIfNeeded(sheet) {
      if (sheet.classList.contains('locked')) return;
      if (!measureOverflow(sheet)) return;

      const res = fitRightColumn(sheet);
      if (!res.stillOverflow) return;

      const right = sheet.querySelector('[data-fit="right"]');
      if (!right) return;

      const blocks = Array.from(right.querySelectorAll('.blk'));
      if (blocks.length <= 1) return;

      const cont = cloneContinuationSheet(sheet);
      const contRight = cont.querySelector('[data-fit="right"]');
      if (!contRight) return;

      contRight.innerHTML = '';

      for (let k = blocks.length - 1; k >= 1; k--) {
        const blk = blocks[k];
        contRight.prepend(blk); // 원본 -> cont 이동

        fitRightColumn(sheet);

        if (!measureOverflow(sheet)) {
          fitRightColumn(cont);
          sheet.insertAdjacentElement('afterend', cont);
          if (measureOverflow(cont)) splitNotebookIfNeeded(cont);
          return;
        }
      }

      sheet.insertAdjacentElement('afterend', cont);
      fitRightColumn(cont);
    }

    function finalizeLayout() {
      const notebookSheets = document.querySelectorAll('.sheet[data-kind="notebook"]');
      notebookSheets.forEach(s => splitNotebookIfNeeded(s));
    }

    // ============================================================
    // ✅ PRO 유도: 베타라서 삭제
    // ============================================================
    function setupProGate() {
      // do nothing
    }

    function onReady(cb) {
      if (document.readyState === 'complete') return cb();
      window.addEventListener('load', cb, { once: true });
    }

    onReady(() => {
      finalizeLayout();
      setTimeout(finalizeLayout, 350);
      setTimeout(finalizeLayout, 900);

      setupProGate();

      if (!IS_PREVIEW) {
        setTimeout(() => window.print(), 250);
      }
    });
  </script>
</body>
</html>`;

  return new NextResponse(html, {
    headers: { "Content-Type": "text/html; charset=utf-8" },
  });
}