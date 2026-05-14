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
