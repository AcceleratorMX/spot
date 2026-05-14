"use client";

import { useTheme, type Theme } from "@/components/theme-provider";
import { useTranslations, useLocale } from "next-intl";
import { Moon, Sun, Monitor, Globe } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useRouter, usePathname } from "@/i18n/navigation";

import * as React from "react";

export function SettingsForm() {
  const [mounted, setMounted] = React.useState(false);
  const { theme, setTheme } = useTheme();
  const t = useTranslations("nav");
  const ts = useTranslations("settings");
  const locale = useLocale();
  const router = useRouter();
  const pathname = usePathname();

  React.useEffect(() => {
    const frame = requestAnimationFrame(() => {
      setMounted(true);
    });
    return () => cancelAnimationFrame(frame);
  }, []);

  const onLocaleChange = (value: string) => {
    router.replace(pathname, { locale: value });
  };

  if (!mounted) {
    return null; // Or a loading skeleton
  }

  return (
    <div className="grid gap-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Monitor className="h-5 w-5" />
            {ts("appearance")}
          </CardTitle>
          <CardDescription>
            {ts("appearanceDesc")}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>{t("theme")}</Label>
            <RadioGroup
              defaultValue={theme}
              onValueChange={(v) => setTheme(v as Theme)}
              className="grid max-w-sm grid-cols-2 gap-4"
            >
              <div>
                <RadioGroupItem value="light" id="light" className="peer sr-only" />
                <Label
                  htmlFor="light"
                  className="flex flex-col items-center justify-between rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary"
                >
                  <Sun className="mb-3 h-6 w-6" />
                  {t("light")}
                </Label>
              </div>
              <div>
                <RadioGroupItem value="dark" id="dark" className="peer sr-only" />
                <Label
                  htmlFor="dark"
                  className="flex flex-col items-center justify-between rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary"
                >
                  <Moon className="mb-3 h-6 w-6" />
                  {t("dark")}
                </Label>
              </div>
            </RadioGroup>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Globe className="h-5 w-5" />
            {ts("languageRegion")}
          </CardTitle>
          <CardDescription>
            {ts("languageRegionDesc")}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="language">{t("language")}</Label>
            <Select defaultValue={locale} onValueChange={onLocaleChange}>
              <SelectTrigger id="language" className="w-[180px]">
                <SelectValue placeholder={ts("selectLanguage")} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="uk">Українська</SelectItem>
                <SelectItem value="en">English</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
