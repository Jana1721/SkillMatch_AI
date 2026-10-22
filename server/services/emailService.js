import nodemailer from 'nodemailer';
import crypto from 'crypto';
import { dbRun, dbAll } from '../db/database.js';

// Transporter configuration: uses SMTP env vars if provided, otherwise creates a development fallback
let transporter = null;

async function getTransporter() {
  if (transporter) return transporter;

  if (process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS) {
    transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: parseInt(process.env.SMTP_PORT || '587', 10),
      secure: process.env.SMTP_SECURE === 'true',
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS
      }
    });
    console.log('[Email Service] Configured live SMTP transporter via host:', process.env.SMTP_HOST);
  } else {
    // Development fallback using Ethereal or test stream
    try {
      const testAccount = await nodemailer.createTestAccount();
      transporter = nodemailer.createTransport({
        host: 'smtp.ethereal.email',
        port: 587,
        secure: false,
        auth: {
          user: testAccount.user,
          pass: testAccount.pass
        }
      });
      console.log('[Email Service] Initialized Ethereal test mailer for development:', testAccount.user);
    } catch (err) {
      console.warn('[Email Service] Ethereal init failed, using JSON transport fallback:', err.message);
      transporter = nodemailer.createTransport({
        jsonTransport: true
      });
    }
  }
  return transporter;
}

/**
 * Log email to SQLite user_emails table
 */
async function logEmail({ userId, recipientEmail, subject, bodyHtml, emailType, previewUrl, status = 'sent' }) {
  const id = `email-${crypto.randomUUID().slice(0, 8)}`;
  try {
    await dbRun(
      `INSERT INTO user_emails (id, user_id, recipient_email, subject, body_html, email_type, status, preview_url)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [id, userId || 'unregistered', recipientEmail, subject, bodyHtml, emailType, status, previewUrl || '']
    );
  } catch (err) {
    console.error('[Email Log Error]', err);
  }
  return id;
}

/**
 * 1. Send Account Verification Email
 */
export async function sendVerificationEmail({ userId, name, email, credentialId, token }) {
  const mailer = await getTransporter();
  const verifyUrl = `${process.env.APP_URL || 'http://localhost:5173'}/verify-email?token=${token}&email=${encodeURIComponent(email)}`;

  const subject = `Welcome to SkillMatch AI — Verify Your Account [ID: ${credentialId}]`;
  const bodyHtml = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f8fafc; margin: 0; padding: 24px; color: #1e293b; }
        .card { max-width: 600px; margin: 0 auto; background: #ffffff; border-radius: 16px; border: 1px solid #e2e8f0; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05); }
        .header { background: linear-gradient(135deg, #10b981 0%, #059669 100%); padding: 32px; text-align: center; color: white; }
        .badge { display: inline-block; background: rgba(255,255,255,0.2); padding: 4px 12px; border-radius: 9999px; font-size: 12px; font-weight: 600; letter-spacing: 0.05em; margin-bottom: 8px; }
        .content { padding: 32px; }
        .id-box { background: #f0fdf4; border: 1.5px dashed #86efac; border-radius: 12px; padding: 16px; margin: 20px 0; text-align: center; }
        .id-code { font-family: monospace; font-size: 22px; font-weight: 700; color: #15803d; letter-spacing: 2px; }
        .btn { display: inline-block; background: #10b981; color: #ffffff !important; text-decoration: none; padding: 14px 28px; border-radius: 10px; font-weight: 600; font-size: 15px; margin: 20px 0; }
        .footer { background: #f8fafc; padding: 20px 32px; font-size: 12px; color: #64748b; border-top: 1px solid #e2e8f0; text-align: center; }
      </style>
    </head>
    <body>
      <div class="card">
        <div class="header">
          <div class="badge">CAREER READINESS PLATFORM</div>
          <h1 style="margin: 0; font-size: 24px; font-weight: 800;">SkillMatch AI</h1>
          <p style="margin: 8px 0 0 0; opacity: 0.9; font-size: 14px;">Intelligent Career Readiness & Interview Evaluation</p>
        </div>
        <div class="content">
          <h2 style="font-size: 18px; margin-top: 0;">Welcome, ${name}!</h2>
          <p>Thank you for registering with SkillMatch AI. Your personal candidate profile is ready. Here is your permanent, unique credential ID:</p>
          
          <div class="id-box">
            <div style="font-size: 11px; color: #166534; font-weight: 600; text-transform: uppercase;">Your Permanent Credential ID</div>
            <div class="id-code">${credentialId}</div>
            <div style="font-size: 12px; color: #15803d; margin-top: 4px;">Save this ID for all official candidate evaluations</div>
          </div>

          <p>Please click the button below or use the 6-digit verification code to activate your account and access your AI voice interviewer and resume analytics:</p>

          <div style="text-align: center;">
            <a href="${verifyUrl}" class="btn">Verify My Email Address</a>
          </div>

          <div style="background: #f1f5f9; padding: 12px; border-radius: 8px; font-size: 13px; text-align: center; margin-top: 16px;">
            Verification Code: <strong style="font-family: monospace; font-size: 16px; color: #0f172a;">${token}</strong>
          </div>

          <p style="font-size: 13px; color: #64748b; margin-top: 24px;">If you did not create a SkillMatch AI account, you can safely ignore this email.</p>
        </div>
        <div class="footer">
          SkillMatch AI Career Readiness Engine &bull; Automated Personal Notification &bull; Confidential
        </div>
      </div>
    </body>
    </html>
  `;

  let previewUrl = '';
  try {
    const info = await mailer.sendMail({
      from: '"SkillMatch AI" <notifications@skillmatch.ai>',
      to: email,
      subject,
      html: bodyHtml
    });
    previewUrl = nodemailer.getTestMessageUrl(info) || '';
    console.log(`[Email Sent] Verification email dispatched to ${email}. Preview: ${previewUrl}`);
  } catch (err) {
    console.error('[Email Dispatch Error]', err.message);
  }

  await logEmail({
    userId,
    recipientEmail: email,
    subject,
    bodyHtml,
    emailType: 'verification',
    previewUrl,
    status: 'sent'
  });

  return { success: true, previewUrl };
}

/**
 * 2. Send Interview Completion & Evaluation Report Email
 */
export async function sendInterviewReportEmail({ userId, name, email, credentialId, sessionData, evaluation }) {
  const mailer = await getTransporter();
  const reportUrl = `${process.env.APP_URL || 'http://localhost:5173'}/interview?report=${evaluation.id || sessionData.sessionId}`;

  const subject = `SkillMatch AI — Voice Interview Evaluation Report [Score: ${evaluation.overallScore}/100]`;
  const bodyHtml = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background: #f8fafc; margin: 0; padding: 24px; color: #1e293b; }
        .card { max-width: 600px; margin: 0 auto; background: #ffffff; border-radius: 16px; border: 1px solid #e2e8f0; overflow: hidden; }
        .header { background: linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%); padding: 28px; text-align: center; color: white; }
        .score-pill { display: inline-block; background: #f0fdf4; border: 2px solid #86efac; border-radius: 12px; padding: 12px 24px; margin: 16px 0; }
        .score-num { font-size: 36px; font-weight: 800; color: #15803d; line-height: 1; }
        .metric-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 12px; margin: 20px 0; text-align: center; }
        .metric-box { background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 12px; }
        .btn { display: inline-block; background: #2563eb; color: #ffffff !important; text-decoration: none; padding: 12px 24px; border-radius: 8px; font-weight: 600; font-size: 14px; margin: 16px 0; }
        .footer { background: #f8fafc; padding: 16px; font-size: 12px; color: #64748b; text-align: center; border-top: 1px solid #e2e8f0; }
      </style>
    </head>
    <body>
      <div class="card">
        <div class="header">
          <div style="font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.05em; opacity: 0.85;">SkillMatch AI &bull; Voice Interview Agent</div>
          <h1 style="margin: 6px 0 0; font-size: 22px;">Interview Evaluation Ready</h1>
          <p style="margin: 4px 0 0; font-size: 13px; opacity: 0.9;">Role: ${sessionData.targetRole || 'Software Developer'} (${sessionData.interviewType})</p>
        </div>
        <div style="padding: 24px;">
          <p>Hello ${name},</p>
          <p>Your AI Voice Interview has been processed and scored according to our transparent competency rubric. Here is your summary:</p>

          <div style="text-align: center;">
            <div class="score-pill">
              <div style="font-size: 11px; color: #166534; font-weight: 600; text-transform: uppercase;">Overall Readiness Score</div>
              <div class="score-num">${evaluation.overallScore}<span style="font-size: 18px; color: #64748b;">/100</span></div>
            </div>
          </div>

          <div class="metric-grid">
            <div class="metric-box">
              <div style="font-size: 11px; color: #64748b;">Communication</div>
              <div style="font-size: 18px; font-weight: 700; color: #0284c7;">${evaluation.communicationScore}%</div>
            </div>
            <div class="metric-box">
              <div style="font-size: 11px; color: #64748b;">Role Knowledge</div>
              <div style="font-size: 18px; font-weight: 700; color: #16a34a;">${evaluation.technicalScore}%</div>
            </div>
            <div class="metric-box">
              <div style="font-size: 11px; color: #64748b;">Problem Solving</div>
              <div style="font-size: 18px; font-weight: 700; color: #7c3aed;">${evaluation.problemSolvingScore}%</div>
            </div>
          </div>

          <div style="text-align: center;">
            <a href="${reportUrl}" class="btn">View Complete Interview Report</a>
          </div>

          <div style="background: #f8fafc; border-left: 3px solid #3b82f6; padding: 12px; margin-top: 16px; font-size: 13px;">
            <strong>Key Strengths:</strong>
            <ul style="margin: 6px 0 0 16px; padding: 0;">
              ${(evaluation.strengths || []).slice(0, 3).map(s => `<li>${s}</li>`).join('')}
            </ul>
          </div>
        </div>
        <div class="footer">
          Candidate Credential ID: <strong>${credentialId}</strong> &bull; SkillMatch AI
        </div>
      </div>
    </body>
    </html>
  `;

  let previewUrl = '';
  try {
    const info = await mailer.sendMail({
      from: '"SkillMatch AI" <notifications@skillmatch.ai>',
      to: email,
      subject,
      html: bodyHtml
    });
    previewUrl = nodemailer.getTestMessageUrl(info) || '';
  } catch (err) {
    console.error('[Email Dispatch Error]', err.message);
  }

  await logEmail({
    userId,
    recipientEmail: email,
    subject,
    bodyHtml,
    emailType: 'interview_report',
    previewUrl,
    status: 'sent'
  });

  return { success: true, previewUrl };
}

/**
 * 3. Send Password Reset Email
 */
export async function sendPasswordResetEmail({ userId, name, email, token }) {
  const mailer = await getTransporter();
  const resetUrl = `${process.env.APP_URL || 'http://localhost:5173'}/login?resetToken=${token}&email=${encodeURIComponent(email)}`;

  const subject = `SkillMatch AI — Password Reset Request`;
  const bodyHtml = `
    <div style="font-family: sans-serif; max-width: 550px; margin: 0 auto; padding: 24px; border: 1px solid #e2e8f0; border-radius: 12px;">
      <h2 style="color: #0f172a; margin-top: 0;">Password Reset Request</h2>
      <p>Hello ${name},</p>
      <p>We received a request to reset the password for your SkillMatch AI account (${email}).</p>
      <p>Use the following link to choose a new password:</p>
      <div style="text-align: center; margin: 24px 0;">
        <a href="${resetUrl}" style="background: #2563eb; color: #fff; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: 600;">Reset My Password</a>
      </div>
      <p style="font-size: 12px; color: #64748b;">If you did not request this, please ignore this email.</p>
    </div>
  `;

  let previewUrl = '';
  try {
    const info = await mailer.sendMail({
      from: '"SkillMatch AI" <security@skillmatch.ai>',
      to: email,
      subject,
      html: bodyHtml
    });
    previewUrl = nodemailer.getTestMessageUrl(info) || '';
  } catch (err) {
    console.error('[Password Reset Dispatch Error]', err.message);
  }

  await logEmail({
    userId,
    recipientEmail: email,
    subject,
    bodyHtml,
    emailType: 'password_reset',
    previewUrl,
    status: 'sent'
  });

  return { success: true, previewUrl };
}

/**
 * Fetch all emails sent to a specific user or email address
 */
export async function getUserEmails(userIdentifier) {
  try {
    const emails = await dbAll(
      `SELECT * FROM user_emails 
       WHERE user_id = ? OR recipient_email = ? 
       ORDER BY sent_at DESC LIMIT 50`,
      [userIdentifier, userIdentifier]
    );
    return emails;
  } catch (err) {
    console.error('[Get Emails Error]', err);
    return [];
  }
}
