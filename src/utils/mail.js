import nodemailer from 'nodemailer';

export async function sendOTP(to, otp) {
  const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: 'daiduong2929@gmail.com', 
      pass: 'jrfvtpxrvkjbeumx'        
    }
  });

  const mailOptions = {
    from: 'daiduong2929@gmail.com',   
    to,
    subject: 'Online Academy - Your OTP Code',
    text: `Your OTP code is: ${otp}\nThis code expires in 5 minutes.`
  };

  console.log('🔹 Sending OTP to:', to);
  await transporter.sendMail(mailOptions);
  console.log('✅ OTP email sent successfully!');
}
