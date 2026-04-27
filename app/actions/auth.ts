"use server";

import bcrypt from "bcryptjs";
import { AuthError } from "next-auth";
import { signUpSchema, signInSchema } from "@/lib/validations/auth";
import { prisma } from "@/lib/prisma";
import { signIn as nextAuthSignIn } from "@/auth";

export type AuthActionResult = {
  success: boolean;
  error?: string;
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
  };

  const validated = signUpSchema.safeParse(rawData);

  if (!validated.success) {
    return {
      success: false,
      error: validated.error.issues[0]?.message ?? "invalidData",
    };
  }

  const { name, email, password } = validated.data;

  const existingUser = await prisma.user.findUnique({
    where: { email },
  });

  if (existingUser) {
    return {
      success: false,
      error: "userExists",
    };
  }

  const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);

  await prisma.user.create({
    data: {
      name,
      email,
      passwordHash,
    },
  });

  return { success: true };
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
    return {
      success: false,
      error: validated.error.issues[0]?.message ?? "invalidData",
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
