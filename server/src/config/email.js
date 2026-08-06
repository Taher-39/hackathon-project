const nodemailer = require("nodemailer");

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

async function sendEmail({ to, subject, html, replyTo }) {
  if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
    console.warn("EMAIL_USER/EMAIL_PASS not configured — skipping email send");
    return;
  }
  await transporter.sendMail({
    from: `"TextileHub" <${process.env.EMAIL_USER}>`,
    to,
    subject,
    html,
    ...(replyTo ? { replyTo } : {}),
  });
}

module.exports = { sendEmail };
