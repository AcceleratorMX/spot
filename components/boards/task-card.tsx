"use client";

import { useState } from "react";
import { Draggable } from "@hello-pangea/dnd";
import { Priority } from "@prisma/client";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { TaskDetailsDialog } from "./task-details-dialog";
import { useTranslations } from "next-intl";

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
  order: number;
  columnId: string;
};

type Member = {
  user: {
    id: string;
    name: string | null;
    email: string;
    image?: string | null;
  };
};

type TaskCardProps = {
  task: Task;
  index: number;
  boardId: string;
  members: Member[];
  allLabels: { id: string; name: string; color: string }[];
};

export function TaskCard({ task, index, boardId, members, allLabels }: TaskCardProps) {
  const [showDetails, setShowDetails] = useState(false);
  const t = useTranslations("boards");

  const priorityColors = {
    LOW: "bg-blue-500/10 text-blue-500 hover:bg-blue-500/20",
    MEDIUM: "bg-green-500/10 text-green-500 hover:bg-green-500/20",
    HIGH: "bg-orange-500/10 text-orange-500 hover:bg-orange-500/20",
    URGENT: "bg-destructive/10 text-destructive hover:bg-destructive/20",
  };

  return (
    <>
      <Draggable draggableId={task.id} index={index}>
        {(provided, snapshot) => (
          <div
            {...provided.draggableProps}
            {...provided.dragHandleProps}
            ref={provided.innerRef}
            onClick={() => setShowDetails(true)}
            className={`transition-shadow ${
              snapshot.isDragging ? "shadow-lg" : ""
            }`}
          >
            <Card className="bg-background border-muted-foreground/20 hover:border-primary/50 transition-colors cursor-pointer">
              <CardContent className="p-3 space-y-3">
                <div className="flex flex-wrap gap-1 mb-2">
                  {task.labels.map((l) => (
                    <div
                      key={l.label.id}
                      className="h-1.5 w-6 rounded-full"
                      style={{ backgroundColor: l.label.color }}
                      title={l.label.name}
                    />
                  ))}
                </div>
                <div className="flex items-start justify-between gap-2">
                  <p className="text-sm font-medium leading-tight">{task.title}</p>
                  <Badge variant="secondary" className={`text-[10px] px-1.5 py-0 h-4 uppercase ${priorityColors[task.priority]}`}>
                    {t(task.priority.toLowerCase())}
                  </Badge>
                </div>
                
                {(task.description || task.participants.length > 0 || task.dueDate || task.subtasks.length > 0) && (
                  <div className="flex items-center justify-between mt-2">
                    <div className="flex items-center gap-2">
                      <div className="flex -space-x-2 overflow-hidden">
                        {task.participants.map((assignee) => (
                          <Avatar key={assignee.userId} className="h-5 w-5 ring-1 ring-background">
                            <AvatarImage src={assignee.user?.image || ""} />
                            <AvatarFallback className="text-[8px]">
                              {assignee.user?.name?.[0] || assignee.user?.email[0] || "?"}
                            </AvatarFallback>
                          </Avatar>
                        ))}
                      </div>
                      {task.subtasks.length > 0 && (
                        <div className="flex items-center gap-1 text-[10px] text-muted-foreground bg-muted px-1.5 py-0.5 rounded">
                          <span className={task.subtasks.every(s => s.isDone) ? "text-green-500 font-bold" : ""}>
                            {task.subtasks.filter(s => s.isDone).length}/{task.subtasks.length}
                          </span>
                        </div>
                      )}
                      {task.dueDate && (
                        <span className="text-[10px] text-muted-foreground bg-muted px-1.5 py-0.5 rounded ml-1">
                          {new Date(task.dueDate).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                        </span>
                      )}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        )}
      </Draggable>

      <TaskDetailsDialog
        task={task}
        boardId={boardId}
        members={members}
        open={showDetails}
        onOpenChange={setShowDetails}
        allLabels={allLabels}
      />
    </>
  );
}
