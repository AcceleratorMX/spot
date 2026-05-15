import { Resend } from "resend";

let resend: Resend | null = null;

function getResend(): Resend {
  if (!resend) {
    resend = new Resend(process.env.RESEND_API_KEY);
  }
  return resend;
}

const domain = process.env.AUTH_URL || "http://localhost:3000";

export const sendPasswordResetEmail = async (email: string, token: string, locale: string = "en") => {
  const resetLink = `${domain}/${locale}/new-password?token=${token}`;

  await getResend().emails.send({
    from: process.env.EMAIL_FROM || "onboarding@resend.dev",
    to: email,
    subject: "Reset your password",
    html: `<p>Click <a href="${resetLink}">here</a> to reset your password.</p>`,
  });
};
