import 'dotenv/config';
import nodemailer from 'nodemailer';

const host = process.env.SMTP_HOST || 'smtp.gmail.com';
const port = Number(process.env.SMTP_PORT) || 587;
const secure = process.env.SMTP_SECURE === 'true' || port === 465;
const user = process.env.SMTP_USER || 'nahian@riseuplabs.com';
const pass = (process.env.SMTP_PASS || '').replace(/\s+/g, '');
const defaultFrom = process.env.SMTP_FROM || `"Riseup Labs Tools & Services" <${user}>`;

export function getTransporter() {
  if (!user || !pass) {
    return null;
  }
  return nodemailer.createTransport({
    host,
    port,
    secure,
    auth: {
      user,
      pass,
    },
    tls: {
      rejectUnauthorized: false,
    },
  });
}

export async function sendMail(options: {
  to: string;
  subject: string;
  html: string;
  text?: string;
  from?: string;
}): Promise<{ success: boolean; messageId?: string; error?: string }> {
  const transporter = getTransporter();
  if (!transporter) {
    console.warn('[Mailer] SMTP credentials not configured. Email logged but not dispatched via network.');
    return { success: false, error: 'SMTP credentials not configured.' };
  }

  try {
    const info = await transporter.sendMail({
      from: options.from || defaultFrom,
      to: options.to,
      subject: options.subject,
      html: options.html,
      text: options.text || options.subject,
    });
    console.log(`[Mailer] Successfully dispatched email to ${options.to}. MessageId: ${info.messageId}`);
    return { success: true, messageId: info.messageId };
  } catch (err: any) {
    console.error(`[Mailer] Failed to send email to ${options.to}:`, err.message);
    return { success: false, error: err.message };
  }
}

export async function sendInvitationEmail(params: {
  recipientEmail: string;
  recipientName: string;
  inviterName: string;
  activationToken?: string;
  appUrl?: string;
}): Promise<{ success: boolean; messageId?: string; error?: string }> {
  const baseUrl = params.appUrl || process.env.APP_URL || 'https://rltsms.nahian-d21.workers.dev';
  const token = params.activationToken || `act_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
  const activationUrl = `${baseUrl.replace(/\/$/, '')}/activate?token=${encodeURIComponent(token)}`;

  const subject = `Welcome to RLTSMS – Activate your Riseup Labs account`;
  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Welcome to RLTSMS</title>
</head>
<body style="margin: 0; padding: 24px; background-color: #f8fafc; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;">
  <table role="presentation" width="100%" border="0" cellspacing="0" cellpadding="0">
    <tr>
      <td align="center">
        <table role="presentation" width="600" border="0" cellspacing="0" cellpadding="0" style="max-width: 600px; width: 100%; background-color: #ffffff; border-radius: 12px; border: 1px solid #e2e8f0; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05);">
          <!-- Header -->
          <tr>
            <td style="background-color: #211E1F; padding: 28px 32px; text-align: center;">
              <h1 style="color: #ffffff; margin: 0; font-size: 22px; font-weight: 700; letter-spacing: -0.5px;">
                Riseup Labs Tools &amp; Services
              </h1>
              <p style="color: #EA5400; margin: 6px 0 0 0; font-size: 13px; font-weight: 600; letter-spacing: 0.5px; text-transform: uppercase;">
                Track Every Tool. Control Every Lifecycle.
              </p>
            </td>
          </tr>
          <!-- Body -->
          <tr>
            <td style="padding: 36px 32px; color: #1e293b;">
              <h2 style="margin-top: 0; font-size: 18px; font-weight: 700; color: #0f172a;">
                Welcome to RLTSMS Workspace
              </h2>
              <p style="font-size: 14px; line-height: 1.6; color: #334155;">
                Hello <strong>${params.recipientName}</strong>,
              </p>
              <p style="font-size: 14px; line-height: 1.6; color: #334155;">
                You have been invited by <strong>${params.inviterName}</strong> to join the <strong>Riseup Labs Tools &amp; Services Management System (RLTSMS)</strong>. RLTSMS provides centralized governance, license allocation, and access to approved enterprise tools and cloud services.
              </p>
              <div style="background-color: #f1f5f9; border-left: 4px solid #EA5400; padding: 14px 18px; margin: 24px 0; border-radius: 4px;">
                <p style="margin: 0; font-size: 13px; color: #475569; line-height: 1.5;">
                  <strong>Important:</strong> This single-use activation invitation is valid for <strong>48 hours</strong>. Please activate your account promptly to access company subscriptions and resources.
                </p>
              </div>
              <div style="text-align: center; margin: 32px 0;">
                <a href="${activationUrl}" style="display: inline-block; background-color: #EA5400; color: #ffffff; text-decoration: none; font-size: 14px; font-weight: 700; padding: 14px 36px; border-radius: 8px; box-shadow: 0 4px 6px rgba(234, 84, 0, 0.25);">
                  Activate Your Account &rarr;
                </a>
              </div>
              <p style="font-size: 12px; line-height: 1.5; color: #64748b; margin-top: 24px;">
                If the button above does not work, copy and paste this link into your browser:<br>
                <a href="${activationUrl}" style="color: #EA5400; word-break: break-all;">${activationUrl}</a>
              </p>
            </td>
          </tr>
          <!-- Footer -->
          <tr>
            <td style="background-color: #f8fafc; padding: 20px 32px; text-align: center; border-top: 1px solid #e2e8f0; font-size: 11px; color: #94a3b8;">
              &copy; 2026 Riseup Labs. All rights reserved. &bull; Enterprise Digital Asset Governance<br>
              Zero-Credential Transmission Policy Active &bull; Confidential
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `;

  return sendMail({
    to: params.recipientEmail,
    subject,
    html,
  });
}

export async function sendPasswordResetEmail(params: {
  recipientEmail: string;
  recipientName: string;
  resetToken: string;
  otpCode: string;
  appUrl?: string;
}): Promise<{ success: boolean; messageId?: string; error?: string }> {
  const baseUrl = params.appUrl || process.env.APP_URL || 'https://rltsms.nahian-d21.workers.dev';
  const resetUrl = `${baseUrl.replace(/\/$/, '')}/reset-password?token=${encodeURIComponent(params.resetToken)}`;
  const subject = `[RLTSMS Security] Reset your Riseup Labs account password`;

  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Reset your RLTSMS Password</title>
</head>
<body style="margin: 0; padding: 24px; background-color: #f8fafc; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;">
  <table role="presentation" width="100%" border="0" cellspacing="0" cellpadding="0">
    <tr>
      <td align="center">
        <table role="presentation" width="600" border="0" cellspacing="0" cellpadding="0" style="max-width: 600px; width: 100%; background-color: #ffffff; border-radius: 12px; border: 1px solid #e2e8f0; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05);">
          <!-- Header -->
          <tr>
            <td style="background-color: #211E1F; padding: 28px 32px; text-align: center;">
              <h1 style="color: #ffffff; margin: 0; font-size: 22px; font-weight: 700; letter-spacing: -0.5px;">
                Riseup Labs Tools &amp; Services
              </h1>
              <p style="color: #EA5400; margin: 6px 0 0 0; font-size: 13px; font-weight: 600; letter-spacing: 0.5px; text-transform: uppercase;">
                Account Security &bull; Password Recovery
              </p>
            </td>
          </tr>
          <!-- Body -->
          <tr>
            <td style="padding: 36px 32px; color: #1e293b;">
              <h2 style="margin-top: 0; font-size: 18px; font-weight: 700; color: #0f172a;">
                Password Reset Request
              </h2>
              <p style="font-size: 14px; line-height: 1.6; color: #334155;">
                Hello <strong>${params.recipientName}</strong>,
              </p>
              <p style="font-size: 14px; line-height: 1.6; color: #334155;">
                We received a request to reset your password for your <strong>Riseup Labs Tools &amp; Services Management System (RLTSMS)</strong> account.
              </p>

              <!-- 6-digit OTP Box -->
              <div style="background-color: #FFF1EB; border: 1px solid #FFD8C7; border-radius: 8px; padding: 20px; text-align: center; margin: 24px 0;">
                <span style="font-size: 12px; font-weight: 600; color: #EA5400; text-transform: uppercase; letter-spacing: 1px; display: block; margin-bottom: 8px;">
                  Your 6-Digit Verification Code (OTP)
                </span>
                <span style="font-size: 32px; font-family: monospace; font-weight: 800; letter-spacing: 6px; color: #211E1F; display: inline-block;">
                  ${params.otpCode}
                </span>
                <span style="display: block; font-size: 11px; color: #64748b; margin-top: 8px;">
                  Valid for <strong>10 minutes</strong> only. Single-use security code.
                </span>
              </div>

              <!-- Direct Reset Button -->
              <div style="text-align: center; margin: 28px 0;">
                <a href="${resetUrl}" style="display: inline-block; background-color: #EA5400; color: #ffffff; text-decoration: none; font-size: 14px; font-weight: 700; padding: 14px 36px; border-radius: 8px; box-shadow: 0 4px 6px rgba(234, 84, 0, 0.25);">
                  Reset Your Password Directly &rarr;
                </a>
              </div>

              <div style="background-color: #f8fafc; border-left: 4px solid #64748b; padding: 12px 16px; margin: 20px 0; border-radius: 4px;">
                <p style="margin: 0; font-size: 12px; color: #475569; line-height: 1.5;">
                  <strong>Security Expiration:</strong> Both this OTP and the password reset link will expire in <strong>10 minutes</strong>. Once used, the link and OTP will be permanently invalidated. If you did not request a password reset, you can safely ignore this email.
                </p>
              </div>

              <p style="font-size: 12px; line-height: 1.5; color: #64748b; margin-top: 24px;">
                Direct link:<br>
                <a href="${resetUrl}" style="color: #EA5400; word-break: break-all;">${resetUrl}</a>
              </p>
            </td>
          </tr>
          <!-- Footer -->
          <tr>
            <td style="background-color: #f8fafc; padding: 20px 32px; text-align: center; border-top: 1px solid #e2e8f0; font-size: 11px; color: #94a3b8;">
              &copy; 2026 Riseup Labs. All rights reserved. &bull; Enterprise Digital Asset Governance<br>
              Zero-Credential Transmission Policy Active &bull; Confidential
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `;

  return sendMail({
    to: params.recipientEmail,
    subject,
    html,
  });
}

