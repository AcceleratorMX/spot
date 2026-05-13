import { useTranslations } from "next-intl";
import { LayoutDashboard } from "lucide-react";
import { CreateBoardDialog } from "@/components/boards/create-board-dialog";

export default function DashboardPage() {
  const t = useTranslations("dashboard");

  return (
    <div className="flex-1 overflow-auto p-6">
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <LayoutDashboard className="h-5 w-5" />
            </div>
            <div>
              <h1 className="text-2xl font-bold tracking-tight">
                {t("heading")}
              </h1>
              <p className="text-muted-foreground">{t("subtitle")}</p>
            </div>
          </div>
          <CreateBoardDialog />
        </div>

        <div className="flex flex-col items-center justify-center rounded-lg border border-dashed p-12 text-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-muted">
            <LayoutDashboard className="h-8 w-8 text-muted-foreground" />
          </div>
          <h3 className="mt-4 text-lg font-semibold">{t("noBoards")}</h3>
          <p className="mt-1 text-sm text-muted-foreground">
            {t("createFirst")}
          </p>
          <div className="mt-6">
            <CreateBoardDialog />
          </div>
        </div>
      </div>
    </div>
  );
}
