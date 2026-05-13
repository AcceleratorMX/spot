"use server";

import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

export async function createLabel(boardId: string, name: string, color: string) {
  const session = await auth();
  if (!session?.user?.id) return { error: "Unauthorized" };

  try {
    await prisma.label.create({
      data: {
        name,
        color,
        boardId,
      }
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
    await prisma.label.delete({
      where: { id }
    });

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

    revalidatePath(`/boards/${boardId}`);
    return { success: true };
  } catch {
    return { error: "Failed to remove label from task" };
  }
}
