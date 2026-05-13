"use client";

import { useState } from "react";
import Link from "next/link";
import { useLocale, useTranslations } from "next-intl";
import { Kanban, MoreVertical, Trash2, Settings } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { uk, enUS } from "date-fns/locale";
import {
  deleteBoard,
  type BoardSummaryWithRelations,
} from "@/app/actions/boards";
import { BoardSettingsDialog } from "./board-settings-dialog";
import { useSession } from "next-auth/react";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

import { Card, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";

type BoardCardProps = {
  board: BoardSummaryWithRelations;
};

export function BoardCard({ board }: BoardCardProps) {
  const locale = useLocale();
  const t = useTranslations("boards");
  const dateLocale = locale === "uk" ? uk : enUS;

  const [showSettings, setShowSettings] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const { data: session } = useSession();
  
  const isOwner = session?.user?.id === board.userId;

  // Combine owner and members, deduplicate by user ID
  const allParticipants = [
    { user: board.user },
    ...board.members
  ].filter((v, i, a) => a.findIndex(t => t.user.id === v.user.id) === i);

  const handleDelete = async () => {
    await deleteBoard(board.id);
    setShowDeleteConfirm(false);
  };

  return (
    <Card className="group relative overflow-hidden transition-all hover:shadow-md">
      <Link
        href={`/${locale}/boards/${board.id}`}
        className="absolute inset-0 z-0"
      />
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <div className="space-y-1">
          <CardTitle className="line-clamp-1 text-lg font-bold">
            {board.title}
          </CardTitle>
          {board.description && (
            <p className="line-clamp-2 text-xs text-muted-foreground">
              {board.description}
            </p>
          )}
        </div>
        <div className="relative z-10 flex items-center gap-2">
          {isOwner && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="h-8 w-8"
                  onClick={(e) => {
                    e.stopPropagation();
                    e.preventDefault();
                  }}
                >
                  <MoreVertical className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => setShowSettings(true)}>
                  <Settings className="mr-2 h-4 w-4" />
                  <span>{t("boardSettings")}</span>
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => setShowDeleteConfirm(true)}
                  className="text-destructive focus:bg-destructive/10 focus:text-destructive"
                >
                  <Trash2 className="mr-2 h-4 w-4" />
                  <span>Delete</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>
      </CardHeader>

      <BoardSettingsDialog
        board={board}
        open={showSettings}
        onOpenChange={setShowSettings}
      />
      
      <ConfirmDialog
        open={showDeleteConfirm}
        onOpenChange={setShowDeleteConfirm}
        title={t("deleteBoard") || "Delete Board"}
        description={t("deleteConfirm")}
        onConfirm={handleDelete}
        variant="destructive"
      />
      
      <CardFooter className="flex flex-col items-start gap-4 text-xs text-muted-foreground">
        <div className="relative z-10 flex -space-x-2 overflow-hidden">
          {allParticipants.map((participant) => (
            <Tooltip key={participant.user.id}>
              <TooltipTrigger asChild>
                <Avatar className="h-8 w-8 border-2 border-background ring-0">
                  <AvatarImage src={participant.user.image || ""} />
                  <AvatarFallback className="text-xs">
                    {participant.user.name?.[0] || participant.user.email[0]}
                  </AvatarFallback>
                </Avatar>
              </TooltipTrigger>
              <TooltipContent>
                <p>{participant.user.name || participant.user.email}</p>
              </TooltipContent>
            </Tooltip>
          ))}
        </div>

        <div className="flex items-center gap-2">
          <Kanban className="h-3 w-3" />
          <span>
            {t("lastUpdated")}{" "}
            {formatDistanceToNow(board.updatedAt, {
              addSuffix: true,
              locale: dateLocale,
            })}
          </span>
        </div>
      </CardFooter>
    </Card>
  );
}
