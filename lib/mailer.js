import nodemailer from "nodemailer";
import dotenv from "dotenv";

dotenv.config();

const SMTP_HOST = process.env.SMTP_HOST || "";
const SMTP_PORT = Number(process.env.SMTP_PORT || 587);
const SMTP_USER = process.env.SMTP_USER || "";
const SMTP_PASS = process.env.SMTP_PASS || "";
const SMTP_SECURE = process.env.SMTP_SECURE === "true";
const EMAIL_FROM = process.env.EMAIL_FROM || "Companio <no-reply@companio.local>";

const isMailerConfigured = Boolean(SMTP_HOST && SMTP_PORT && SMTP_USER && SMTP_PASS);

let transporter = null;
if (isMailerConfigured) {
  transporter = nodemailer.createTransport({
    host: SMTP_HOST,
    port: SMTP_PORT,
    secure: SMTP_SECURE,
    auth: {
      user: SMTP_USER,
      pass: SMTP_PASS,
    },
  });
}

export async function sendEmail({ to, subject, text, html }) {
  const safeTo = String(to || "").trim().toLowerCase();
  if (!safeTo) throw new Error("Missing email recipient");

  if (!isMailerConfigured || !transporter) {
    console.warn("⚠️ SMTP not configured. Email not sent:", { to: safeTo, subject });
    return { delivered: false, skipped: true };
  }

  const info = await transporter.sendMail({
    from: EMAIL_FROM,
    to: safeTo,
    subject,
    text,
    html,
  });
  return { delivered: true, messageId: info.messageId };
}

export { isMailerConfigured };

