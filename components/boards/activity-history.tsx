"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { getAuditLogs } from "@/app/actions/audit";
import { EntityType, AuditAction, Prisma } from "@prisma/client";
import { formatDistanceToNow } from "date-fns";
import { uk, enUS } from "date-fns/locale";
import { useLocale } from "next-intl";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ScrollArea } from "@/components/ui/scroll-area";
import { History } from "lucide-react";

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

interface ActivityHistoryProps {
  entityId: string;
  entityType: EntityType;
  refreshKey?: number;
}

export function ActivityHistory({ entityId, entityType, refreshKey }: ActivityHistoryProps) {
  const [logs, setLogs] = useState<AuditLogWithUser[]>([]);
  const [loading, setLoading] = useState(true);
  const t = useTranslations("boards");
  const locale = useLocale();
  const dateLocale = locale === "uk" ? uk : enUS;

  useEffect(() => {
    async function fetchLogs() {
      try {
        const data = await getAuditLogs(entityId, entityType);
        setLogs(data as AuditLogWithUser[]);
      } catch (error) {
        console.error("Failed to fetch logs:", error);
      } finally {
        setLoading(false);
      }
    }

    fetchLogs();
  }, [entityId, entityType, refreshKey]);

  const getActionText = (action: AuditAction) => {
    switch (action) {
      case AuditAction.CREATE:
        return t("create") || "created";
      case AuditAction.UPDATE:
        return t("update") || "updated";
      case AuditAction.DELETE:
        return t("delete") || "deleted";
      default:
        return action;
    }
  };

  const formatValue = (val: Prisma.JsonValue) => {
    if (val === null || val === undefined) return "---";
    if (typeof val === "string" && val.match(/^\d{4}-\d{2}-\d{2}T/)) {
      try {
        return new Date(val).toLocaleDateString(locale, {
          month: "short",
          day: "numeric",
          year: "numeric",
        });
      } catch {
        return val;
      }
    }
    return String(val);
  };

  const renderDetails = (log: AuditLogWithUser) => {
    if (log.action !== AuditAction.UPDATE) return null;

    const oldData = log.oldData as Record<string, Prisma.JsonValue> | null;
    const newData = log.newData as Record<string, Prisma.JsonValue> | null;

    if (!newData && !oldData) return null;

    // Use keys from both to find changes
    const allKeys = new Set([
      ...Object.keys(oldData || {}),
      ...Object.keys(newData || {}),
    ]);

    const changes = Array.from(allKeys).map((key) => {
      // Skip internal fields
      if (
        ["updatedAt", "userId", "id", "columnId", "order", "createdAt"].includes(
          key
        )
      )
        return null;

      const newVal = newData ? newData[key] : undefined;
      const oldVal = oldData ? oldData[key] : undefined;

      // Skip if values are same (and both exist)
      if (
        newVal !== undefined &&
        oldVal !== undefined &&
        JSON.stringify(newVal) === JSON.stringify(oldVal)
      )
        return null;

      // Handle specific cases
      if (key === "labelId") {
        const isAdded = newVal !== undefined;
        return (
          <div
            key={key}
            className="text-[11px] text-muted-foreground mt-0.5 pl-2 border-l-2 border-primary/20"
          >
            • {isAdded ? t("labelAdded") || "Label added" : t("labelRemoved") || "Label removed"}
          </div>
        );
      }

      if (key === "assigneeUserIds")
        return (
          <div
            key={key}
            className="text-[11px] text-muted-foreground mt-0.5 pl-2 border-l-2 border-primary/20"
          >
            • {t("assigneesUpdated") || "Assignees updated"}
          </div>
        );

      if (key === "subtaskAdded" || key === "subtaskRemoved" || key === "subtaskToggled") {
        return (
          <div
            key={key}
            className="text-[11px] text-muted-foreground mt-0.5 pl-2 border-l-2 border-primary/20"
          >
            • {t(key) || key}: {String(newVal || oldVal)}
          </div>
        );
      }

      if (["dependencyAdded", "prerequisiteFor", "dependencyRemoved", "prerequisiteRemoved"].includes(key)) {
        return (
          <div
            key={key}
            className="text-[11px] text-muted-foreground mt-0.5 pl-2 border-l-2 border-primary/20"
          >
            • {t(key, { title: String(newVal || oldVal) })}
          </div>
        );
      }

      // Default rendering for simple fields
      if (newVal === undefined || oldVal === undefined) {
         // This might be a partial update log where we only have newData or oldData for specific fields
         if (newVal === undefined) return null; // Don't show if no new value in a general update
      }

      return (
        <div
          key={key}
          className="text-[11px] text-muted-foreground mt-0.5 pl-2 border-l-2 border-primary/20 truncate max-w-[250px]"
        >
          • <span className="font-medium">{t(key) || key}:</span>{" "}
          {formatValue(oldVal ?? null)} → {formatValue(newVal ?? null)}
        </div>
      );
    });

    return <div className="flex flex-col gap-0.5 mt-1">{changes}</div>;
  };

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="flex items-center gap-2 font-semibold text-sm">
          <History className="h-4 w-4" />
          {t("activity") || "Activity"}
        </div>
        <div className="text-sm text-muted-foreground animate-pulse">Loading activity...</div>
      </div>
    );
  }

  if (logs.length === 0) {
    return (
      <div className="space-y-4">
        <div className="flex items-center gap-2 font-semibold text-sm">
          <History className="h-4 w-4" />
          {t("activity") || "Activity"}
        </div>
        <div className="text-sm text-muted-foreground">No recent activity.</div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 font-semibold text-sm">
        <History className="h-4 w-4" />
        {t("activity") || "Activity"}
      </div>
      <ScrollArea className="h-[250px] pr-4">
        <div className="space-y-4">
          {logs.map((log) => (
            <div key={log.id} className="flex gap-3 text-sm">
              <Avatar className="h-8 w-8">
                <AvatarImage src={log.user?.image || ""} />
                <AvatarFallback>
                  {log.user?.name?.[0] || log.user?.email[0].toUpperCase() || "?"}
                </AvatarFallback>
              </Avatar>
              <div className="flex flex-col flex-1 min-w-0">
                <div className="flex items-center gap-1 flex-wrap">
                  <span className="font-semibold">{log.user?.name || log.user?.email}</span>
                  <span className="text-muted-foreground">
                    {getActionText(log.action)}
                  </span>
                  <span className="text-muted-foreground">
                    {t(log.entityType.toLowerCase()) || log.entityType.toLowerCase()}
                  </span>
                </div>
                {log.entityTitle && (
                  <div className="text-[12px] font-medium text-foreground/80 mt-0.5">
                    &quot;{log.entityTitle}&quot;
                  </div>
                )}
                {renderDetails(log)}
                <span className="text-[10px] text-muted-foreground mt-1">
                  {formatDistanceToNow(new Date(log.createdAt), {
                    addSuffix: true,
                    locale: dateLocale,
                  })}
                </span>
              </div>
            </div>
          ))}
        </div>
      </ScrollArea>
    </div>
  );
}
