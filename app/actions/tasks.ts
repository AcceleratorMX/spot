"use server";

import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { Priority, AuditAction, EntityType } from "@prisma/client";
import { createAuditLog } from "@/lib/audit";
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

    const task = await prisma.task.create({
      data: {
        title,
        order,
        columnId,
        userId: session.user.id,
      },
    });

    await createAuditLog({
      entityId: task.id,
      entityTitle: task.title,
      entityType: EntityType.TASK,
      action: AuditAction.CREATE,
      newData: task,
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

  try {
    const existingTask = await prisma.task.findUnique({
      where: { id },
      include: { 
        participants: true,
        labels: true
      }
    });

    if (!existingTask) return { error: "Task not found" };

    const board = await prisma.board.findUnique({
      where: { id: boardId },
      select: { userId: true }
    });

    // Permission check: creator or board owner
    const isCreator = existingTask.userId === session.user.id;
    const isBoardOwner = board?.userId === session.user.id;

    if (!isCreator && !isBoardOwner) {
      return { error: "Forbidden" };
    }

    const { assigneeUserIds, ...rest } = data;

    await prisma.$transaction(async (tx) => {
      // Update task basic fields
      const task = await tx.task.update({
        where: { id },
        data: rest
      });

      await createAuditLog({
        entityId: task.id,
        entityTitle: task.title,
        entityType: EntityType.TASK,
        action: AuditAction.UPDATE,
        oldData: existingTask,
        newData: data,
      });

      // Update assignees if provided
      if (assigneeUserIds) {
        await tx.taskAssignee.deleteMany({
          where: { taskId: id }
        });

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
    const existingTask = await prisma.task.findUnique({
      where: { id }
    });

    if (!existingTask) return { error: "Task not found" };

    const board = await prisma.board.findUnique({
      where: { id: boardId },
      select: { userId: true }
    });

    // Permission check: creator or board owner
    const isCreator = existingTask.userId === session.user.id;
    const isBoardOwner = board?.userId === session.user.id;

    if (!isCreator && !isBoardOwner) {
      return { error: "Forbidden" };
    }

    const task = await prisma.task.delete({
      where: { id }
    });

    await createAuditLog({
      entityId: task.id,
      entityTitle: task.title,
      entityType: EntityType.TASK,
      action: AuditAction.DELETE,
      oldData: task,
    });

    revalidatePath(`/boards/${boardId}`);
    return { success: true };
  } catch (error) {
    console.error("Failed to delete task:", error);
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
    const subtask = await prisma.subtask.create({
      data: {
        title,
        taskId,
      }
    });

    await createAuditLog({
      entityId: taskId,
      entityType: EntityType.TASK,
      action: AuditAction.UPDATE,
      newData: { subtask: title }
    });

    revalidatePath(`/boards/${boardId}`);
    return { success: true };
  } catch (error) {
    console.error("Failed to create subtask:", error);
    return { error: "Failed to create subtask" };
  }
}

export async function toggleSubtask(id: string, isDone: boolean, boardId: string) {
  const session = await auth();
  if (!session?.user?.id) return { error: "Unauthorized" };

  try {
    const subtask = await prisma.subtask.update({
      where: { id },
      data: { isDone }
    });

    await createAuditLog({
      entityId: subtask.taskId,
      entityType: EntityType.TASK,
      action: AuditAction.UPDATE,
      newData: { subtask: `${subtask.title} (${isDone ? "done" : "todo"})` }
    });

    await touchBoard(boardId);
    revalidatePath(`/boards/${boardId}`);
    return { success: true };
  } catch (error) {
    console.error("Failed to toggle subtask:", error);
    return { error: "Failed to toggle subtask" };
  }
}

export async function deleteSubtask(id: string, boardId: string) {
  const session = await auth();
  if (!session?.user?.id) return { error: "Unauthorized" };

  try {
    const subtask = await prisma.subtask.delete({
      where: { id }
    });

    await createAuditLog({
      entityId: subtask.taskId,
      entityType: EntityType.TASK,
      action: AuditAction.UPDATE,
      oldData: { subtask: subtask.title }
    });

    revalidatePath(`/boards/${boardId}`);
    return { success: true };
  } catch (error) {
    console.error("Failed to delete subtask:", error);
    return { error: "Failed to delete subtask" };
  }
}
