"use client";

import { useTranslations } from "next-intl";
import { signInSocial } from "@/app/actions/auth";
import { Button } from "@/components/ui/button";
import { Globe, GitBranch } from "lucide-react";

export function SocialButtons() {
  const t = useTranslations("auth");

  return (
    <div className="flex flex-col gap-2">
      <div className="relative">
        <div className="absolute inset-0 flex items-center">
          <span className="w-full border-t" />
        </div>
        <div className="relative flex justify-center text-xs uppercase">
          <span className="bg-background px-2 text-muted-foreground">
            {t("socialLogin")}
          </span>
        </div>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <Button
          variant="outline"
          onClick={() => signInSocial("google")}
          className="w-full"
          id="social-google"
        >
          <Globe className="mr-2 h-4 w-4" />
          Google
        </Button>
        <Button
          variant="outline"
          onClick={() => signInSocial("github")}
          className="w-full"
          id="social-github"
        >
          <GitBranch className="mr-2 h-4 w-4" />
          GitHub
        </Button>
      </div>
    </div>
  );
}
