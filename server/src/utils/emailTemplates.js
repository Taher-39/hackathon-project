function baseTemplate({ heading, message, buttonText, buttonUrl, footerNote }) {
  return `
  <div style="background:#f3f4f6;padding:32px 16px;font-family:Arial,Helvetica,sans-serif;">
    <div style="max-width:480px;margin:0 auto;background:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 1px 3px rgba(0,0,0,0.08);">
      <div style="background:#4338ca;padding:24px 32px;">
        <span style="color:#ffffff;font-size:20px;font-weight:bold;">TextileHub</span>
      </div>
      <div style="padding:32px;">
        <h1 style="margin:0 0 16px;font-size:20px;color:#111827;">${heading}</h1>
        <p style="margin:0 0 24px;font-size:14px;line-height:1.6;color:#4b5563;">${message}</p>
        <a href="${buttonUrl}" style="display:inline-block;background:#4338ca;color:#ffffff;text-decoration:none;padding:12px 24px;border-radius:8px;font-size:14px;font-weight:bold;">${buttonText}</a>
        <p style="margin:24px 0 0;font-size:12px;color:#9ca3af;word-break:break-all;">
          If the button doesn't work, copy this link into your browser:<br />${buttonUrl}
        </p>
      </div>
      <div style="background:#f9fafb;padding:16px 32px;border-top:1px solid #e5e7eb;">
        <p style="margin:0;font-size:12px;color:#9ca3af;">${footerNote}</p>
      </div>
    </div>
  </div>`;
}

function verificationEmail(name, verifyUrl) {
  return baseTemplate({
    heading: `Welcome, ${name} 👋`,
    message:
      "Thanks for registering on TextileHub. Please verify your email address to activate your account and start browsing or listing fabrics.",
    buttonText: "Verify Email",
    buttonUrl: verifyUrl,
    footerNote: "This link expires in 24 hours. If you didn't create this account, you can ignore this email.",
  });
}

function passwordResetEmail(name, resetUrl) {
  return baseTemplate({
    heading: `Reset your password, ${name}`,
    message:
      "We received a request to reset your TextileHub account password. Click the button below to choose a new password.",
    buttonText: "Reset Password",
    buttonUrl: resetUrl,
    footerNote: "This link expires in 1 hour. If you didn't request this, you can safely ignore this email.",
  });
}

function escapeHtml(str) {
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function contactNotificationEmail({ name, email, subject, message }) {
  return `
  <div style="background:#f3f4f6;padding:32px 16px;font-family:Arial,Helvetica,sans-serif;">
    <div style="max-width:480px;margin:0 auto;background:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 1px 3px rgba(0,0,0,0.08);">
      <div style="background:#4338ca;padding:24px 32px;">
        <span style="color:#ffffff;font-size:20px;font-weight:bold;">TextileHub</span>
      </div>
      <div style="padding:32px;">
        <h1 style="margin:0 0 16px;font-size:20px;color:#111827;">New contact form message</h1>
        <table style="width:100%;font-size:14px;color:#4b5563;margin-bottom:16px;">
          <tr><td style="padding:4px 0;color:#9ca3af;width:70px;">From</td><td>${escapeHtml(name)} &lt;${escapeHtml(email)}&gt;</td></tr>
          <tr><td style="padding:4px 0;color:#9ca3af;">Subject</td><td>${escapeHtml(subject)}</td></tr>
        </table>
        <p style="margin:0;font-size:14px;line-height:1.6;color:#111827;background:#f9fafb;border-radius:8px;padding:16px;white-space:pre-wrap;">${escapeHtml(message)}</p>
      </div>
      <div style="background:#f9fafb;padding:16px 32px;border-top:1px solid #e5e7eb;">
        <p style="margin:0;font-size:12px;color:#9ca3af;">Reply directly to this email to respond to ${escapeHtml(name)}.</p>
      </div>
    </div>
  </div>`;
}

function contactConfirmationEmail(name) {
  return baseTemplateNoButton({
    heading: `Thanks for reaching out, ${name}`,
    message:
      "We've received your message and a member of the TextileHub team will get back to you shortly.",
  });
}

function baseTemplateNoButton({ heading, message }) {
  return `
  <div style="background:#f3f4f6;padding:32px 16px;font-family:Arial,Helvetica,sans-serif;">
    <div style="max-width:480px;margin:0 auto;background:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 1px 3px rgba(0,0,0,0.08);">
      <div style="background:#4338ca;padding:24px 32px;">
        <span style="color:#ffffff;font-size:20px;font-weight:bold;">TextileHub</span>
      </div>
      <div style="padding:32px;">
        <h1 style="margin:0 0 16px;font-size:20px;color:#111827;">${heading}</h1>
        <p style="margin:0;font-size:14px;line-height:1.6;color:#4b5563;">${message}</p>
      </div>
    </div>
  </div>`;
}

module.exports = { verificationEmail, passwordResetEmail, contactNotificationEmail, contactConfirmationEmail };
