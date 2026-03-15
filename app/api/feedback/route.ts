import { NextResponse } from "next/server";
import nodemailer from "nodemailer";

export async function POST(req: Request) {
    try {
        const { email, message, userEmail } = await req.json();

        if (!message) {
            return NextResponse.json({ error: "메시지를 입력해주세요." }, { status: 400 });
        }

        // .env.local 설정 필요
        const user = process.env.EMAIL_USER;
        const pass = process.env.EMAIL_PASS;
        const adminEmail = process.env.ADMIN_EMAIL || user;

        if (!user || !pass) {
            console.error("이메일 환경변수가 설정되지 않았습니다.");
            return NextResponse.json({ error: "서버 이메일 설정이 필요합니다." }, { status: 500 });
        }

        const transporter = nodemailer.createTransport({
            service: "gmail",
            auth: {
                user,
                pass,
            },
        });

        const mailOptions = {
            from: user,
            to: adminEmail,
            subject: `[ReMath Beta 피드백] ${email || userEmail || "익명 사용자"}님의 의견`,
            text: `보낸 사람: ${email || userEmail || "익명"}\n\n내용:\n${message}`,
        };

        await transporter.sendMail(mailOptions);

        return NextResponse.json({ success: true, message: "피드백이 성공적으로 전송되었습니다." });
    } catch (error: any) {
        console.error("이메일 전송 실패:", error);
        return NextResponse.json({ error: "이메일 전송에 실패했습니다." }, { status: 500 });
    }
}
