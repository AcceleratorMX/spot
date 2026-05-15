"use client";

import { useActionState, useEffect, useRef } from "react";
import { useTranslations } from "next-intl";
import { User, Shield, Loader2 } from "lucide-react";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { PasswordInput } from "@/components/ui/password-input";
import { updateSettings } from "@/app/actions/auth";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";

interface ProfileFormProps {
  user: {
    id: string;
    name?: string | null;
    email: string;
    role?: string;
  };
}

export function ProfileForm({ user }: ProfileFormProps) {
  const t = useTranslations("profile");
  const ta = useTranslations("auth");

  const router = useRouter();
  const { update } = useSession();
  const formRef = useRef<HTMLFormElement>(null);

  const [state, formAction, isPending] = useActionState(updateSettings, null);

  const lastProcessedState = useRef<typeof state>(null);

  const passwordFieldUsed = useRef(false);

  useEffect(() => {
    if (state !== lastProcessedState.current) {
      if (state?.success) {
        if (passwordFieldUsed.current) {
          toast.success(t("passwordChanged"));
        } else {
          toast.success(t("profileUpdated"));
        }
        // Reset password fields after successful update
        const passwordInputs = formRef.current?.querySelectorAll<HTMLInputElement>(
          'input[name="password"], input[name="newPassword"], input[name="confirmNewPassword"]'
        );
        passwordInputs?.forEach((input) => {
          input.value = "";
        });
        passwordFieldUsed.current = false;
        update();
        router.refresh();
      } else if (state?.error) {
        toast.error(ta(`errors.${state.error}`));
      }
      lastProcessedState.current = state;
    }
  }, [state, t, ta, update, router]);

  const getError = (field: string) => {
    if (state?.fieldErrors?.[field]) {
      const errorKey = state.fieldErrors[field][0];
      return ta(`errors.${errorKey}`);
    }
    return null;
  };

  return (
    <form ref={formRef} action={formAction} className="grid gap-6 md:grid-cols-2">
      <Card className="flex flex-col">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            {t("personalInfo")}
          </CardTitle>
          <CardDescription>
            {t("personalInfoDesc")}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4 flex-1">
          <div className="space-y-2">
            <Label htmlFor="name">{t("name")}</Label>
            <Input
              id="name"
              name="name"
              defaultValue={state?.fields?.name ?? user.name ?? ""}
              className={cn(getError("name") && "border-destructive")}
            />
            {getError("name") && (
              <p className="text-xs text-destructive">{getError("name")}</p>
            )}
          </div>
          <div className="space-y-2 opacity-70">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              defaultValue={user.email}
              disabled
              className="bg-muted"
            />
          </div>
        </CardContent>
        <CardFooter>
          <Button type="submit" disabled={isPending} className="w-full md:w-auto">
            {isPending ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                {t("updateProfile")}
              </>
            ) : (
              t("updateProfile")
            )}
          </Button>
        </CardFooter>
      </Card>

      <Card className="flex flex-col">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            {t("security")}
          </CardTitle>
          <CardDescription>
            {t("securityDesc")}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4 flex-1">
          <div className="space-y-2">
            <Label htmlFor="password">{t("currentPassword")}</Label>
            <PasswordInput
              id="password"
              name="password"
              autoComplete="current-password"
              className={cn(getError("password") && "border-destructive")}
            />
            {getError("password") && (
              <p className="text-xs text-destructive">{getError("password")}</p>
            )}
          </div>
          <div className="space-y-2">
            <Label htmlFor="newPassword">{t("newPassword")}</Label>
            <PasswordInput
              id="newPassword"
              name="newPassword"
              autoComplete="new-password"
              onChange={(e) => { passwordFieldUsed.current = e.target.value.length > 0; }}
              className={cn(getError("newPassword") && "border-destructive")}
            />
            {getError("newPassword") && (
              <p className="text-xs text-destructive">{getError("newPassword")}</p>
            )}
          </div>
          <div className="space-y-2">
            <Label htmlFor="confirmNewPassword">{t("confirmNewPassword")}</Label>
            <PasswordInput
              id="confirmNewPassword"
              name="confirmNewPassword"
              autoComplete="new-password"
              className={cn(getError("confirmNewPassword") && "border-destructive")}
            />
            {getError("confirmNewPassword") && (
              <p className="text-xs text-destructive">{getError("confirmNewPassword")}</p>
            )}
          </div>
        </CardContent>
        <CardFooter>
          <Button type="submit" disabled={isPending} variant="outline" className="w-full md:w-auto">
            {isPending ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                {t("changePassword")}
              </>
            ) : (
              t("changePassword")
            )}
          </Button>
        </CardFooter>
      </Card>
    </form>
  );
}
