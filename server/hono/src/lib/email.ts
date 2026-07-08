import nodemailer from "nodemailer";

const SMTP_EMAIL = process.env.SMTP_EMAIL!;
const SMTP_PASSWORD = process.env.SMTP_APP_PASSWORD!;
const SMTP_NAME = process.env.SMTP_NAME || "THUNDER Stack";

let transporter: any = null;

const getTransporter = () => {
  if (!transporter) {
    transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: SMTP_EMAIL,
        pass: SMTP_PASSWORD,
      },
    });
  }
  return transporter;
};

export const sendEmail = async (to: string, subject: string, html: string) => {
  const recipient = to.toLowerCase().trim();
  
  try {
    const info = await getTransporter().sendMail({
      from: `"${SMTP_NAME}" <${SMTP_EMAIL}>`,
      to: recipient,
      subject,
      html,
    });
    console.log(`Email sent to ${recipient}: ${info.messageId}`);
    return info;
  } catch (error) {
    console.error("Error sending email:", error);
    throw error;
  }
};

export const sendOTP = async (email: string, otp: string) => {
  const html = `
    <div style="font-family: sans-serif; padding: 20px; border: 1px solid #eee; border-radius: 12px; max-width: 500px; margin: auto; background-color: #ffffff; color: #1e293b;">
      <h2 style="color: #2563eb; text-align: center; font-size: 24px; font-weight: bold; margin-bottom: 24px;">THUNDER Stack Security</h2>
      <p style="font-size: 16px; line-height: 1.5; color: #334155;">Hello,</p>
      <p style="font-size: 16px; line-height: 1.5; color: #334155;">You requested a verification code (OTP) to reset your password or sign in. Please use the following code:</p>
      <div style="background: #f1f5f9; padding: 16px; text-align: center; font-size: 32px; font-weight: 800; letter-spacing: 6px; border-radius: 8px; margin: 24px 0; color: #1e3a8a; border: 1px solid #e2e8f0;">
        ${otp}
      </div>
      <p style="color: #64748b; font-size: 14px; line-height: 1.5;">This code will expire in 10 minutes. If you did not request this code, you can safely ignore this email.</p>
      <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 24px 0;">
      <p style="text-align: center; color: #94a3b8; font-size: 12px;">© 2026 THUNDER Stack. All rights reserved.</p>
    </div>
  `;
  await sendEmail(email, "Your Verification OTP Code", html);
};
