import { z } from "zod";

export const signUpSchema = z.object({
  name: z
    .string()
    .min(2, "Ім'я повинно містити мінімум 2 символи")
    .max(100, "Ім'я занадто довге"),
  email: z.string().email("Невірний формат email"),
  password: z
    .string()
    .min(8, "Пароль повинен містити мінімум 8 символів")
    .max(128, "Пароль занадто довгий"),
});

export const signInSchema = z.object({
  email: z.string().email("Невірний формат email"),
  password: z.string().min(1, "Пароль обов'язковий"),
});

export type SignUpInput = z.infer<typeof signUpSchema>;
export type SignInInput = z.infer<typeof signInSchema>;
