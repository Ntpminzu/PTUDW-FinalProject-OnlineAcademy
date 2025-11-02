import { Resend } from 'resend';
import dotenv from 'dotenv';

dotenv.config();

const resend = new Resend(process.env.RESEND_API_KEY);

export async function sendOTP(to, otp) {
  try {
    console.log('🔹 Đang gửi OTP tới:', to);

    const response = await resend.emails.send({
      from: 'Online Academy <onboarding@resend.dev>',
      to,
      subject: 'Online Academy - Mã OTP của bạn',
      html: `
        <div style="font-family: Arial, sans-serif; color: #333;">
          <h2>🔐 Mã OTP của bạn</h2>
          <p>Xin chào,</p>
          <p>Mã OTP của bạn là:</p>
          <h1 style="color:#007bff;">${otp}</h1>
          <p>Mã này có hiệu lực trong <b>5 phút</b>.</p>
          <hr />
          <p style="font-size: 0.9em;">Online Academy Support Team</p>
        </div>
      `,
    });

    console.log('✅ Email OTP gửi thành công:', response.id || '(no id)');
  } catch (error) {
    console.error('❌ Lỗi gửi email OTP:', error);
  }
}
