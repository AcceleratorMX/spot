"use server";

import bcrypt from "bcryptjs";
import { signUpSchema } from "@/lib/validations/auth";
import { prisma } from "@/lib/prisma";

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
      error: validated.error.issues[0]?.message ?? "Невірні дані",
    };
  }

  const { name, email, password } = validated.data;

  const existingUser = await prisma.user.findUnique({
    where: { email },
  });

  if (existingUser) {
    return {
      success: false,
      error: "Користувач з таким email вже існує",
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
