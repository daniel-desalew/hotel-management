import nodemailer from "nodemailer";

let transporter = null;

/**
 * Initialize mail transporter
 */
const getTransporter = () => {
  if (transporter) return transporter;

  if (!process.env.SMTP_HOST) {
    console.warn(
      "⚠️  SMTP not configured — emails will be logged to console only",
    );
    return null;
  }

  transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT) || 587,
    secure: process.env.SMTP_PORT === "465",
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });

  return transporter;
};

/**
 * Send an email (or log it if SMTP not configured)
 */
export const sendEmail = async ({
  to,
  subject,
  html,
  text,
  attachments = [],
}) => {
  const tx = getTransporter();

  if (!tx) {
    console.log("📧 [MOCK EMAIL]");
    console.log("  To:", to);
    console.log("  Subject:", subject);
    console.log("  Text:", text || "(html only)");
    return { mock: true };
  }

  try {
    const info = await tx.sendMail({
      from:
        process.env.SMTP_FROM ||
        `"Hotel Management" <${process.env.SMTP_USER}>`,
      to,
      subject,
      text,
      html,
      attachments,
    });
    console.log(`📧 Email sent to ${to}: ${info.messageId}`);
    return info;
  } catch (error) {
    console.error("❌ Email send failed:", error.message);
    throw error;
  }
};

// ─── Templates ──────────────────────────────────────────────────

const baseTemplate = (content) => `
  <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;padding:20px;">
    <div style="background:#1e3a8a;color:#fff;padding:20px;text-align:center;border-radius:8px 8px 0 0;">
      <h1 style="margin:0;">🏨 Hotel Management</h1>
    </div>
    <div style="background:#f9fafb;padding:30px;border:1px solid #e5e7eb;">
      ${content}
    </div>
    <div style="text-align:center;padding:20px;color:#6b7280;font-size:12px;">
      © ${new Date().getFullYear()} Hotel Management. All rights reserved.
    </div>
  </div>
`;

/**
 * Welcome email on register
 */
export const sendWelcomeEmail = async (user) => {
  const html = baseTemplate(`
    <h2>Welcome, ${user.firstName}!</h2>
    <p>Thanks for signing up. Your account is ready.</p>
    <p>Role: <strong>${user.role}</strong></p>
  `);
  return sendEmail({
    to: user.email,
    subject: "Welcome to Hotel Management",
    html,
  });
};

/**
 * Booking confirmation email
 */
export const sendBookingConfirmation = async (booking) => {
  const guest = booking.guestId;
  const room = booking.rooms?.[0];
  const html = baseTemplate(`
    <h2>Booking Confirmed ✅</h2>
    <p>Hi ${guest.firstName}, your booking is confirmed.</p>
    <table style="width:100%;border-collapse:collapse;margin:20px 0;">
      <tr><td style="padding:8px;border-bottom:1px solid #e5e7eb;"><strong>Booking #</strong></td><td style="padding:8px;border-bottom:1px solid #e5e7eb;">${booking.bookingNumber}</td></tr>
      <tr><td style="padding:8px;border-bottom:1px solid #e5e7eb;"><strong>Check-in</strong></td><td style="padding:8px;border-bottom:1px solid #e5e7eb;">${new Date(booking.checkIn).toDateString()}</td></tr>
      <tr><td style="padding:8px;border-bottom:1px solid #e5e7eb;"><strong>Check-out</strong></td><td style="padding:8px;border-bottom:1px solid #e5e7eb;">${new Date(booking.checkOut).toDateString()}</td></tr>
      <tr><td style="padding:8px;border-bottom:1px solid #e5e7eb;"><strong>Nights</strong></td><td style="padding:8px;border-bottom:1px solid #e5e7eb;">${booking.nights}</td></tr>
      <tr><td style="padding:8px;border-bottom:1px solid #e5e7eb;"><strong>Total</strong></td><td style="padding:8px;border-bottom:1px solid #e5e7eb;">$${booking.pricing.totalAmount}</td></tr>
    </table>
  `);
  return sendEmail({
    to: guest.email,
    subject: `Booking Confirmed — ${booking.bookingNumber}`,
    html,
  });
};

/**
 * Payment receipt email
 */
export const sendPaymentReceipt = async (payment, booking) => {
  const guest = booking.guestId;
  const html = baseTemplate(`
    <h2>Payment Received 💳</h2>
    <p>Hi ${guest.firstName}, we've received your payment.</p>
    <p><strong>Amount:</strong> $${payment.amount}</p>
    <p><strong>Method:</strong> ${payment.method}</p>
    <p><strong>Transaction:</strong> ${payment.transactionId || payment.paymentNumber}</p>
    <p><strong>Remaining balance:</strong> $${booking.pricing.balanceAmount}</p>
  `);
  return sendEmail({
    to: guest.email,
    subject: `Payment Receipt — ${booking.bookingNumber}`,
    html,
  });
};

/**
 * Booking cancellation email
 */
export const sendBookingCancellation = async (booking) => {
  const guest = booking.guestId;
  const html = baseTemplate(`
    <h2>Booking Cancelled ❌</h2>
    <p>Hi ${guest.firstName}, your booking has been cancelled.</p>
    <p><strong>Booking #:</strong> ${booking.bookingNumber}</p>
    <p><strong>Reason:</strong> ${booking.cancellation?.reason || "Not specified"}</p>
    <p><strong>Refund:</strong> $${booking.cancellation?.refundAmount || 0}</p>
  `);
  return sendEmail({
    to: guest.email,
    subject: `Booking Cancelled — ${booking.bookingNumber}`,
    html,
  });
};

/**
 * Password reset email
 */
export const sendPasswordReset = async (user, resetToken) => {
  const resetUrl = `${process.env.CLIENT_URL}/reset-password?token=${resetToken}`;
  const html = baseTemplate(`
    <h2>Password Reset Request</h2>
    <p>Hi ${user.firstName}, click the link below to reset your password.</p>
    <p style="text-align:center;margin:30px 0;">
      <a href="${resetUrl}" style="background:#1e3a8a;color:#fff;padding:12px 30px;text-decoration:none;border-radius:6px;">Reset Password</a>
    </p>
    <p style="font-size:12px;color:#6b7280;">If you didn't request this, you can ignore this email.</p>
  `);
  return sendEmail({
    to: user.email,
    subject: "Reset Your Password",
    html,
  });
};
