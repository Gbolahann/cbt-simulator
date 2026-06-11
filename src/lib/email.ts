// src/lib/email.ts
// Sends transactional emails via Gmail SMTP using Nodemailer.
// No custom domain required. Works with any recipient email address.
// Free tier: 500 emails per day.

import nodemailer from "nodemailer";

// Build the transporter once — reused for every email sent
const transporter = nodemailer.createTransport({
  host:   process.env.EMAIL_SERVER_HOST   ?? "smtp.gmail.com",
  port:   parseInt(process.env.EMAIL_SERVER_PORT ?? "587"),
  secure: false,  // false = STARTTLS on port 587 (recommended for Gmail)
  auth: {
    user: process.env.EMAIL_SERVER_USER,
    pass: process.env.EMAIL_SERVER_PASSWORD,  // App Password, not Gmail password
  },
});

const FROM_ADDRESS = process.env.EMAIL_FROM ?? "CBT Simulator <cbt.simulator.bot@gmail.com>";

interface EmailOptions {
  to:      string;
  subject: string;
  html:    string;
}

async function sendEmail({ to, subject, html }: EmailOptions): Promise<void> {
  if (!process.env.EMAIL_SERVER_USER || !process.env.EMAIL_SERVER_PASSWORD) {
    console.warn("[email] Gmail credentials not set — skipping send");
    console.log(`[email] Would send to: ${to} | Subject: ${subject}`);
    return;
  }

  await transporter.sendMail({
    from:    FROM_ADDRESS,
    to,
    subject,
    html,
  });
}

// ── Email templates ────────────────────────────────────────────

export async function sendVerificationEmail(
  to: string,
  displayName: string,
  verifyUrl: string,
): Promise<void> {
  await sendEmail({
    to,
    subject: "Verify your CBT Simulator account",
    html: `
      <div style="font-family:Arial,sans-serif;max-width:480px;margin:0 auto;padding:32px 24px">
        <h2 style="color:#212529;font-size:20px;margin-bottom:8px">Verify your email</h2>
        <p style="color:#495057;font-size:15px;line-height:1.6">
          Welcome, ${displayName}! Click the button below to activate your CBT Simulator account.
        </p>
        <div style="margin:32px 0">
          <a href="${verifyUrl}"
             style="background:#1A73E8;color:white;padding:12px 28px;border-radius:6px;
                    text-decoration:none;font-size:15px;font-weight:600;display:inline-block">
            Verify Email
          </a>
        </div>
        <p style="color:#6C757D;font-size:13px">
          This link expires in 24 hours. If you did not create an account, ignore this email.
        </p>
        <hr style="border:none;border-top:1px solid #DEE2E6;margin:24px 0" />
        <p style="color:#ADB5BD;font-size:12px">CBT Simulator — OOU Practice Platform</p>
      </div>
    `,
  });
}

export async function sendPasswordResetEmail(
  to: string,
  displayName: string,
  resetUrl: string,
): Promise<void> {
  await sendEmail({
    to,
    subject: "Reset your CBT Simulator password",
    html: `
      <div style="font-family:Arial,sans-serif;max-width:480px;margin:0 auto;padding:32px 24px">
        <h2 style="color:#212529;font-size:20px;margin-bottom:8px">Reset your password</h2>
        <p style="color:#495057;font-size:15px;line-height:1.6">
          Hi ${displayName}, click below to choose a new password.
        </p>
        <div style="margin:32px 0">
          <a href="${resetUrl}"
             style="background:#1A73E8;color:white;padding:12px 28px;border-radius:6px;
                    text-decoration:none;font-size:15px;font-weight:600;display:inline-block">
            Reset Password
          </a>
        </div>
        <p style="color:#6C757D;font-size:13px">
          This link expires in 1 hour. If you did not request this, ignore this email.
        </p>
        <hr style="border:none;border-top:1px solid #DEE2E6;margin:24px 0" />
        <p style="color:#ADB5BD;font-size:12px">CBT Simulator — OOU Practice Platform</p>
      </div>
    `,
  });
}