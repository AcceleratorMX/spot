import { prisma } from "./prisma";
import { auth } from "@/auth";
import { AuditAction, EntityType, Prisma } from "@prisma/client";

interface AuditLogProps {
  entityId: string;
  entityType: EntityType;
  entityTitle?: string;
  action: AuditAction;
  oldData?: Prisma.InputJsonValue;
  newData?: Prisma.InputJsonValue;
}

export const createAuditLog = async (props: AuditLogProps) => {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return;
    }

    const { entityId, entityType, entityTitle, action, oldData, newData } = props;

    await prisma.auditLog.create({
      data: {
        entityId,
        entityType,
        entityTitle,
        action,
        oldData: oldData ?? Prisma.JsonNull,
        newData: newData ?? Prisma.JsonNull,
        userId: session.user.id,
      },
    });
  } catch (error) {
    console.error("[AUDIT_LOG_ERROR]", error);
  }
};
