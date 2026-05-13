"use server";

import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { boardSchema } from "@/lib/validations/board";
import { revalidatePath } from "next/cache";
import { Prisma } from "@prisma/client";

const boardInclude = {
  user: true,
  members: {
    include: {
      user: true
    }
  },
  columns: {
    include: {
      tasks: {
        include: {
          participants: {
            include: {
              user: true
            }
          },
          subtasks: {
            orderBy: {
              order: "asc"
            }
          },
          labels: {
            include: {
              label: true
            }
          }
        }
      }
    }
  },
  labels: true
} satisfies Prisma.BoardInclude;

const boardSummaryInclude = {
  user: true,
  members: {
    include: {
      user: true
    }
  },
  labels: true
} satisfies Prisma.BoardInclude;

export type BoardWithRelations = Prisma.BoardGetPayload<{ include: typeof boardInclude }>;
export type BoardSummaryWithRelations = Prisma.BoardGetPayload<{ include: typeof boardSummaryInclude }>;

export async function getBoards() {
  const session = await auth();
  if (!session?.user?.id) {
    throw new Error("Unauthorized");
  }

  // Get memberships with sorting by favorite and order
  const memberships = await prisma.boardMember.findMany({
    where: { userId: session.user.id },
    include: {
      board: {
        include: boardSummaryInclude
      }
    },
    orderBy: [
      { isFavorite: "desc" },
      { order: "asc" },
      { id: "asc" }
    ]
  });

  // Map to a structure that's easy to use, attaching membership info to the board
  return memberships.map(m => ({
    ...m.board,
    isFavorite: m.isFavorite,
    order: m.order
  }));
}

export async function toggleFavorite(boardId: string, isFavorite: boolean) {
  const session = await auth();
  if (!session?.user?.id) return { error: "Unauthorized" };

  try {
    await prisma.boardMember.update({
      where: {
        boardId_userId: {
          boardId,
          userId: session.user.id
        }
      },
      data: { isFavorite }
    });
    revalidatePath("/boards");
    return { success: true };
  } catch (error) {
    console.error("Failed to toggle favorite:", error);
    return { error: "Failed to update favorite status" };
  }
}

export async function reorderBoards(boardIds: string[]) {
  const session = await auth();
  if (!session?.user?.id) return { error: "Unauthorized" };

  try {
    const userId = session.user.id;
    
    // Perform updates in a transaction
    await prisma.$transaction(
      boardIds.map((id, index) => 
        prisma.boardMember.update({
          where: {
            boardId_userId: {
              boardId: id,
              userId
            }
          },
          data: { order: index }
        })
      )
    );

    revalidatePath("/boards");
    return { success: true };
  } catch (error) {
    console.error("Failed to reorder boards:", error);
    return { error: "Failed to reorder boards" };
  }
}

export async function createBoard(formData: FormData) {
  const session = await auth();
  if (!session?.user?.id) {
    return { error: "Unauthorized" };
  }

  const title = formData.get("title") as string;
  const description = formData.get("description") as string;
  
  const validatedFields = boardSchema.safeParse({ title, description });

  if (!validatedFields.success) {
    return {
      error: validatedFields.error.flatten().fieldErrors.title?.[0] || 
             validatedFields.error.flatten().fieldErrors.description?.[0] || 
             "Invalid data",
    };
  }

  try {
    const board = await prisma.board.create({
      data: {
        title: validatedFields.data.title,
        description: validatedFields.data.description,
        userId: session.user.id,
        members: {
          create: {
            userId: session.user.id,
            role: "OWNER"
          }
        }
      },
    });

    revalidatePath("/boards");
    return { success: true, boardId: board.id };
  } catch (error) {
    console.error("Failed to create board:", error);
    return { error: "Failed to create board" };
  }
}

export async function deleteBoard(id: string) {
  const session = await auth();
  if (!session?.user?.id) {
    return { error: "Unauthorized" };
  }

  try {
    // Only owner can delete
    await prisma.board.delete({
      where: {
        id,
        userId: session.user.id,
      },
    });

    revalidatePath("/boards");
    return { success: true };
  } catch (error) {
    console.error("Failed to delete board:", error);
    return { error: "Failed to delete board" };
  }
}

export async function updateBoard(id: string, data: { title?: string; description?: string }) {
  const session = await auth();
  if (!session?.user?.id) return { error: "Unauthorized" };

  try {
    await prisma.board.update({
      where: { id },
      data
    });

    revalidatePath(`/boards/${id}`);
    revalidatePath("/boards");
    return { success: true };
  } catch (error) {
    console.error("Failed to update board:", error);
    return { error: "Failed to update board" };
  }
}

export async function getBoardById(id: string): Promise<BoardWithRelations | null> {
  const session = await auth();
  if (!session?.user?.id) {
    throw new Error("Unauthorized");
  }

  const board = await prisma.board.findFirst({
    where: {
      id,
      // User must be creator or member
      OR: [
        { userId: session.user.id },
        { members: { some: { userId: session.user.id } } }
      ]
    },
    include: boardInclude
  });

  return board as BoardWithRelations | null;
}

export async function touchBoard(boardId: string) {
  try {
    await prisma.board.update({
      where: { id: boardId },
      data: { updatedAt: new Date() }
    });
  } catch (error) {
    console.error("Failed to touch board:", error);
  }
}

export async function inviteMember(boardId: string, email: string) {
  const session = await auth();
  if (!session?.user?.id) return { error: "Unauthorized" };

  try {
    const userToInvite = await prisma.user.findUnique({
      where: { email }
    });

    if (!userToInvite) {
      return { error: "User not found" };
    }

    await prisma.boardMember.create({
      data: {
        boardId,
        userId: userToInvite.id,
        role: "MEMBER"
      }
    });

    revalidatePath(`/boards/${boardId}`);
    return { success: true };
  } catch (error) {
    console.error("Failed to invite member:", error);
    return { error: "Failed to invite member or user already in board" };
  }
}
