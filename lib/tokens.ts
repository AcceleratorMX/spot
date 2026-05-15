import { v4 as uuidv4 } from "uuid";
import { prisma } from "@/lib/prisma";

export const getPasswordResetTokenByToken = async (token: string) => {
  try {
    const passwordResetToken = await prisma.verificationToken.findFirst({
      where: { token },
    });

    return passwordResetToken;
  } catch {
    return null;
  }
};

export const getPasswordResetTokenByEmail = async (email: string) => {
  try {
    const passwordResetToken = await prisma.verificationToken.findFirst({
      where: { identifier: email },
    });

    return passwordResetToken;
  } catch {
    return null;
  }
};

export const generatePasswordResetToken = async (email: string) => {
  const token = uuidv4();
  const expires = new Date(new Date().getTime() + 3600 * 1000); // 1 hour

  const existingToken = await getPasswordResetTokenByEmail(email);

  if (existingToken) {
    await prisma.verificationToken.delete({
      where: {
        identifier_token: {
          identifier: existingToken.identifier,
          token: existingToken.token,
        },
      },
    });
  }

  const passwordResetToken = await prisma.verificationToken.create({
    data: {
      identifier: email,
      token,
      expires,
    },
  });

  return passwordResetToken;
};
