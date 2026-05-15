"use client";

import Link from "next/link";
import { useLocale, useTranslations } from "next-intl";

import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/theme-toggle";
import { LanguageSwitcher } from "@/components/language-switcher";
import { UserNav } from "@/components/user-nav";
import { Separator } from "@/components/ui/separator";

type NavbarClientProps = {
  user: {
    name?: string | null;
    email?: string | null;
    image?: string | null;
  } | null;
};

export function NavbarClient({ user }: NavbarClientProps) {
  const t = useTranslations("nav");
  const locale = useLocale();

  return (
    <header
      className="sticky top-0 z-40 flex h-14 items-center border-b bg-background/95 backdrop-blur supports-backdrop-filter:bg-background/60"
      data-testid="navbar"
    >
      <div className="flex flex-1 items-center justify-end gap-2 px-4">
        <LanguageSwitcher />
        <ThemeToggle />
        <Separator orientation="vertical" className="mx-1 h-6" />
        {user ? (
          <UserNav user={user} />
        ) : (
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" asChild id="nav-sign-in">
              <Link href={`/${locale}/sign-in`}>{t("signIn")}</Link>
            </Button>
            <Button size="sm" asChild id="nav-sign-up">
              <Link href={`/${locale}/sign-up`}>{t("signUp")}</Link>
            </Button>
          </div>
        )}
      </div>
    </header>
  );
}
