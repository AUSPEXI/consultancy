import { NextRequest, NextResponse } from 'next/server';
import nodemailer from 'nodemailer';

export async function POST(req: NextRequest) {
  try {
    const { name, email, summary } = await req.json();

    if (!name || !summary) {
      return NextResponse.json({ error: 'Name and summary are required' }, { status: 400 });
    }

    const emailUser = process.env.EMAIL_USER;
    const emailPass = process.env.EMAIL_APP_PASSWORD;

    if (emailUser && emailPass) {
      const transporter = nodemailer.createTransport({
        host: 'smtp.gmail.com',
        port: 465,
        secure: true,
        auth: { user: emailUser, pass: emailPass },
      });

      await transporter.sendMail({
        from: `"Auspexi Voice Agent" <${emailUser}>`,
        to: emailUser,
        subject: `New Voice Agent Lead: ${name}`,
        text: `You have a new lead from the Voice Agent!\n\nName: ${name}\nEmail: ${email || 'Not provided'}\n\nConversation Summary:\n${summary}\n\nPlease follow up if required.`,
      });
    } else {
      console.warn('[send-call-log] Email credentials not configured. Lead received but not emailed:', { name, email });
    }

    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error('[send-call-log] Error:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
