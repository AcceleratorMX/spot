"use client";

import { useActionState } from "react";
import Link from "next/link";
import { useLocale, useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

import { signIn } from "@/app/actions/auth";
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

export default function SignInPage() {
  const t = useTranslations("auth");
  const tNav = useTranslations("nav");
  const locale = useLocale();
  const router = useRouter();

  const [state, formAction, isPending] = useActionState<
    AuthActionResult | null,
    FormData
  >(signIn, null);

  useEffect(() => {
    if (state?.success) {
      router.push(`/${locale}/dashboard`);
      router.refresh();
    }
  }, [state?.success, router, locale]);

  return (
    <Card className="w-full max-w-md">
      <CardHeader className="space-y-1 text-center">
        <div className="mx-auto mb-2 flex h-12 w-12 items-center justify-center rounded-xl bg-primary text-primary-foreground text-lg font-bold">
          S
        </div>
        <CardTitle className="text-2xl font-bold">{tNav("signIn")}</CardTitle>
        <CardDescription>
          {t("errors.invalidData") ? "" : ""}
          Enter your credentials to access your workspace
        </CardDescription>
      </CardHeader>
      <form action={formAction}>
        <CardContent className="space-y-4">
          {state?.error && (
            <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive" id="sign-in-error">
              {t(`errors.${state.error}`)}
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
          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <Input
              id="password"
              name="password"
              type="password"
              required
              autoComplete="current-password"
            />
          </div>
        </CardContent>
        <CardFooter className="flex flex-col gap-4">
          <Button
            type="submit"
            className="w-full"
            disabled={isPending}
            id="sign-in-submit"
          >
            {isPending ? "..." : tNav("signIn")}
          </Button>
          <p className="text-center text-sm text-muted-foreground">
            Don&apos;t have an account?{" "}
            <Link
              href={`/${locale}/sign-up`}
              className="font-medium text-primary underline-offset-4 hover:underline"
              id="go-to-sign-up"
            >
              {tNav("signUp")}
            </Link>
          </p>
        </CardFooter>
      </form>
    </Card>
  );
}
