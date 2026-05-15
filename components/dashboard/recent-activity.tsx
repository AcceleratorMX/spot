"use client";

import { useTranslations, useLocale } from "next-intl";
import { Prisma, AuditAction, EntityType } from "@prisma/client";
import { formatDistanceToNow } from "date-fns";
import { uk, enUS } from "date-fns/locale";
import { ScrollArea } from "@/components/ui/scroll-area";
import { History, Plus, Pencil, Trash2, Box, Layout, CheckSquare, Tag, Link2 } from "lucide-react";
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
}> & { boardId?: string | null };

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
        return bt("created") || "created";
      case AuditAction.UPDATE:
        return bt("updated") || "updated";
      case AuditAction.DELETE:
        return bt("deleted") || "deleted";
      default:
        return action;
    }
  };

  const getEntityLink = (log: AuditLogWithUser) => {
    if (log.action === AuditAction.DELETE) return null;
    
    // We enriched the log with boardId in the server action
    if (log.boardId) {
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
            <div className="flex flex-col gap-1">
              <div className="flex items-center gap-2 text-sm">
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
              
              {log.entityTitle && (
                <div className="text-sm font-medium text-foreground/80 mt-0.5 group-hover:text-primary transition-colors">
                  &quot;{log.entityTitle}&quot;
                </div>
              )}

              <div className="text-[10px] text-muted-foreground mt-1">
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
              <div className="absolute left-[11px] top-2 bottom-0 w-[2px] bg-muted last:hidden" />
              
              {/* Action Icon */}
              <div className="absolute left-0 top-1 flex h-6 w-6 items-center justify-center rounded-full border bg-background shadow-sm z-10">
                {getActionIcon(log.action)}
              </div>

              {href ? (
                <Link href={href}>
                  {content}
                </Link>
              ) : (
                content
              )}
            </div>
          );
        })}
      </div>
    </ScrollArea>
  );
}
