"use client";

import { useActionState } from "react";
import Link from "next/link";
import { useLocale, useTranslations } from "next-intl";
import { ChevronLeft } from "lucide-react";

import { forgotPassword } from "@/app/actions/auth";
import type { AuthActionResult } from "@/app/actions/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export default function ForgotPasswordPage() {
  const t = useTranslations("auth");
  const locale = useLocale();

  const [state, formAction, isPending] = useActionState<
    AuthActionResult | null,
    FormData
  >(forgotPassword, null);

  return (
    <Card className="w-full max-w-md">
      <CardHeader className="space-y-1 text-center">
        <CardTitle className="text-2xl font-bold">{t("forgotPassword")}</CardTitle>
        <CardDescription>
          Enter your email and we will send you a link to reset your password
        </CardDescription>
      </CardHeader>
      <form action={formAction}>
        <CardContent className="space-y-4">
          {state?.error && (
            <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">
              {t(`errors.${state.error}`)}
            </div>
          )}
          {state?.success && (
            <div className="rounded-md bg-green-500/10 p-3 text-sm text-green-600">
              {t("resetEmailSent")}
            </div>
          )}
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              name="email"
              type="email"
              placeholder="name@example.com"
              required
              autoComplete="email"
            />
          </div>
        </CardContent>
        <CardFooter className="flex flex-col gap-4">
          <Button
            type="submit"
            className="w-full"
            disabled={isPending || !!state?.success}
          >
            {isPending ? "..." : t("sendResetLink")}
          </Button>
          <Link
            href={`/${locale}/sign-in`}
            className="flex items-center justify-center text-sm text-muted-foreground hover:text-primary"
          >
            <ChevronLeft className="mr-2 h-4 w-4" />
            {t("backToSignIn")}
          </Link>
        </CardFooter>
      </form>
    </Card>
  );
}
