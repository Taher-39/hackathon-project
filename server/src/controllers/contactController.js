const { sendEmail } = require("../config/email");
const { contactNotificationEmail, contactConfirmationEmail } = require("../utils/emailTemplates");
const { ok, fail } = require("../utils/apiResponse");

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

exports.submitContact = async (req, res) => {
  const { name, email, subject, message } = req.body;

  if (!name || !email || !subject || !message) {
    return fail(res, "name, email, subject and message are required", 400);
  }
  if (!EMAIL_RE.test(email)) {
    return fail(res, "Enter a valid email address", 400);
  }
  if (message.length > 5000) {
    return fail(res, "message is too long", 400);
  }

  await sendEmail({
    to: process.env.EMAIL_USER,
    subject: `[Contact] ${subject}`,
    html: contactNotificationEmail({ name, email, subject, message }),
    replyTo: email,
  });

  await sendEmail({
    to: email,
    subject: "We received your message — TextileHub",
    html: contactConfirmationEmail(name),
  }).catch((err) => console.error("Failed to send contact confirmation email", err));

  return ok(res, null, "Message sent");
};
