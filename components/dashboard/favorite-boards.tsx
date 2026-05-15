"use client";

import { useTranslations } from "next-intl";
import { Prisma } from "@prisma/client";
import { Card, CardContent } from "@/components/ui/card";
import { Star, Layout, ChevronRight } from "lucide-react";
import { Link } from "@/i18n/navigation";

type BoardWithCount = Prisma.BoardGetPayload<{
  include: {
    _count: {
      select: { columns: true };
    };
  };
}>;

interface FavoriteBoardsProps {
  boards: BoardWithCount[];
}

export function FavoriteBoards({ boards }: FavoriteBoardsProps) {
  const t = useTranslations("dashboard");

  if (boards.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-[200px] text-muted-foreground border border-dashed rounded-lg">
        <Star className="h-8 w-8 mb-2 opacity-20" />
        <p className="text-sm">{t("noFavoriteBoards")}</p>
      </div>
    );
  }

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-1">
      {boards.map((board) => (
        <Link key={board.id} href={`/boards/${board.id}`}>
          <Card className="hover:bg-accent/50 transition-colors cursor-pointer group">
            <CardContent className="p-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
                  <Layout className="h-5 w-5" />
                </div>
                <div>
                  <h4 className="font-semibold text-sm group-hover:text-primary transition-colors">
                    {board.title}
                  </h4>
                  <p className="text-xs text-muted-foreground">
                    {board._count.columns} {t("stats.totalBoards").toLowerCase()}
                  </p>
                </div>
              </div>
              <ChevronRight className="h-4 w-4 text-muted-foreground group-hover:translate-x-1 transition-transform" />
            </CardContent>
          </Card>
        </Link>
      ))}
    </div>
  );
}
