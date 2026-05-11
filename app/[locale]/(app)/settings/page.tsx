import { useTranslations } from "next-intl";
import { Settings } from "lucide-react";
import { SettingsForm } from "@/components/settings-form";

export default function SettingsPage() {
  const tNav = useTranslations("nav");
  const tSettings = useTranslations("settings");

  return (
    <div className="container mx-auto max-w-4xl space-y-8 py-10">
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
          <Settings className="h-5 w-5" />
        </div>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            {tNav("settings")}
          </h1>
          <p className="text-muted-foreground">{tSettings("subtitle")}</p>
        </div>
      </div>

      <SettingsForm />
    </div>
  );
}
