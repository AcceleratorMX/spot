"use client";

import { useTranslations, useLocale } from "next-intl";
import { Prisma, AuditAction, EntityType } from "@prisma/client";
import { formatDistanceToNow } from "date-fns";
import { uk, enUS } from "date-fns/locale";
import { ScrollArea } from "@/components/ui/scroll-area";
import { History, Plus, Pencil, Trash2, Box, Layout, CheckSquare, Tag, Link2, ExternalLink } from "lucide-react";
import { Link } from "@/i18n/navigation";

type AuditLogWithUser = Prisma.AuditLogGetPayload<{
  include: {
    user: {
      select: {
        name: true;
        email: true;
        image: true;
      };
    };
  };
}>;

interface RecentActivityProps {
  logs: AuditLogWithUser[];
}

export function RecentActivity({ logs }: RecentActivityProps) {
  const t = useTranslations("dashboard");
  const bt = useTranslations("boards");
  const locale = useLocale();
  const dateLocale = locale === "uk" ? uk : enUS;

  const getActionIcon = (action: AuditAction) => {
    switch (action) {
      case AuditAction.CREATE:
        return <Plus className="h-3 w-3 text-green-500" />;
      case AuditAction.UPDATE:
        return <Pencil className="h-3 w-3 text-blue-500" />;
      case AuditAction.DELETE:
        return <Trash2 className="h-3 w-3 text-red-500" />;
      default:
        return null;
    }
  };

  const getEntityIcon = (type: EntityType) => {
    switch (type) {
      case EntityType.BOARD:
        return <Layout className="h-3 w-3" />;
      case EntityType.COLUMN:
        return <Box className="h-3 w-3" />;
      case EntityType.TASK:
        return <CheckSquare className="h-3 w-3" />;
      case EntityType.SUBTASK:
        return <CheckSquare className="h-3 w-3 opacity-70" />;
      case EntityType.LABEL:
        return <Tag className="h-3 w-3" />;
      case EntityType.DEPENDENCY:
        return <Link2 className="h-3 w-3" />;
      default:
        return null;
    }
  };

  const getActionText = (action: AuditAction) => {
    switch (action) {
      case AuditAction.CREATE:
        return bt("create") || "created";
      case AuditAction.UPDATE:
        return bt("update") || "updated";
      case AuditAction.DELETE:
        return bt("delete") || "deleted";
      default:
        return action;
    }
  };

  const getEntityLink = (log: AuditLogWithUser) => {
    if (log.action === AuditAction.DELETE) return null;
    
    if (log.boardId) {
      if (log.entityType === EntityType.TASK) {
        return `/boards/${log.boardId}?taskId=${log.entityId}`;
      }
      return `/boards/${log.boardId}`;
    }
    
    return null;
  };

  if (logs.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-[300px] text-muted-foreground">
        <History className="h-8 w-8 mb-2 opacity-20" />
        <p>{t("noActivity")}</p>
      </div>
    );
  }

  return (
    <ScrollArea className="h-[400px] pr-4">
      <div className="space-y-6">
        {logs.map((log) => {
          const href = getEntityLink(log);
          const content = (
            <div className="flex flex-col gap-1.5">
              {/* Action line: User + action + entity type */}
              <div className="flex items-center flex-wrap gap-2 text-sm">
                <span className="font-semibold text-foreground">
                  {log.user?.name || log.user?.email}
                </span>
                <span className="text-muted-foreground">
                  {getActionText(log.action)}
                </span>
                <span className="flex items-center gap-1 font-medium text-foreground bg-secondary/50 px-2 py-0.5 rounded text-[11px]">
                  {getEntityIcon(log.entityType)}
                  {bt(log.entityType.toLowerCase()) || log.entityType.toLowerCase()}
                </span>
              </div>

              {/* Entity title — what was changed */}
              {log.entityTitle && (
                <div className="flex items-center gap-1.5 text-sm font-bold text-primary group-hover:underline transition-all">
                  <span>&quot;{log.entityTitle}&quot;</span>
                  {href && (
                    <ExternalLink className="h-3 w-3 opacity-60" />
                  )}
                </div>
              )}

              {/* Board context — on which board */}
              {log.boardTitle && log.entityType !== "BOARD" && (
                <div className="text-xs text-muted-foreground flex items-center gap-1">
                  <span>{t("onBoard")}</span>
                  <span className="font-semibold text-foreground/80 underline decoration-muted-foreground/30 underline-offset-2">
                    {log.boardTitle}
                  </span>
                </div>
              )}

              {/* Timestamp */}
              <div className="text-[10px] text-muted-foreground mt-0.5 font-medium">
                {formatDistanceToNow(new Date(log.createdAt), {
                  addSuffix: true,
                  locale: dateLocale,
                })}
              </div>
            </div>
          );

          return (
            <div key={log.id} className="relative pl-6 pb-6 last:pb-0 group">
              {/* Timeline line */}
              <div className="absolute left-[11px] top-2 bottom-0 w-[2px] bg-muted group-hover:bg-primary/20 transition-colors last:hidden" />
              
              {/* Action Icon */}
              <div className="absolute left-0 top-1 flex h-6 w-6 items-center justify-center rounded-full border bg-background shadow-sm z-10 group-hover:border-primary/50 group-hover:scale-110 transition-all">
                {getActionIcon(log.action)}
              </div>

              {href ? (
                <Link 
                  href={href} 
                  className="block rounded-xl px-4 py-3 -mx-2 hover:bg-primary/5 hover:shadow-sm border border-transparent hover:border-primary/10 transition-all cursor-pointer"
                >
                  {content}
                </Link>
              ) : (
                <div className="px-4 py-3 -mx-2">
                  {content}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </ScrollArea>
  );
}
