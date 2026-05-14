import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

const domain = process.env.AUTH_URL || "http://localhost:3000";

export const sendPasswordResetEmail = async (email: string, token: string, locale: string = "en") => {
  const resetLink = `${domain}/${locale}/new-password?token=${token}`;

  await resend.emails.send({
    from: process.env.EMAIL_FROM || "onboarding@resend.dev",
    to: email,
    subject: "Reset your password",
    html: `<p>Click <a href="${resetLink}">here</a> to reset your password.</p>`,
  });
};
