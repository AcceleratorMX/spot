"use client";

import { useState } from "react";
import { DragDropContext, Droppable, DropResult } from "@hello-pangea/dnd";
import { Priority } from "@prisma/client";
import { updateColumnOrder } from "@/app/actions/columns";
import { updateTaskOrder } from "@/app/actions/tasks";
import { ColumnView } from "./column-view";
import { CreateColumnDialog } from "./create-column-dialog";
import { InviteMemberDialog } from "./invite-member-dialog";
import { BoardSettingsDialog } from "./board-settings-dialog";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

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

type Board = {
  id: string;
  title: string;
  description: string | null;
  columns: Column[];
  members: Member[];
  labels: { id: string; name: string; color: string }[];
};

type BoardViewProps = {
  board: Board;
};

export function BoardView({ board }: BoardViewProps) {
  const [columns, setColumns] = useState(board.columns);
  const [prevColumns, setPrevColumns] = useState(board.columns);

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
      await updateColumnOrder(board.id, newColumns.map((c) => c.id));
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
    } 
    else {
      const sourceTasks = Array.from(sourceCol.tasks);
      const [removed] = sourceTasks.splice(source.index, 1);
      
      const destTasks = Array.from(destCol.tasks);
      destTasks.splice(destination.index, 0, { ...removed, columnId: destCol.id });

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

  return (
    <div className="h-full flex flex-col">
      <div className="flex flex-col px-6 py-4 gap-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="space-y-1">
              <h1 className="text-2xl font-bold tracking-tight">{board.title}</h1>
              {board.description && (
                <p className="text-sm text-muted-foreground">
                  {board.description}
                </p>
              )}
            </div>
            <BoardSettingsDialog board={board} />
          </div>
          <div className="flex items-center gap-4">
            <div className="flex -space-x-2 overflow-hidden">
              {board.members.map((member) => (
                <Avatar key={member.user.id} className="inline-block h-8 w-8 rounded-full ring-2 ring-background">
                  <AvatarImage src={member.user.image || ""} />
                  <AvatarFallback className="text-xs">
                    {member.user.name?.[0] || member.user.email[0]}
                  </AvatarFallback>
                </Avatar>
              ))}
            </div>
            <InviteMemberDialog boardId={board.id} />
          </div>
        </div>
      </div>

      <DragDropContext onDragEnd={onDragEnd}>
        <Droppable droppableId="all-columns" direction="horizontal" type="column">
          {(provided) => (
            <div
              {...provided.droppableProps}
              ref={provided.innerRef}
              className="flex-1 flex gap-4 p-4 overflow-x-auto overflow-y-hidden min-h-0"
            >
              {columns.map((column, index) => (
                <ColumnView 
                  key={column.id} 
                  column={column} 
                  index={index} 
                  boardId={board.id}
                  members={board.members}
                  allLabels={board.labels}
                />
              ))}
              {provided.placeholder}
              <div className="w-80 shrink-0">
                <CreateColumnDialog boardId={board.id} />
              </div>
            </div>
          )}
        </Droppable>
      </DragDropContext>
    </div>
  );
}
