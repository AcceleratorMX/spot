"use server";

import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { EntityType } from "@prisma/client";

export async function getAuditLogs(entityId: string, entityType: EntityType) {
  const session = await auth();
  if (!session?.user?.id) {
    throw new Error("Unauthorized");
  }

  return await prisma.auditLog.findMany({
    where: {
      entityId,
      entityType,
    },
    include: {
      user: {
        select: {
          name: true,
          email: true,
          image: true,
        },
      },
    },
    orderBy: {
      createdAt: "desc",
    },
  });
}
