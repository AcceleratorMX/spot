"use client";

import { useActionState, useEffect } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { useLocale, useTranslations } from "next-intl";

import { resetPassword } from "@/app/actions/auth";
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

export default function NewPasswordPage() {
  const t = useTranslations("auth");
  const locale = useLocale();
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token");

  const resetPasswordWithToken = resetPassword.bind(null, token);

  const [state, formAction, isPending] = useActionState<
    AuthActionResult | null,
    FormData
  >(resetPasswordWithToken, null);

  useEffect(() => {
    if (state?.success) {
      setTimeout(() => {
        router.push(`/${locale}/sign-in`);
      }, 3000);
    }
  }, [state?.success, router, locale]);

  return (
    <Card className="w-full max-w-md">
      <CardHeader className="space-y-1 text-center">
        <CardTitle className="text-2xl font-bold">{t("resetPassword")}</CardTitle>
        <CardDescription>
          Enter your new password below
        </CardDescription>
      </CardHeader>
      <form action={formAction}>
        <CardContent className="space-y-4">
          {!token && (
             <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">
               {t("errors.missingToken")}
             </div>
          )}
          {state?.error && (
            <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">
              {t(`errors.${state.error}`)}
            </div>
          )}
          {state?.success && (
            <div className="rounded-md bg-green-500/10 p-3 text-sm text-green-600">
              {t("passwordResetSuccess")}
            </div>
          )}
          <div className="space-y-2">
            <Label htmlFor="password">{t("newPassword")}</Label>
            <Input
              id="password"
              name="password"
              type="password"
              required
              disabled={!token || !!state?.success}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="confirmPassword">{t("confirmPassword")}</Label>
            <Input
              id="confirmPassword"
              name="confirmPassword"
              type="password"
              required
              disabled={!token || !!state?.success}
            />
          </div>
        </CardContent>
        <CardFooter>
          <Button
            type="submit"
            className="w-full"
            disabled={isPending || !token || !!state?.success}
          >
            {isPending ? "..." : t("resetPassword")}
          </Button>
        </CardFooter>
      </form>
    </Card>
  );
}
