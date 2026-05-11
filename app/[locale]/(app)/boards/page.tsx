import { getTranslations } from "next-intl/server";
import { Kanban } from "lucide-react";
import { getBoards } from "@/app/actions/boards";
import { CreateBoardDialog } from "@/components/boards/create-board-dialog";
import { BoardCard } from "@/components/boards/board-card";

export default async function BoardsPage() {
  const t = await getTranslations("boards");
  const boards = await getBoards();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
            <Kanban className="h-5 w-5" />
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

      {boards.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-lg border border-dashed p-12 text-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-muted">
            <Kanban className="h-8 w-8 text-muted-foreground" />
          </div>
          <h3 className="mt-4 text-lg font-semibold">{t("noBoards")}</h3>
          <p className="mt-1 text-sm text-muted-foreground">
            {t("createFirst")}
          </p>
          <div className="mt-6">
            <CreateBoardDialog />
          </div>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {boards.map((board) => (
            <BoardCard key={board.id} board={board} />
          ))}
        </div>
      )}
    </div>
  );
}
