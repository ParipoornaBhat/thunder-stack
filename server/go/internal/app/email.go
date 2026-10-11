package app

import (
	"fmt"
	"net/smtp"
	"strings"

	"thunder.dev/server/internal/config"
)

func sendOTP(cfg config.Config, email, otp string) error {
	html := fmt.Sprintf(`
    <div style="font-family: sans-serif; padding: 20px; border: 1px solid #eee; border-radius: 12px; max-width: 500px; margin: auto; background-color: #ffffff; color: #1e293b;">
      <h2 style="color: #2563eb; text-align: center; font-size: 24px; font-weight: bold; margin-bottom: 24px;">THUNDER Stack Security</h2>
      <p style="font-size: 16px; line-height: 1.5; color: #334155;">Hello,</p>
      <p style="font-size: 16px; line-height: 1.5; color: #334155;">You requested a verification code (OTP) to reset your password or sign in. Please use the following code:</p>
      <div style="background: #f1f5f9; padding: 16px; text-align: center; font-size: 32px; font-weight: 800; letter-spacing: 6px; border-radius: 8px; margin: 24px 0; color: #1e3a8a; border: 1px solid #e2e8f0;">
        %s
      </div>
      <p style="color: #64748b; font-size: 14px; line-height: 1.5;">This code will expire in 10 minutes. If you did not request this code, you can safely ignore this email.</p>
      <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 24px 0;">
      <p style="text-align: center; color: #94a3b8; font-size: 12px;">© 2026 THUNDER Stack. All rights reserved.</p>
    </div>
  `, otp)
	return sendEmail(cfg, email, "Your Verification OTP Code", html)
}

func sendEmail(cfg config.Config, to, subject, html string) error {
	if cfg.SMTPEmail == "" || cfg.SMTPPassword == "" {
		return fmt.Errorf("SMTP is not configured")
	}
	recipient := strings.ToLower(strings.TrimSpace(to))
	msg := strings.Join([]string{
		fmt.Sprintf("From: %q <%s>", cfg.SMTPName, cfg.SMTPEmail),
		"To: " + recipient,
		"Subject: " + subject,
		"MIME-Version: 1.0",
		"Content-Type: text/html; charset=UTF-8",
		"",
		html,
	}, "\r\n")
	auth := smtp.PlainAuth("", cfg.SMTPEmail, cfg.SMTPPassword, "smtp.gmail.com")
	return smtp.SendMail("smtp.gmail.com:587", auth, cfg.SMTPEmail, []string{recipient}, []byte(msg))
}
