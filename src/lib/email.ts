// src/lib/email.ts
import nodemailer from "nodemailer";

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.GMAIL_USER,
    pass: process.env.GMAIL_APP_PASSWORD,
  },
});

export async function sendVerificationEmail(
  to: string,
  displayName: string,
  verifyUrl: string,
): Promise<void> {
  await transporter.sendMail({
    from: `"CBT Simulator" <${process.env.GMAIL_USER}>`,
    to,
    subject: "Verify your CBT Simulator account",
    html: `
      <div style="font-family:Arial,sans-serif;max-width:480px;margin:0 auto;padding:32px 24px">
        <h2 style="color:#212529;font-size:20px;margin-bottom:8px">Verify your email</h2>
        <p style="color:#495057;font-size:15px;line-height:1.6">Welcome, ${displayName}! Click below to activate your account.</p>
        <div style="margin:32px 0">
          <a href="${verifyUrl}" style="background:#1A73E8;color:white;padding:12px 28px;border-radius:6px;text-decoration:none;font-size:15px;font-weight:600;display:inline-block">
            Verify Email
          </a>
        </div>
        <p style="color:#6C757D;font-size:13px">This link expires in 24 hours.</p>
      </div>
    `,
  });
}

export async function sendPasswordResetEmail(
  to: string,
  displayName: string,
  resetUrl: string,
): Promise<void> {
  await transporter.sendMail({
    from: `"CBT Simulator" <${process.env.GMAIL_USER}>`,
    to,
    subject: "Reset your CBT Simulator password",
    html: `
      <div style="font-family:Arial,sans-serif;max-width:480px;margin:0 auto;padding:32px 24px">
        <h2 style="color:#212529;font-size:20px;margin-bottom:8px">Reset your password</h2>
        <p style="color:#495057;font-size:15px;line-height:1.6">Hi ${displayName}, click below to reset your password.</p>
        <div style="margin:32px 0">
          <a href="${resetUrl}" style="background:#1A73E8;color:white;padding:12px 28px;border-radius:6px;text-decoration:none;font-size:15px;font-weight:600;display:inline-block">
            Reset Password
          </a>
        </div>
        <p style="color:#6C757D;font-size:13px">This link expires in 1 hour. If you did not request this, ignore this email.</p>
      </div>
    `,
  });
}
