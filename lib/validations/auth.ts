import { z } from "zod";

export const signUpSchema = z.object({
  name: z.string().min(2, "nameTooShort").max(64, "nameTooLong"),
  email: z.email({ message: "invalidEmail" }),
  password: z
    .string()
    .min(8, "passwordTooShort")
    .max(128, "passwordTooLong"),
});

export const signInSchema = z.object({
  email: z.email({ message: "invalidEmail" }),
  password: z.string().min(1, "passwordRequired"),
});

export type SignUpInput = z.infer<typeof signUpSchema>;
export type SignInInput = z.infer<typeof signInSchema>;
