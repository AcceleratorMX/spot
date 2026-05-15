"use server";

import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { AuditAction, EntityType } from "@prisma/client";
import { createAuditLog } from "@/lib/audit";
import { touchBoard } from "./boards";

export async function createLabel(boardId: string, name: string, color: string) {
  const session = await auth();
  if (!session?.user?.id) return { error: "Unauthorized" };

  try {
    const label = await prisma.label.create({
      data: {
        name,
        color,
        boardId,
      }
    });

    const board = await prisma.board.findUnique({ where: { id: boardId } });
    await createAuditLog({
      entityId: label.id,
      entityTitle: label.name,
      entityType: EntityType.LABEL,
      boardId,
      boardTitle: board?.title,
      action: AuditAction.CREATE,
      newData: label,
    });

    revalidatePath(`/boards/${boardId}`);
    return { success: true };
  } catch {
    return { error: "Failed to create label" };
  }
}

export async function deleteLabel(id: string, boardId: string) {
  const session = await auth();
  if (!session?.user?.id) return { error: "Unauthorized" };

  try {
    const label = await prisma.label.delete({
      where: { id }
    });

    const board = await prisma.board.findUnique({ where: { id: boardId } });
    await createAuditLog({
      entityId: label.id,
      entityTitle: label.name,
      entityType: EntityType.LABEL,
      boardId,
      boardTitle: board?.title,
      action: AuditAction.DELETE,
      oldData: label,
    });

    await touchBoard(boardId);
    revalidatePath(`/boards/${boardId}`);
    return { success: true };
  } catch {
    return { error: "Failed to delete label" };
  }
}

export async function addTaskLabel(taskId: string, labelId: string, boardId: string) {
  const session = await auth();
  if (!session?.user?.id) return { error: "Unauthorized" };

  try {
    await prisma.taskLabel.create({
      data: {
        taskId,
        labelId,
      }
    });

    const [board, task] = await Promise.all([
      prisma.board.findUnique({ where: { id: boardId } }),
      prisma.task.findUnique({ where: { id: taskId }, select: { title: true } }),
    ]);
    await createAuditLog({
      entityId: taskId,
      entityTitle: task?.title,
      entityType: EntityType.TASK,
      boardId,
      boardTitle: board?.title,
      action: AuditAction.UPDATE,
      newData: { labelId },
    });

    revalidatePath(`/boards/${boardId}`);
    return { success: true };
  } catch {
    return { error: "Failed to add label to task" };
  }
}

export async function removeTaskLabel(taskId: string, labelId: string, boardId: string) {
  const session = await auth();
  if (!session?.user?.id) return { error: "Unauthorized" };

  try {
    await prisma.taskLabel.delete({
      where: {
        taskId_labelId: {
          taskId,
          labelId,
        }
      }
    });

    const [board, task] = await Promise.all([
      prisma.board.findUnique({ where: { id: boardId } }),
      prisma.task.findUnique({ where: { id: taskId }, select: { title: true } }),
    ]);
    await createAuditLog({
      entityId: taskId,
      entityTitle: task?.title,
      entityType: EntityType.TASK,
      boardId,
      boardTitle: board?.title,
      action: AuditAction.UPDATE,
      oldData: { labelId },
    });

    revalidatePath(`/boards/${boardId}`);
    return { success: true };
  } catch {
    return { error: "Failed to remove label from task" };
  }
}
