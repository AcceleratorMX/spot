"use server";

import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { Priority } from "@prisma/client";
import { touchBoard } from "./boards";

export async function createTask(columnId: string, title: string, boardId: string) {
  const session = await auth();
  if (!session?.user?.id) return { error: "Unauthorized" };

  try {
    const lastTask = await prisma.task.findFirst({
      where: { columnId },
      orderBy: { order: "desc" },
    });

    const order = lastTask ? lastTask.order + 1 : 0;

    await prisma.task.create({
      data: {
        title,
        order,
        columnId,
        userId: session.user.id,
      },
    });

    revalidatePath(`/boards/${boardId}`);
    return { success: true };
  } catch {
    return { error: "Failed to create task" };
  }
}

export async function updateTask(
  id: string, 
  boardId: string,
  data: {
    title?: string;
    description?: string;
    priority?: Priority;
    dueDate?: Date | null;
    assigneeUserIds?: string[];
  }
) {
  const session = await auth();
  if (!session?.user?.id) return { error: "Unauthorized" };

  const { assigneeUserIds, ...rest } = data;

  try {
    await prisma.$transaction(async (tx) => {
      // Update task basic fields
      await tx.task.update({
        where: { id },
        data: rest
      });

      // Update assignees if provided
      if (assigneeUserIds) {
        // Remove old assignees
        await tx.taskAssignee.deleteMany({
          where: { taskId: id }
        });

        // Add new assignees
        if (assigneeUserIds.length > 0) {
          await tx.taskAssignee.createMany({
            data: assigneeUserIds.map(userId => ({
              taskId: id,
              userId
            }))
          });
        }
      }
    });

    revalidatePath(`/boards/${boardId}`);
    return { success: true };
  } catch (error) {
    console.error("Failed to update task:", error);
    return { error: "Failed to update task" };
  }
}

export async function deleteTask(id: string, boardId: string) {
  const session = await auth();
  if (!session?.user?.id) return { error: "Unauthorized" };

  try {
    await prisma.task.delete({
      where: { id }
    });

    revalidatePath(`/boards/${boardId}`);
    return { success: true };
  } catch {
    return { error: "Failed to delete task" };
  }
}

export async function updateTaskOrder(
  boardId: string,
  updates: { id: string; columnId: string; order: number }[]
) {
  const session = await auth();
  if (!session?.user?.id) return { error: "Unauthorized" };

  try {
    const prismaUpdates = updates.map((u) =>
      prisma.task.update({
        where: { id: u.id },
        data: { columnId: u.columnId, order: u.order },
      })
    );

    await prisma.$transaction(prismaUpdates);
    await touchBoard(boardId);
    revalidatePath(`/boards/${boardId}`);
    return { success: true };
  } catch {
    return { error: "Failed to update tasks order" };
  }
}

export async function createSubtask(taskId: string, title: string, boardId: string) {
  const session = await auth();
  if (!session?.user?.id) return { error: "Unauthorized" };

  try {
    await prisma.subtask.create({
      data: {
        title,
        taskId,
      }
    });

    revalidatePath(`/boards/${boardId}`);
    return { success: true };
  } catch {
    return { error: "Failed to create subtask" };
  }
}

export async function toggleSubtask(id: string, isDone: boolean, boardId: string) {
  const session = await auth();
  if (!session?.user?.id) return { error: "Unauthorized" };

  try {
    await prisma.subtask.update({
      where: { id },
      data: { isDone }
    });

    await touchBoard(boardId);
    revalidatePath(`/boards/${boardId}`);
    return { success: true };
  } catch {
    return { error: "Failed to toggle subtask" };
  }
}

export async function deleteSubtask(id: string, boardId: string) {
  const session = await auth();
  if (!session?.user?.id) return { error: "Unauthorized" };

  try {
    await prisma.subtask.delete({
      where: { id }
    });

    revalidatePath(`/boards/${boardId}`);
    return { success: true };
  } catch {
    return { error: "Failed to delete subtask" };
  }
}
