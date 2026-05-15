"use server";

import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { Priority } from "@prisma/client";

export async function getDashboardData() {
  const session = await auth();
  if (!session?.user?.id) {
    throw new Error("Unauthorized");
  }

  const userId = session.user.id;

  // 1. Stats
  const totalBoards = await prisma.boardMember.count({
    where: { userId },
  });

  const assignedTasksCount = await prisma.taskAssignee.count({
    where: { userId },
  });

  const now = new Date();
  const nextWeek = new Date(now);
  nextWeek.setDate(now.getDate() + 7);

  const upcomingDeadlinesCount = await prisma.task.count({
    where: {
      participants: {
        some: { userId },
      },
      dueDate: {
        gte: now,
        lte: nextWeek,
      },
    },
  });

  const highPriorityTasksCount = await prisma.task.count({
    where: {
      participants: {
        some: { userId },
      },
      priority: {
        in: [Priority.HIGH, Priority.URGENT],
      },
    },
  });

  // 2. Favorite Boards
  const favoriteBoards = await prisma.boardMember.findMany({
    where: {
      userId,
      isFavorite: true,
    },
    include: {
      board: {
        include: {
          _count: {
            select: { columns: true },
          },
        },
      },
    },
    orderBy: {
      order: "asc",
    },
    take: 5,
  });

  // 3. Recent Activity (Latest 10 logs by the user or on boards where user is a member)
  // For simplicity, let's start with logs created by the user
  const recentActivity = await prisma.auditLog.findMany({
    where: { userId },
    include: {
      user: {
        select: {
          name: true,
          email: true,
          image: true,
        },
      },
    },
    orderBy: { createdAt: "desc" },
    take: 10,
  });

  // Enrich activity with boardId for navigation
  const enrichedActivity = await Promise.all(
    recentActivity.map(async (log) => {
      let boardId: string | null = null;

      if (log.entityType === "BOARD") {
        boardId = log.entityId;
      } else if (log.entityType === "COLUMN") {
        const column = await prisma.column.findUnique({
          where: { id: log.entityId },
          select: { boardId: true },
        });
        boardId = column?.boardId || null;
      } else if (log.entityType === "TASK") {
        const task = await prisma.task.findUnique({
          where: { id: log.entityId },
          include: { column: { select: { boardId: true } } },
        });
        boardId = task?.column?.boardId || null;
      }

      return {
        ...log,
        boardId,
      };
    })
  );

  // 4. My Tasks (assigned to user)
  const myTasks = await prisma.task.findMany({
    where: {
      participants: {
        some: { userId },
      },
    },
    include: {
      column: {
        include: {
          board: true,
        },
      },
    },
    orderBy: { updatedAt: "desc" },
    take: 5,
  });

  return {
    user: {
      name: session.user.name,
    },
    stats: {
      totalBoards,
      assignedTasksCount,
      upcomingDeadlinesCount,
      highPriorityTasksCount,
    },
    favoriteBoards: favoriteBoards.map((m) => m.board),
    recentActivity: enrichedActivity,
    myTasks,
  };
}
