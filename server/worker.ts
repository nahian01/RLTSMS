import { connect } from 'cloudflare:sockets';

export interface Env {
  ASSETS: {
    fetch: (request: Request) => Promise<Response>;
  };
  SMTP_USER?: string;
  SMTP_PASS?: string;
}

const DEFAULT_SMTP_USER = 'nahian@riseuplabs.com';
const DEFAULT_SMTP_PASS = 'xqpixcezvjajfaea';

// Native Cloudflare Workers SMTP Mailer using cloudflare:sockets
export async function sendSmtpEmail({
  to,
  subject,
  html,
  smtpUser = DEFAULT_SMTP_USER,
  smtpPass = DEFAULT_SMTP_PASS,
}: {
  to: string;
  subject: string;
  html: string;
  smtpUser?: string;
  smtpPass?: string;
}): Promise<{ success: boolean; messageId: string }> {
  const cleanPass = smtpPass.replace(/\s+/g, '');
  
  // Gmail SMTPS on port 465 with SSL/TLS from the initial connection
  const socket = connect(
    { hostname: 'smtp.gmail.com', port: 465 },
    { secureTransport: 'on' }
  );

  const reader = socket.readable.getReader();
  const writer = socket.writable.getWriter();
  const encoder = new TextEncoder();
  const decoder = new TextDecoder();

  async function readUntilCode(expectedCode: string): Promise<string> {
    let accumulated = '';
    while (true) {
      const { value, done } = await reader.read();
      if (done) break;
      accumulated += decoder.decode(value, { stream: true });
      const lines = accumulated.split('\r\n');
      for (const line of lines) {
        if (line.startsWith(expectedCode + ' ') || line === expectedCode) {
          return accumulated;
        }
      }
    }
    return accumulated;
  }

  async function writeCommand(cmd: string) {
    await writer.write(encoder.encode(cmd + '\r\n'));
  }

  try {
    // 1. Initial Greeting (220)
    await readUntilCode('220');

    // 2. EHLO
    await writeCommand('EHLO rltsms.riseuplabs.com');
    await readUntilCode('250');

    // 3. AUTH LOGIN
    await writeCommand('AUTH LOGIN');
    await readUntilCode('334');

    // 4. Base64 Username
    await writeCommand(btoa(smtpUser));
    await readUntilCode('334');

    // 5. Base64 Password
    await writeCommand(btoa(cleanPass));
    const authRes = await readUntilCode('235');
    if (!authRes.includes('235')) {
      throw new Error(`SMTP Auth failed: ${authRes}`);
    }

    // 6. MAIL FROM
    await writeCommand(`MAIL FROM:<${smtpUser}>`);
    await readUntilCode('250');

    // 7. RCPT TO
    await writeCommand(`RCPT TO:<${to}>`);
    await readUntilCode('250');

    // 8. DATA
    await writeCommand('DATA');
    await readUntilCode('354');

    // 9. Email Body
    const messageId = `<${Date.now()}.${Math.random().toString(36).substring(2)}@riseuplabs.com>`;
    const dateStr = new Date().toUTCString();
    const rawEmail = [
      `From: "Riseup Labs Tools & Services" <${smtpUser}>`,
      `To: <${to}>`,
      `Subject: ${subject}`,
      `Date: ${dateStr}`,
      `Message-ID: ${messageId}`,
      `MIME-Version: 1.0`,
      `Content-Type: text/html; charset=UTF-8`,
      `Content-Transfer-Encoding: 7bit`,
      ``,
      html,
      `.`,
    ].join('\r\n');

    await writeCommand(rawEmail);
    await readUntilCode('250');

    // 10. QUIT
    await writeCommand('QUIT');

    return { success: true, messageId };
  } finally {
    try {
      reader.releaseLock();
      writer.releaseLock();
      await socket.close();
    } catch {
      // Safe cleanup
    }
  }
}

export function buildInvitationHtml(params: {
  recipientName: string;
  inviterName: string;
  activationUrl: string;
}): string {
  return `<!DOCTYPE html>
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
                <a href="${params.activationUrl}" style="display: inline-block; background-color: #EA5400; color: #ffffff; text-decoration: none; font-size: 14px; font-weight: 700; padding: 14px 36px; border-radius: 8px; box-shadow: 0 4px 6px rgba(234, 84, 0, 0.25);">
                  Activate Your Account &rarr;
                </a>
              </div>
              <p style="font-size: 12px; line-height: 1.5; color: #64748b; margin-top: 24px;">
                If the button above does not work, copy and paste this link into your browser:<br>
                <a href="${params.activationUrl}" style="color: #EA5400; word-break: break-all;">${params.activationUrl}</a>
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
</html>`;
}

function jsonResponse(data: any, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization, x-user-id',
    },
  });
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);

    // Handle CORS preflight
    if (request.method === 'OPTIONS') {
      return new Response(null, {
        status: 204,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type, Authorization, x-user-id',
        },
      });
    }

    // Health Check Endpoint
    if (url.pathname === '/api/health') {
      return jsonResponse({
        status: 'UP',
        service: 'RLTSMS Cloudflare Worker & SMTP Gateway',
        environment: 'cloudflare-workers',
        timestamp: new Date().toISOString(),
      });
    }

    // Auth Login Endpoint
    if (url.pathname === '/api/auth/login' && request.method === 'POST') {
      try {
        const body = await request.json() as { email?: string; password?: string };
        const email = (body.email || '').trim().toLowerCase();
        const password = body.password || '';

        if (!email || !password) {
          return jsonResponse({ error: 'Email and password are required.' }, 400);
        }

        // Verified standard credentials
        if (password === 'RiseupLabs@2026') {
          return jsonResponse({
            success: true,
            token: `token_cf_${Date.now()}`,
            user: {
              email,
              name: email.split('@')[0],
              roles: ['Super Admin'],
            },
          });
        }

        return jsonResponse({ error: 'Invalid work email or password.' }, 401);
      } catch (err: any) {
        return jsonResponse({ error: err.message || 'Login request error' }, 400);
      }
    }

    // Employee Invite Endpoint with Real SMTP Dispatch
    if (url.pathname === '/api/org/users' && request.method === 'POST') {
      try {
        const body = await request.json() as {
          name: string;
          email: string;
          phone?: string;
          designation?: string;
          departmentId?: string;
          teamId?: string;
          reportingLeadId?: string;
          roles?: string[];
        };

        if (!body.name || !body.email) {
          return jsonResponse({ error: 'Name and email are required.' }, 400);
        }

        const now = new Date();
        const expiry = new Date(now.getTime() + 48 * 60 * 60 * 1000);
        const activationToken = `act_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
        const activationUrl = `${url.origin}/activate?token=${encodeURIComponent(activationToken)}`;

        const newUser = {
          id: `usr-inv-${Date.now()}`,
          name: body.name,
          email: body.email.toLowerCase().trim(),
          phone: body.phone || '+880 1710-000000',
          designation: body.designation || 'Software Engineer',
          departmentId: body.departmentId || 'dept-eng',
          departmentName: 'Engineering & Development',
          teamId: body.teamId,
          teamName: 'Core Platform',
          reportingLeadId: body.reportingLeadId,
          roles: body.roles && body.roles.length > 0 ? body.roles : ['Employee'],
          accountStatus: 'Pending Invitation',
          invitationToken: activationToken,
          invitationSentAt: now.toISOString(),
          invitationExpiresAt: expiry.toISOString(),
          cardPermissionLevel: 'none',
        };

        // Dispatch real email via Gmail SMTP
        let emailDispatched = false;
        let emailError = null;
        try {
          const emailHtml = buildInvitationHtml({
            recipientName: body.name,
            inviterName: request.headers.get('x-user-id') || 'System Administrator',
            activationUrl,
          });

          const result = await sendSmtpEmail({
            to: newUser.email,
            subject: 'Welcome to RLTSMS – Activate your Riseup Labs account',
            html: emailHtml,
            smtpUser: env.SMTP_USER || DEFAULT_SMTP_USER,
            smtpPass: env.SMTP_PASS || DEFAULT_SMTP_PASS,
          });

          emailDispatched = result.success;
        } catch (err: any) {
          console.error('SMTP Dispatch Failed:', err);
          emailError = err.message;
        }

        return jsonResponse(
          {
            ...newUser,
            emailDispatched,
            emailError,
          },
          201
        );
      } catch (err: any) {
        return jsonResponse({ error: err.message || 'Failed to create employee' }, 500);
      }
    }

    // Resend Invitation Endpoint
    const resendMatch = url.pathname.match(/^\/api\/org\/users\/([^/]+)\/resend$/);
    if (resendMatch && request.method === 'POST') {
      try {
        const body = (await request.json().catch(() => ({}))) as { email?: string; name?: string };
        const recipientEmail = body.email || 'employee@riseuplabs.com';
        const recipientName = body.name || 'Team Member';
        const activationToken = `act_resend_${Date.now()}`;
        const activationUrl = `${url.origin}/activate?token=${encodeURIComponent(activationToken)}`;

        const emailHtml = buildInvitationHtml({
          recipientName,
          inviterName: request.headers.get('x-user-id') || 'System Administrator',
          activationUrl,
        });

        const result = await sendSmtpEmail({
          to: recipientEmail,
          subject: 'Welcome to RLTSMS – Activate your Riseup Labs account (Resent)',
          html: emailHtml,
          smtpUser: env.SMTP_USER || DEFAULT_SMTP_USER,
          smtpPass: env.SMTP_PASS || DEFAULT_SMTP_PASS,
        });

        return jsonResponse({
          success: true,
          messageId: result.messageId,
          message: `Activation email resent successfully to ${recipientEmail}`,
        });
      } catch (err: any) {
        return jsonResponse({ error: err.message || 'Failed to resend invitation' }, 500);
      }
    }

    // Direct Test Send Endpoint
    if (url.pathname === '/api/email/test-send' && request.method === 'POST') {
      try {
        const body = await request.json() as { to: string; subject: string; html?: string };
        if (!body.to) {
          return jsonResponse({ error: 'Recipient "to" is required.' }, 400);
        }

        const result = await sendSmtpEmail({
          to: body.to,
          subject: body.subject || 'RLTSMS Cloudflare Worker Test Email',
          html: body.html || '<p>This is a live test email from RLTSMS on Cloudflare Workers.</p>',
          smtpUser: env.SMTP_USER || DEFAULT_SMTP_USER,
          smtpPass: env.SMTP_PASS || DEFAULT_SMTP_PASS,
        });

        return jsonResponse({
          success: true,
          messageId: result.messageId,
          message: `Email dispatched successfully to ${body.to}`,
        });
      } catch (err: any) {
        return jsonResponse({ error: err.message || 'Failed to send test email' }, 500);
      }
    }

    // Fallback: Delegate all static asset and SPA routing to Cloudflare Assets
    return env.ASSETS.fetch(request);
  },
};

