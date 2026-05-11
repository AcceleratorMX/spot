"use client";

import Link from "next/link";
import { useLocale, useTranslations } from "next-intl";
import { Kanban, MoreVertical, Trash2 } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { uk, enUS } from "date-fns/locale";
import { deleteBoard } from "@/app/actions/boards";

import { Card, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";

type BoardCardProps = {
  board: {
    id: string;
    title: string;
    updatedAt: Date;
  };
};

export function BoardCard({ board }: BoardCardProps) {
  const locale = useLocale();
  const t = useTranslations("boards");
  const dateLocale = locale === "uk" ? uk : enUS;

  const handleDelete = async () => {
    if (confirm(t("deleteConfirm"))) {
      await deleteBoard(board.id);
    }
  };

  return (
    <Card className="group relative overflow-hidden transition-all hover:shadow-md">
      <Link
        href={`/${locale}/boards/${board.id}`}
        className="absolute inset-0 z-0"
      />
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="line-clamp-1 text-lg font-bold">
          {board.title}
        </CardTitle>
        <div className="z-10">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8">
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem
                onClick={handleDelete}
                className="text-destructive focus:bg-destructive/10 focus:text-destructive"
              >
                <Trash2 className="mr-2 h-4 w-4" />
                <span>Delete</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </CardHeader>
      <CardFooter className="flex items-center gap-2 text-xs text-muted-foreground">
        <Kanban className="h-3 w-3" />
        <span>
          {t("lastUpdated")}{" "}
          {formatDistanceToNow(board.updatedAt, {
            addSuffix: true,
            locale: dateLocale,
          })}
        </span>
      </CardFooter>
    </Card>
  );
}
