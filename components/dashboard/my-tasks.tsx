"use client";

import { useTranslations, useLocale } from "next-intl";
import { Prisma, Priority } from "@prisma/client";
import { Badge } from "@/components/ui/badge";
import { Calendar, CheckCircle2, Circle, Clock } from "lucide-react";
import { format } from "date-fns";
import { uk, enUS } from "date-fns/locale";
import { Link } from "@/i18n/navigation";

type TaskWithContext = Prisma.TaskGetPayload<{
  include: {
    column: {
      include: {
        board: true;
      };
    };
  };
}>;

interface MyTasksProps {
  tasks: TaskWithContext[];
}

export function MyTasks({ tasks }: MyTasksProps) {
  const t = useTranslations("dashboard");
  const bt = useTranslations("boards");
  const locale = useLocale();
  const dateLocale = locale === "uk" ? uk : enUS;

  const getPriorityColor = (priority: Priority) => {
    switch (priority) {
      case Priority.URGENT:
        return "bg-red-500/10 text-red-500 border-red-500/20";
      case Priority.HIGH:
        return "bg-orange-500/10 text-orange-500 border-orange-500/20";
      case Priority.MEDIUM:
        return "bg-blue-500/10 text-blue-500 border-blue-500/20";
      case Priority.LOW:
        return "bg-slate-500/10 text-slate-500 border-slate-500/20";
      default:
        return "";
    }
  };

  if (tasks.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-[200px] text-muted-foreground border border-dashed rounded-lg">
        <CheckCircle2 className="h-8 w-8 mb-2 opacity-20" />
        <p className="text-sm">{t("noTasks")}</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {tasks.map((task) => (
        <Link key={task.id} href={`/boards/${task.column.boardId}`} className="block">
          <div
            className="flex items-start gap-4 p-4 rounded-lg border bg-card hover:bg-accent/50 transition-colors"
          >
            <div className="mt-1">
              {task.column.title.toLowerCase().includes("done") || 
               task.column.title.toLowerCase().includes("готово") ? (
                <CheckCircle2 className="h-5 w-5 text-green-500" />
              ) : (
                <Circle className="h-5 w-5 text-muted-foreground" />
              )}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between gap-2">
                <h4 className="font-semibold text-sm truncate">{task.title}</h4>
                <Badge variant="outline" className={getPriorityColor(task.priority)}>
                  {bt(task.priority.toLowerCase())}
                </Badge>
              </div>
              <div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground">
                <span className="flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  {task.column.board.title} / {task.column.title}
                </span>
                {task.dueDate && (
                  <span className="flex items-center gap-1">
                    <Calendar className="h-3 w-3" />
                    {format(new Date(task.dueDate), "MMM d", { locale: dateLocale })}
                  </span>
                )}
              </div>
            </div>
          </div>
        </Link>
      ))}
    </div>
  );
}
