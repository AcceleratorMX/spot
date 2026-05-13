"use client";

import { useState, useEffect, useMemo } from "react";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { useSession } from "next-auth/react";
import { useTranslations } from "next-intl";
import { DragDropContext, Droppable, DropResult } from "@hello-pangea/dnd";
import { Priority } from "@prisma/client";
import { Kanban, GitGraph } from "lucide-react";
import { updateColumnOrder } from "@/app/actions/columns";
import { updateTaskOrder } from "@/app/actions/tasks";
import { ColumnView } from "./column-view";
import { CreateColumnDialog } from "./create-column-dialog";
import { InviteMemberDialog } from "./invite-member-dialog";
import { BoardSettingsDialog } from "./board-settings-dialog";
import { TaskDetailsDialog } from "./task-details-dialog";
import { DependencyGraph } from "./dependency-graph";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";

type Task = {
  id: string;
  title: string;
  description: string | null;
  priority: Priority;
  dueDate: Date | null;
  participants: {
    userId: string;
    user?: {
      id: string;
      name: string | null;
      email: string;
      image: string | null;
    };
  }[];
  subtasks: { id: string; title: string; isDone: boolean }[];
  labels: { label: { id: string; name: string; color: string } }[];
  dependencies: { precedingTaskId: string }[];
  order: number;
  columnId: string;
  userId: string | null;
  graphX: number | null;
  graphY: number | null;
};

type Column = {
  id: string;
  title: string;
  order: number;
  tasks: Task[];
};

type Member = {
  user: {
    id: string;
    name: string | null;
    email: string;
    image?: string | null;
  };
};

type Board = {
  id: string;
  title: string;
  description: string | null;
  userId: string;
  user: {
    id: string;
    name: string | null;
    email: string;
    image: string | null;
  };
  columns: Column[];
  members: Member[];
  labels: { id: string; name: string; color: string }[];
};

type BoardViewProps = {
  board: Board;
};

export function BoardView({ board }: BoardViewProps) {
  const { data: session } = useSession();
  const t = useTranslations("boards");
  const isOwner = session?.user?.id === board.userId;

  const searchParams = useSearchParams();
  const pathname = usePathname();
  const router = useRouter();
  const view = (searchParams.get("view") as "kanban" | "graph") || "kanban";

  const [columns, setColumns] = useState(board.columns);
  const [prevColumns, setPrevColumns] = useState(board.columns);
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);

  const setView = (newView: "kanban" | "graph") => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("view", newView);
    router.push(`${pathname}?${params.toString()}`);
  };

  useEffect(() => {
    const interval = setInterval(() => {
      if (document.visibilityState === "visible") {
        router.refresh();
      }
    }, 10000); // 10 seconds

    return () => clearInterval(interval);
  }, [router]);

  const selectedTask = useMemo(() => {
    if (!selectedTaskId) return null;
    return columns.flatMap((c) => c.tasks).find((t) => t.id === selectedTaskId);
  }, [selectedTaskId, columns]);

  if (board.columns !== prevColumns) {
    setColumns(board.columns);
    setPrevColumns(board.columns);
  }

  const onDragEnd = async (result: DropResult) => {
    const { destination, source, type } = result;

    if (!destination) return;

    if (
      destination.droppableId === source.droppableId &&
      destination.index === source.index
    ) {
      return;
    }

    if (type === "column") {
      const newColumns = Array.from(columns);
      const [removed] = newColumns.splice(source.index, 1);
      newColumns.splice(destination.index, 0, removed);

      setColumns(newColumns);
      await updateColumnOrder(
        board.id,
        newColumns.map((c) => c.id),
      );
      return;
    }

    const sourceCol = columns.find((c) => c.id === source.droppableId);
    const destCol = columns.find((c) => c.id === destination.droppableId);

    if (!sourceCol || !destCol) return;

    if (source.droppableId === destination.droppableId) {
      const newTasks = Array.from(sourceCol.tasks);
      const [removed] = newTasks.splice(source.index, 1);
      newTasks.splice(destination.index, 0, removed);

      const newColumns = columns.map((col) => {
        if (col.id === sourceCol.id) {
          return { ...col, tasks: newTasks };
        }
        return col;
      });

      setColumns(newColumns);

      const taskUpdates = newTasks.map((t, index) => ({
        id: t.id,
        columnId: sourceCol.id,
        order: index,
      }));

      await updateTaskOrder(board.id, taskUpdates);
    } else {
      const sourceTasks = Array.from(sourceCol.tasks);
      const [removed] = sourceTasks.splice(source.index, 1);

      const destTasks = Array.from(destCol.tasks);
      destTasks.splice(destination.index, 0, {
        ...removed,
        columnId: destCol.id,
      });

      const newColumns = columns.map((col) => {
        if (col.id === sourceCol.id) {
          return { ...col, tasks: sourceTasks };
        }
        if (col.id === destCol.id) {
          return { ...col, tasks: destTasks };
        }
        return col;
      });

      setColumns(newColumns);

      const sourceUpdates = sourceTasks.map((t, index) => ({
        id: t.id,
        columnId: sourceCol.id,
        order: index,
      }));

      const destUpdates = destTasks.map((t, index) => ({
        id: t.id,
        columnId: destCol.id,
        order: index,
      }));

      await updateTaskOrder(board.id, [...sourceUpdates, ...destUpdates]);
    }
  };

  const allMembers = Array.from(
    new Map(
      [{ user: board.user }, ...board.members].map((m) => [m.user.id, m]),
    ).values(),
  );

  return (
    <div className="h-full flex flex-col">
      <div className="flex flex-col px-6 py-4 gap-4 border-b bg-background/50 backdrop-blur-sm sticky top-0 z-10">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="space-y-1">
              <h1 className="text-2xl font-bold tracking-tight">
                {board.title}
              </h1>
              {board.description && (
                <p className="text-sm text-muted-foreground">
                  {board.description}
                </p>
              )}
            </div>
            {isOwner && <BoardSettingsDialog board={board} />}
          </div>
          
          <div className="flex items-center gap-4">
            <div className="flex items-center bg-muted/50 p-1 rounded-lg border">
              <button
                onClick={() => setView("kanban")}
                className={cn(
                  "flex items-center gap-2 px-3 py-1.5 text-sm font-medium rounded-md transition-all",
                  view === "kanban" 
                    ? "bg-background text-foreground shadow-sm" 
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                <Kanban className="h-4 w-4" />
                {t("kanban")}
              </button>
              <button
                onClick={() => setView("graph")}
                className={cn(
                  "flex items-center gap-2 px-3 py-1.5 text-sm font-medium rounded-md transition-all",
                  view === "graph" 
                    ? "bg-background text-foreground shadow-sm" 
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                <GitGraph className="h-4 w-4" />
                {t("graph")}
              </button>
            </div>

            <div className="flex -space-x-2 overflow-hidden">
              {allMembers.map((member) => (
                <Tooltip key={member.user.id}>
                  <TooltipTrigger asChild>
                    <Avatar className="inline-block h-8 w-8 rounded-full ring-2 ring-background">
                      <AvatarImage src={member.user.image || ""} />
                      <AvatarFallback className="text-xs">
                        {member.user.name?.[0] || member.user.email[0]}
                      </AvatarFallback>
                    </Avatar>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>{member.user.name || member.user.email}</p>
                  </TooltipContent>
                </Tooltip>
              ))}
            </div>
            <InviteMemberDialog boardId={board.id} />
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-hidden">
        {view === "kanban" ? (
          <DragDropContext onDragEnd={onDragEnd}>
            <Droppable
              droppableId="all-columns"
              direction="horizontal"
              type="column"
            >
              {(provided) => {
                const allTasks = columns.flatMap(c => c.tasks.map(t => ({ id: t.id, title: t.title })));
                return (
                  <div
                    {...provided.droppableProps}
                    ref={provided.innerRef}
                    className="h-full flex gap-4 p-4 overflow-x-auto overflow-y-hidden min-h-0"
                  >
                    {columns.map((column, index) => (
                      <ColumnView
                        key={column.id}
                        column={column}
                        index={index}
                        boardId={board.id}
                        members={allMembers}
                        allLabels={board.labels}
                        boardOwnerId={board.userId}
                        allTasks={allTasks}
                      />
                    ))}
                  {provided.placeholder}
                  <div className="w-80 shrink-0">
                    <CreateColumnDialog boardId={board.id} />
                  </div>
                  </div>
                );
              }}
            </Droppable>
          </DragDropContext>
        ) : (
          <DependencyGraph board={board} onTaskClick={(id) => setSelectedTaskId(id)} />
        )}
      </div>

      {selectedTask && (
        <TaskDetailsDialog
          task={selectedTask}
          boardId={board.id}
          members={allMembers}
          open={!!selectedTaskId}
          onOpenChange={(open) => !open && setSelectedTaskId(null)}
          allLabels={board.labels}
          boardOwnerId={board.userId}
          allTasks={columns.flatMap(c => c.tasks.map(t => ({ id: t.id, title: t.title })))}
        />
      )}
    </div>
  );
}
