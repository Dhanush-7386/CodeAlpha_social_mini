const nodemailer = require('nodemailer');
const crypto = require('crypto');

// ─── Transporter ──────────────────────────────────────────────────────────────
let transporter;
try {
  transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });
} catch (err) {
  console.warn('⚠️  SMTP transporter creation failed:', err.message);
  transporter = null;
}

// ─── Generate OTP ─────────────────────────────────────────────────────────────
function generateOTP() {
  return crypto.randomInt(100000, 999999).toString();
}

// ─── HTML Email Template ──────────────────────────────────────────────────────
function buildOTPEmail(otp, purpose) {
  const purposeMap = {
    signup: {
      title: 'Verify Your Account',
      subtitle: 'Welcome to SocialMini! Please verify your email address.',
      instruction: 'Use this code to complete your registration:',
    },
    login: {
      title: 'Login Verification',
      subtitle: 'A login attempt was made on your SocialMini account.',
      instruction: 'Use this code to verify your identity:',
    },
    'password-reset': {
      title: 'Password Reset',
      subtitle: 'A password reset was requested for your SocialMini account.',
      instruction: 'Use this code to reset your password:',
    },
  };

  const info = purposeMap[purpose] || purposeMap.signup;

  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin:0;padding:0;background-color:#f4f4f7;font-family:'Segoe UI',Tahoma,Geneva,Verdana,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#f4f4f7;padding:40px 0;">
    <tr>
      <td align="center">
        <table width="480" cellpadding="0" cellspacing="0" style="background-color:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 4px 12px rgba(0,0,0,0.08);">
          <!-- Header -->
          <tr>
            <td style="background:linear-gradient(135deg,#667eea 0%,#764ba2 100%);padding:32px 40px;text-align:center;">
              <h1 style="margin:0;color:#ffffff;font-size:28px;font-weight:700;letter-spacing:-0.5px;">📸 SocialMini</h1>
            </td>
          </tr>
          <!-- Body -->
          <tr>
            <td style="padding:40px;">
              <h2 style="margin:0 0 8px;color:#1a1a2e;font-size:22px;font-weight:600;">${info.title}</h2>
              <p style="margin:0 0 24px;color:#6b7280;font-size:15px;line-height:1.5;">${info.subtitle}</p>
              <p style="margin:0 0 16px;color:#374151;font-size:15px;">${info.instruction}</p>
              <!-- OTP Code -->
              <div style="background-color:#f0f0ff;border:2px dashed #667eea;border-radius:10px;padding:20px;text-align:center;margin:0 0 24px;">
                <span style="font-size:36px;font-weight:700;letter-spacing:8px;color:#667eea;">${otp}</span>
              </div>
              <p style="margin:0 0 8px;color:#9ca3af;font-size:13px;">This code expires in <strong>10 minutes</strong>.</p>
              <p style="margin:0;color:#9ca3af;font-size:13px;">If you didn't request this, please ignore this email.</p>
            </td>
          </tr>
          <!-- Footer -->
          <tr>
            <td style="background-color:#f9fafb;padding:20px 40px;text-align:center;border-top:1px solid #e5e7eb;">
              <p style="margin:0;color:#9ca3af;font-size:12px;">&copy; ${new Date().getFullYear()} SocialMini. All rights reserved.</p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

// ─── Send OTP ─────────────────────────────────────────────────────────────────
async function sendOTP(email, otp, purpose) {
  console.log(`\n📧 ═══════════════════════════════════════════`);
  console.log(`📧  OTP for ${email}: ${otp}`);
  console.log(`📧  Purpose: ${purpose}`);
  console.log(`📧  Expires in: ${process.env.OTP_EXPIRY_MINUTES || 5} minutes`);
  console.log(`📧 ═══════════════════════════════════════════\n`);

  if (!transporter) {
    console.warn('⚠️  No SMTP transporter available. OTP logged above.');
    return;
  }

  const subjectMap = {
    signup: 'SocialMini — Verify Your Account',
    login: 'SocialMini — Login Verification Code',
    'password-reset': 'SocialMini — Password Reset Code',
  };

  try {
    await transporter.sendMail({
      from: `"SocialMini" <${process.env.SMTP_USER}>`,
      to: email,
      subject: subjectMap[purpose] || 'SocialMini — Verification Code',
      html: buildOTPEmail(otp, purpose),
    });
    console.log(`✅ OTP email sent successfully to ${email}`);
  } catch (err) {
    console.warn(`⚠️  Failed to send OTP email to ${email}: ${err.message}`);
    console.warn('⚠️  OTP has been logged to console above. Use it to verify.');
  }
}

// ─── Send Welcome Email ───────────────────────────────────────────────────────
async function sendWelcomeEmail(email, username) {
  if (!transporter) return;

  const html = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin:0;padding:0;background-color:#f4f4f7;font-family:'Segoe UI',Tahoma,Geneva,Verdana,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#f4f4f7;padding:40px 0;">
    <tr>
      <td align="center">
        <table width="480" cellpadding="0" cellspacing="0" style="background-color:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 4px 12px rgba(0,0,0,0.08);">
          <!-- Header -->
          <tr>
            <td style="background:linear-gradient(135deg,#667eea 0%,#764ba2 100%);padding:32px 40px;text-align:center;">
              <h1 style="margin:0;color:#ffffff;font-size:28px;font-weight:700;letter-spacing:-0.5px;">📸 SocialMini</h1>
            </td>
          </tr>
          <!-- Body -->
          <tr>
            <td style="padding:40px;text-align:center;">
              <div style="font-size:48px;margin-bottom:16px;">🎉</div>
              <h2 style="margin:0 0 8px;color:#1a1a2e;font-size:22px;font-weight:600;">Welcome, ${username}!</h2>
              <p style="margin:0 0 24px;color:#6b7280;font-size:15px;line-height:1.6;">
                Your account has been verified successfully. You're all set to start sharing moments with the world!
              </p>
              <div style="background-color:#f0fdf4;border-radius:8px;padding:16px;margin:0 0 24px;">
                <p style="margin:0;color:#166534;font-size:14px;font-weight:500;">✅ Account verified &amp; ready to go</p>
              </div>
              <p style="margin:0;color:#9ca3af;font-size:13px;">Start by completing your profile, following people, and sharing your first post.</p>
            </td>
          </tr>
          <!-- Footer -->
          <tr>
            <td style="background-color:#f9fafb;padding:20px 40px;text-align:center;border-top:1px solid #e5e7eb;">
              <p style="margin:0;color:#9ca3af;font-size:12px;">&copy; ${new Date().getFullYear()} SocialMini. All rights reserved.</p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;

  const mailOptions = {
    from: `"SocialMini" <${process.env.SMTP_USER}>`,
    to: email,
    subject: 'Welcome to SocialMini! 🎉',
    html,
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log(`✅ Welcome email sent to ${email}`);
  } catch (err) {
    console.warn(`⚠️  Failed to send welcome email: ${err.message}`);
  }
}

module.exports = { generateOTP, sendOTP, sendWelcomeEmail };
