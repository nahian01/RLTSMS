import { Router, Request, Response } from 'express';
import { dbStore } from '../data/store';
import { EmailTemplate, EmailDeliveryLog } from '../../src/types';

export const emailRouter = Router();

// GET /api/email/templates - List all email templates
emailRouter.get('/templates', (req: Request, res: Response) => {
  const state = dbStore.getState();
  return res.json(state.emailTemplates);
});

// PUT /api/email/templates/:id - Update an email template
emailRouter.put('/templates/:id', (req: Request, res: Response) => {
  const currentUserId = (req.headers['x-user-id'] as string) || 'usr-admin';
  const templateId = req.params.id;
  const { subject, bodyHtml, isEnabled } = req.body;

  const state = dbStore.getState();
  const template = state.emailTemplates.find((t) => t.id === templateId);
  const currentUser = state.users.find((u) => u.id === currentUserId);

  if (!template) {
    return res.status(404).json({ error: 'Email template not found.' });
  }

  dbStore.mutate((s) => {
    const target = s.emailTemplates.find((t) => t.id === templateId)!;
    if (subject !== undefined) target.subject = subject.trim();
    if (bodyHtml !== undefined) target.bodyHtml = bodyHtml;
    if (isEnabled !== undefined) target.isEnabled = Boolean(isEnabled);
    target.updatedAt = new Date().toISOString();

    s.auditLogs.unshift({
      id: `aud-${Date.now()}`,
      timestamp: new Date().toISOString(),
      userId: currentUserId,
      userName: currentUser ? currentUser.name : 'System User',
      action: 'Update Email Template',
      entity: 'Email Templates',
      entityId: target.id,
      details: `Updated template ${target.name} (${target.key}).`,
    });
  });

  return res.json({ success: true, message: 'Template updated successfully.' });
});

// POST /api/email/preview - Render template with sample variables
emailRouter.post('/preview', (req: Request, res: Response) => {
  const { templateId, variables } = req.body;
  const state = dbStore.getState();
  const template = state.emailTemplates.find((t) => t.id === templateId);

  if (!template) {
    return res.status(404).json({ error: 'Template not found.' });
  }

  const sampleVars: Record<string, string> = {
    '{{recipient_name}}': 'Sarah Lin',
    '{{application_name}}': 'RLTSMS',
    '{{company_name}}': 'Riseup Labs',
    '{{activation_url}}': 'https://rltsms.riseuplabs.com/activate?token=demo_sample_token',
    '{{otp_code}}': '849201',
    '{{expiry_time}}': '15 minutes',
    '{{service_name}}': 'ChatGPT Plus Enterprise',
    '{{access_expiry_date}}': '2026-12-31',
    '{{requisition_number}}': 'REQ-2026-081',
    '{{notification_message}}': 'Your request has been approved by the department lead.',
    '{{support_email}}': 'security@riseuplabs.com',
    '{{inviter_name}}': 'Abdullah Nahian',
    '{{reset_url}}': 'https://rltsms.riseuplabs.com/reset-password?token=demo_reset_token',
    '{{access_status}}': 'Authorized',
    '{{granted_by}}': 'Abdullah Nahian (Admin)',
    '{{requisition_status}}': 'Approved',
    '{{amount}}': '$30.00 USD',
    '{{actor_name}}': 'Tariq Ahmed',
    '{{application_url}}': 'https://rltsms.riseuplabs.com/requisitions',
    '{{renewal_date}}': '2026-11-20',
    '{{days_remaining}}': '7',
    '{{renewal_amount}}': '$1450.00 USD',
    '{{billing_cycle}}': 'Monthly',
    '{{event_title}}': 'Card Details Revealed',
    '{{target_name}}': 'AWS Primary Visa (•••• 8492)',
    '{{timestamp}}': new Date().toLocaleString(),
    ...(variables || {}),
  };

  let renderedSubject = template.subject;
  let renderedBody = template.bodyHtml;

  for (const [key, val] of Object.entries(sampleVars)) {
    renderedSubject = renderedSubject.split(key).join(val);
    renderedBody = renderedBody.split(key).join(val);
  }

  return res.json({
    subject: renderedSubject,
    bodyHtml: renderedBody,
    variablesUsed: sampleVars,
  });
});

// POST /api/email/test-send - Send test email & log to delivery ledger
emailRouter.post('/test-send', (req: Request, res: Response) => {
  const currentUserId = (req.headers['x-user-id'] as string) || 'usr-admin';
  const { templateId, recipientEmail } = req.body;

  if (!recipientEmail || !templateId) {
    return res.status(400).json({ error: 'templateId and recipientEmail are required.' });
  }

  const state = dbStore.getState();
  const template = state.emailTemplates.find((t) => t.id === templateId);

  if (!template) {
    return res.status(404).json({ error: 'Template not found.' });
  }

  const newLog: EmailDeliveryLog = {
    id: `elog-${Date.now()}`,
    templateKey: template.key,
    templateName: template.name,
    recipientEmail: recipientEmail.trim(),
    recipientName: recipientEmail.split('@')[0],
    subject: `[TEST] ${template.subject.replace(/\{\{[^}]+\}\}/g, 'SAMPLE')}`,
    status: 'Sent',
    attemptCount: 1,
    providerMessageId: `msg_test_${Date.now()}`,
    dispatchedAt: new Date().toISOString(),
  };

  dbStore.mutate((s) => {
    s.emailLogs.unshift(newLog);
  });

  return res.json({
    success: true,
    message: `Test email successfully dispatched to ${recipientEmail}.`,
    deliveryLog: newLog,
  });
});

// GET /api/email/logs - Delivery audit logs
emailRouter.get('/logs', (req: Request, res: Response) => {
  const state = dbStore.getState();
  return res.json(state.emailLogs);
});
