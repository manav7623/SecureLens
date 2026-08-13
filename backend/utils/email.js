const nodemailer = require('nodemailer');

const sendResetPasswordOTPEmail = async (toEmail, otp) => {
  const resetUrl = `${process.env.CLIENT_URL || 'http://localhost:3000'}/auth/reset-password?email=${encodeURIComponent(toEmail)}`;
  const senderEmail = process.env.EMAIL_USER;
  const senderPass = process.env.EMAIL_PASS ? process.env.EMAIL_PASS.replace(/\s+/g, '') : '';

  // Fallback if not configured or using placeholders
  if (!senderEmail || !senderPass || senderEmail.includes('your_gmail_address') || senderPass.includes('your_gmail_app_password')) {
    console.log(`[Email Mock Service] Password reset requested for: ${toEmail}`);
    console.log(`[Email Mock Service] OTP Generated: ${otp}`);
    console.log(`[Email Mock Service] Reset URL: ${resetUrl}`);
    return { mock: true, resetUrl, otp };
  }

  const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: senderEmail,
      pass: senderPass
    }
  });

  const mailOptions = {
    from: process.env.EMAIL_FROM || senderEmail,
    to: toEmail,
    subject: 'Password Reset OTP - CreatorLens',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 8px;">
        <h2 style="color: #4F63FF; text-align: center;">CreatorLens Password Reset</h2>
        <p>Hello,</p>
        <p>You requested a password reset for your CreatorLens account. Please use the following 6-digit One-Time Password (OTP) to reset your password. This OTP is valid for 10 minutes.</p>
        <div style="text-align: center; margin: 30px 0; font-size: 32px; font-weight: bold; letter-spacing: 6px; color: #4F63FF;">
          ${otp}
        </div>
        <p>You can enter this OTP on the password reset page. Click the button below to go to the reset page:</p>
        <div style="text-align: center; margin: 25px 0;">
          <a href="${resetUrl}" style="background-color: #4F63FF; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block;">Reset Password Page</a>
        </div>
        <p>If the button doesn't work, you can also copy and paste the following link into your browser:</p>
        <p style="word-break: break-all; color: #555;">${resetUrl}</p>
        <hr style="border: 0; border-top: 1px solid #e0e0e0; margin: 20px 0;" />
        <p style="font-size: 12px; color: #888; text-align: center;">If you did not request this, you can safely ignore this email.</p>
      </div>
    `
  };

  await transporter.sendMail(mailOptions);
  return { success: true };
};

module.exports = { sendResetPasswordOTPEmail };
