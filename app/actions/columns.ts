"use server";

import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

export async function createColumn(boardId: string, title: string) {
  const session = await auth();
  if (!session?.user?.id) return { error: "Unauthorized" };

  try {
    const lastColumn = await prisma.column.findFirst({
      where: { boardId },
      orderBy: { order: "desc" },
    });

    const order = lastColumn ? lastColumn.order + 1 : 0;

    await prisma.column.create({
      data: {
        title,
        order,
        boardId,
      },
    });

    revalidatePath(`/boards/${boardId}`);
    return { success: true };
  } catch {
    return { error: "Failed to create column" };
  }
}

export async function updateColumnOrder(boardId: string, columnIds: string[]) {
  const session = await auth();
  if (!session?.user?.id) return { error: "Unauthorized" };

  try {
    const updates = columnIds.map((id, index) =>
      prisma.column.update({
        where: { id },
        data: { order: index },
      })
    );

    await prisma.$transaction(updates);
    revalidatePath(`/boards/${boardId}`);
    return { success: true };
  } catch {
    return { error: "Failed to update columns order" };
  }
}

export async function renameColumn(id: string, title: string, boardId: string) {
  const session = await auth();
  if (!session?.user?.id) return { error: "Unauthorized" };

  try {
    await prisma.column.update({
      where: { id },
      data: { title }
    });

    revalidatePath(`/boards/${boardId}`);
    return { success: true };
  } catch {
    return { error: "Failed to rename column" };
  }
}

export async function deleteColumn(id: string, boardId: string) {
  const session = await auth();
  if (!session?.user?.id) return { error: "Unauthorized" };

  try {
    const columnToDelete = await prisma.column.findUnique({
      where: { id },
      include: { tasks: true }
    });

    if (!columnToDelete) return { error: "Column not found" };

    // Find another column to move tasks to
    const otherColumn = await prisma.column.findFirst({
      where: {
        boardId,
        id: { not: id }
      },
      orderBy: { order: "asc" }
    });

    await prisma.$transaction(async (tx) => {
      if (otherColumn && columnToDelete.tasks.length > 0) {
        // Move tasks to other column
        await tx.task.updateMany({
          where: { columnId: id },
          data: { columnId: otherColumn.id }
        });
      }
      
      // Delete the column
      await tx.column.delete({
        where: { id }
      });
    });

    revalidatePath(`/boards/${boardId}`);
    return { success: true };
  } catch (error) {
    console.error("Failed to delete column:", error);
    return { error: "Failed to delete column. Maybe it's the only one?" };
  }
}
