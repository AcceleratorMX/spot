"use client";

import { useActionState } from "react";
import Link from "next/link";
import { useLocale, useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

import { signUp } from "@/app/actions/auth";
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

export default function SignUpPage() {
  const t = useTranslations("auth");
  const tNav = useTranslations("nav");
  const locale = useLocale();
  const router = useRouter();

  const [state, formAction, isPending] = useActionState<
    AuthActionResult | null,
    FormData
  >(signUp, null);

  useEffect(() => {
    if (state?.success) {
      router.push(`/${locale}/sign-in`);
    }
  }, [state?.success, router, locale]);

  return (
    <Card className="w-full max-w-md">
      <CardHeader className="space-y-1 text-center">
        <div className="mx-auto mb-2 flex h-12 w-12 items-center justify-center rounded-xl bg-primary text-primary-foreground text-lg font-bold">
          S
        </div>
        <CardTitle className="text-2xl font-bold">{tNav("signUp")}</CardTitle>
        <CardDescription>
          {t("signUpDescription")}
        </CardDescription>
      </CardHeader>
      <form action={formAction}>
        <CardContent className="space-y-4">
          {state?.error && (
            <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive" id="sign-up-error">
              {t(`errors.${state.error}`)}
            </div>
          )}
          <div className="space-y-2">
            <Label htmlFor="name">{t("name")}</Label>
            <Input
              id="name"
              name="name"
              type="text"
              placeholder="John Doe"
              required
              autoComplete="name"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="email">{t("email")}</Label>
            <Input
              id="email"
              name="email"
              type="email"
              placeholder="name@example.com"
              required
              autoComplete="email"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="password">{t("password")}</Label>
            <Input
              id="password"
              name="password"
              type="password"
              required
              autoComplete="new-password"
              minLength={8}
            />
          </div>
        </CardContent>
        <CardFooter className="flex flex-col gap-4">
          <Button
            type="submit"
            className="w-full"
            disabled={isPending}
            id="sign-up-submit"
          >
            {isPending ? "..." : tNav("signUp")}
          </Button>
          <p className="text-center text-sm text-muted-foreground">
            {t("alreadyHaveAccount")}{" "}
            <Link
              href={`/${locale}/sign-in`}
              className="font-medium text-primary underline-offset-4 hover:underline"
              id="go-to-sign-in"
            >
              {tNav("signIn")}
            </Link>
          </p>
        </CardFooter>
      </form>
    </Card>
  );
}
