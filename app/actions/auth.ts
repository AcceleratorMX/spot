"use server";

import { getLocale } from "next-intl/server";

import bcrypt from "bcryptjs";
import { AuthError } from "next-auth";
import { signUpSchema, signInSchema } from "@/lib/validations/auth";
import { prisma } from "@/lib/prisma";
import { signIn as nextAuthSignIn } from "@/auth";
import { generatePasswordResetToken, getPasswordResetTokenByToken } from "@/lib/tokens";
import { sendPasswordResetEmail } from "@/lib/mail";
import { forgotPasswordSchema, resetPasswordSchema } from "@/lib/validations/auth";

export type AuthActionResult = {
  success: boolean;
  error?: string;
  fieldErrors?: Record<string, string[]>;
  fields?: Record<string, string>;
};

const SALT_ROUNDS = 12;

export async function signUp(
  _prevState: AuthActionResult | null,
  formData: FormData,
): Promise<AuthActionResult> {
  const rawData = {
    name: formData.get("name") as string,
    email: formData.get("email") as string,
    password: formData.get("password") as string,
    confirmPassword: formData.get("confirmPassword") as string,
  };

  const validated = signUpSchema.safeParse(rawData);
  const fieldErrors: Record<string, string[]> = {};

  if (!validated.success) {
    validated.error.issues.forEach((issue) => {
      const path = issue.path[0] as string;
      if (!fieldErrors[path]) fieldErrors[path] = [];
      fieldErrors[path].push(issue.message);
    });
  }

  // Check for existing user even if Zod validation failed (if we have a semi-valid email)
  const email = rawData.email;
  if (email && email.includes("@")) {
    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      if (!fieldErrors.email) fieldErrors.email = [];
      fieldErrors.email.push("userExists");
    }
  }

  if (Object.keys(fieldErrors).length > 0 || !validated.success) {
    return {
      success: false,
      fieldErrors,
      fields: {
        name: rawData.name,
        email: rawData.email,
      },
    };
  }

  const { password, name } = validated.data;

  const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);

  try {
    await prisma.user.create({
      data: {
        name,
        email,
        passwordHash,
      },
    });
    return { success: true };
  } catch (error) {
    // Handle potential race condition where user was created between the check and create
    if (error instanceof Error && error.message.includes("P2002")) {
      return {
        success: false,
        error: "userExists",
      };
    }
    throw error;
  }
}

export async function signIn(
  _prevState: AuthActionResult | null,
  formData: FormData,
): Promise<AuthActionResult> {
  const rawData = {
    email: formData.get("email") as string,
    password: formData.get("password") as string,
  };

  const validated = signInSchema.safeParse(rawData);

  if (!validated.success) {
    const fieldErrors: Record<string, string[]> = {};
    validated.error.issues.forEach((issue) => {
      const path = issue.path[0] as string;
      if (!fieldErrors[path]) fieldErrors[path] = [];
      fieldErrors[path].push(issue.message);
    });

    return {
      success: false,
      fieldErrors,
      fields: {
        email: rawData.email,
      },
    };
  }

  try {
    await nextAuthSignIn("credentials", {
      email: validated.data.email,
      password: validated.data.password,
      redirect: false,
    });

    return { success: true };
  } catch (error) {
    if (error instanceof AuthError) {
      switch (error.type) {
        case "CredentialsSignin":
          return { success: false, error: "invalidCredentials" };
        default:
          return { success: false, error: "invalidData" };
      }
    }
    throw error;
  }
}

export async function signInSocial(provider: "google" | "github") {
  await nextAuthSignIn(provider);
}

export async function forgotPassword(
  _prevState: AuthActionResult | null,
  formData: FormData,
): Promise<AuthActionResult> {
  const locale = await getLocale();
  const email = formData.get("email") as string;
  const validated = forgotPasswordSchema.safeParse({ email });

  if (!validated.success) {
    return { success: false, error: "invalidEmail" };
  }

  const user = await prisma.user.findUnique({
    where: { email: validated.data.email },
  });

  if (!user || !user.email) {
    // We return success anyway to prevent email enumeration
    return { success: true };
  }

  // Only allow reset if user has a password (not an OAuth-only user)
  if (!user.passwordHash) {
    return { success: false, error: "socialUser" };
  }

  const token = await generatePasswordResetToken(user.email);
  await sendPasswordResetEmail(token.identifier, token.token, locale);

  return { success: true };
}

export async function resetPassword(
  token: string | null,
  _prevState: AuthActionResult | null,
  formData: FormData,
): Promise<AuthActionResult> {
  if (!token) {
    return { success: false, error: "missingToken" };
  }

  const rawData = {
    password: formData.get("password") as string,
    confirmPassword: formData.get("confirmPassword") as string,
  };

  const validated = resetPasswordSchema.safeParse(rawData);

  if (!validated.success) {
    return {
      success: false,
      error: validated.error.issues[0]?.message ?? "invalidData",
    };
  }

  const existingToken = await getPasswordResetTokenByToken(token);

  if (!existingToken) {
    return { success: false, error: "invalidToken" };
  }

  const hasExpired = new Date(existingToken.expires) < new Date();

  if (hasExpired) {
    return { success: false, error: "tokenExpired" };
  }

  const user = await prisma.user.findUnique({
    where: { email: existingToken.identifier },
  });

  if (!user) {
    return { success: false, error: "invalidEmail" };
  }

  const passwordHash = await bcrypt.hash(validated.data.password, SALT_ROUNDS);

  await prisma.$transaction([
    prisma.user.update({
      where: { id: user.id },
      data: { passwordHash },
    }),
    prisma.verificationToken.delete({
      where: {
        identifier_token: {
          identifier: existingToken.identifier,
          token: existingToken.token,
        },
      },
    }),
  ]);

  return { success: true };
}
