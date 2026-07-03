import nodemailer from 'nodemailer';

const PLACEHOLDER_HOSTS = new Set(['', 'smtp.example.com', 'localhost']);

const isSmtpConfigured = (): boolean => {
  const host = (process.env.NODEMAILER_HOST || '').trim();
  const user = (process.env.NODEMAILER_USER || '').trim();
  const pass = (process.env.NODEMAILER_PASS || '').trim();

  if (!host || PLACEHOLDER_HOSTS.has(host)) return false;
  if (!user || user.includes('example.com')) return false;
  if (!pass || pass === 'your_email_password') return false;

  return true;
};

const transporter = isSmtpConfigured()
  ? nodemailer.createTransport({
      host: process.env.NODEMAILER_HOST,
      port: Number(process.env.NODEMAILER_PORT) || 587,
      secure: Number(process.env.NODEMAILER_PORT) === 465,
      auth: {
        user: process.env.NODEMAILER_USER,
        pass: process.env.NODEMAILER_PASS,
      },
    })
  : null;

const FROM = process.env.NODEMAILER_FROM || 'noreply@yoursaas.com';

const sendMail = async (
  options: { to: string; subject: string; html: string },
  debugLabel: string,
): Promise<void> => {
  if (!transporter) {
    console.warn(
      `[Email] SMTP not configured — skipped "${options.subject}" to ${options.to}. ` +
        `Set NODEMAILER_HOST / USER / PASS in backend/.env to enable email.`,
    );
    if (debugLabel) {
      console.info(`[Email] ${debugLabel}`);
    }
    return;
  }

  await transporter.sendMail({
    from: FROM,
    ...options,
  });
};

export const sendWelcomeEmail = async (to: string, name: string): Promise<void> => {
  await sendMail(
    {
      to,
      subject: 'Welcome to SaaS Starter Kit!',
      html: `
      <div style="font-family:sans-serif;max-width:600px;margin:0 auto;">
        <h1 style="color:#6366f1;">Welcome, ${name}! 🎉</h1>
        <p>Thank you for signing up. Your account is ready to use.</p>
        <p>You're currently on the <strong>Free plan</strong>. Upgrade anytime to unlock more features.</p>
        <a href="${process.env.CLIENT_URL}/billing"
           style="display:inline-block;padding:12px 24px;background:#6366f1;color:#fff;border-radius:6px;text-decoration:none;margin-top:16px;">
          View Plans
        </a>
        <p style="color:#888;margin-top:32px;font-size:12px;">
          If you didn't create this account, you can safely ignore this email.
        </p>
      </div>
    `,
    },
    '',
  );
};

export const sendInvoiceEmail = async (
  to: string,
  name: string,
  amount: number,
  invoiceUrl: string,
): Promise<void> => {
  await sendMail(
    {
      to,
      subject: 'Your SaaS Starter Kit Invoice',
      html: `
      <div style="font-family:sans-serif;max-width:600px;margin:0 auto;">
        <h1 style="color:#6366f1;">Payment Confirmed</h1>
        <p>Hi ${name},</p>
        <p>We received your payment of <strong>$${(amount / 100).toFixed(2)}</strong>. Thank you!</p>
        <a href="${invoiceUrl}"
           style="display:inline-block;padding:12px 24px;background:#6366f1;color:#fff;border-radius:6px;text-decoration:none;margin-top:16px;">
          View Invoice
        </a>
      </div>
    `,
    },
    '',
  );
};

export const sendInviteEmail = async (email: string, inviteLink: string): Promise<void> => {
  await sendMail(
    {
      to: email,
      subject: "You're invited to join a team on SaaS Starter Kit",
      html: `
      <div style="font-family:sans-serif;max-width:600px;margin:0 auto;">
        <h1 style="color:#6366f1;">Team Invitation</h1>
        <p>You've been invited to join a team on SaaS Starter Kit.</p>
        <p>Click the button below to accept the invite. If you don't have an account yet, register with this email first, then open the link again.</p>
        <a href="${inviteLink}"
           style="display:inline-block;padding:12px 24px;background:#6366f1;color:#fff;border-radius:6px;text-decoration:none;margin-top:16px;">
          Accept Invite
        </a>
        <p style="color:#888;margin-top:32px;font-size:12px;">
          If you weren't expecting this email, you can safely ignore it.
        </p>
      </div>
    `,
    },
    `Invite link for ${email}: ${inviteLink}`,
  );
};

export const sendCancellationEmail = async (to: string, name: string): Promise<void> => {
  await sendMail(
    {
      to,
      subject: 'Your subscription has been cancelled',
      html: `
      <div style="font-family:sans-serif;max-width:600px;margin:0 auto;">
        <h1 style="color:#6366f1;">Subscription Cancelled</h1>
        <p>Hi ${name},</p>
        <p>Your subscription has been cancelled. You'll retain access until the end of your current billing period.</p>
        <p>We'd love to have you back anytime.</p>
        <a href="${process.env.CLIENT_URL}/billing"
           style="display:inline-block;padding:12px 24px;background:#6366f1;color:#fff;border-radius:6px;text-decoration:none;margin-top:16px;">
          Reactivate
        </a>
      </div>
    `,
    },
    '',
  );
};
