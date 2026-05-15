import { z } from "zod";

export const signUpSchema = z
  .object({
    name: z.string().min(2, "nameTooShort").max(64, "nameTooLong"),
    email: z.email({ message: "invalidEmail" }),
    password: z.string().min(8, "passwordTooShort").max(128, "passwordTooLong"),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "passwordsDoNotMatch",
    path: ["confirmPassword"],
  });

export const signInSchema = z.object({
  email: z.email({ message: "invalidEmail" }),
  password: z.string().min(1, "passwordRequired"),
});

export type SignUpInput = z.infer<typeof signUpSchema>;
export type SignInInput = z.infer<typeof signInSchema>;

export const forgotPasswordSchema = z.object({
  email: z.email({ message: "invalidEmail" }),
});

export const resetPasswordSchema = z
  .object({
    password: z.string().min(8, "passwordTooShort").max(128, "passwordTooLong"),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "passwordsDoNotMatch",
    path: ["confirmPassword"],
  });

export type ForgotPasswordInput = z.infer<typeof forgotPasswordSchema>;
export type ResetPasswordInput = z.infer<typeof resetPasswordSchema>;

export const settingsSchema = z
  .object({
    name: z.string().min(2, "nameTooShort").max(64, "nameTooLong"),
    password: z.string().optional().or(z.literal("")),
    newPassword: z.string().min(8, "passwordTooShort").max(128, "passwordTooLong").optional().or(z.literal("")),
    confirmNewPassword: z.string().optional().or(z.literal("")),
  })
  .refine(
    (data) => {
      // If newPassword is provided, current password is required
      if (data.newPassword && data.newPassword.length > 0 && (!data.password || data.password.length === 0)) {
        return false;
      }
      return true;
    },
    {
      message: "passwordRequired",
      path: ["password"],
    }
  )
  .refine(
    (data) => {
      // If current password is provided, newPassword is required
      if (data.password && data.password.length > 0 && (!data.newPassword || data.newPassword.length === 0)) {
        return false;
      }
      return true;
    },
    {
      message: "newPasswordRequired",
      path: ["newPassword"],
    }
  )
  .refine(
    (data) => {
      // Confirm must match new password when changing
      if (data.newPassword && data.newPassword.length > 0 && data.newPassword !== data.confirmNewPassword) {
        return false;
      }
      return true;
    },
    {
      message: "passwordsDoNotMatch",
      path: ["confirmNewPassword"],
    }
  );

export type SettingsInput = z.infer<typeof settingsSchema>;
