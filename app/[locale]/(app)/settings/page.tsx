import { useTranslations } from "next-intl";
import { Settings } from "lucide-react";

export default function SettingsPage() {
  const t = useTranslations("nav");

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
          <Settings className="h-5 w-5" />
        </div>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">
            {t("settings")}
          </h1>
        </div>
      </div>
    </div>
  );
}
