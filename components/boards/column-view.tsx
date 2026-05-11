"use client";

import { Droppable, Draggable } from "@hello-pangea/dnd";
import { Priority } from "@prisma/client";
import { TaskCard } from "./task-card";
import { CreateTaskDialog } from "./create-task-dialog";
import { ColumnMenu } from "./column-menu";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";

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

type ColumnViewProps = {
  column: Column;
  index: number;
  boardId: string;
  members: Member[];
  allLabels: { id: string; name: string; color: string }[];
};

export function ColumnView({ column, index, boardId, members, allLabels }: ColumnViewProps) {
  return (
    <Draggable draggableId={column.id} index={index}>
      {(provided) => (
        <div
          {...provided.draggableProps}
          ref={provided.innerRef}
          className="w-80 shrink-0 h-full flex flex-col"
        >
          <Card className="flex flex-col h-full bg-muted/50 border-none shadow-none">
            <CardHeader 
              {...provided.dragHandleProps}
              className="flex flex-row items-center justify-between p-4 space-y-0"
            >
              <CardTitle className="text-sm font-bold truncate">
                {column.title}
                <span className="ml-2 rounded-full bg-muted px-2 py-0.5 text-xs font-normal text-muted-foreground">
                  {column.tasks.length}
                </span>
              </CardTitle>
              <ColumnMenu 
                columnId={column.id} 
                columnTitle={column.title} 
                boardId={boardId} 
              />
            </CardHeader>
            <CardContent className="flex-1 flex flex-col p-2 pt-0 min-h-0">
              <Droppable droppableId={column.id} type="task">
                {(provided, snapshot) => (
                  <div
                    {...provided.droppableProps}
                    ref={provided.innerRef}
                    className={`flex-1 min-h-[50px] transition-colors rounded-md p-1 ${
                      snapshot.isDraggingOver ? "bg-muted" : ""
                    }`}
                  >
                    <div className="flex flex-col gap-2">
                      {column.tasks.map((task, taskIndex) => (
                        <TaskCard 
                          key={task.id} 
                          task={task} 
                          index={taskIndex} 
                          boardId={boardId}
                          members={members}
                          allLabels={allLabels}
                        />
                      ))}
                    </div>
                    {provided.placeholder}
                  </div>
                )}
              </Droppable>
              <CreateTaskDialog columnId={column.id} boardId={boardId} />
            </CardContent>
          </Card>
        </div>
      )}
    </Draggable>
  );
}
