import { Resend } from 'resend';

const resend = new Resend('re_your_api_key_here');//nào chạy Project nhớ quăng API Key vào

export async function sendOTP(to, otp) {
  try {
    console.log('🔹 Sending OTP to:', to);

    await resend.emails.send({
      from: 'Online Academy <no-reply@resend.dev>',
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
      `
    });

    console.log('✅ OTP email sent successfully!');
  } catch (error) {
    console.error('❌ Lỗi gửi mail:', error);
  }
}
