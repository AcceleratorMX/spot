import { describe, it, expect, vi, beforeEach } from "vitest";
import { getAuditLogs } from "../audit";
import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";
import { EntityType } from "@prisma/client";

// Mock dependencies
vi.mock("@/lib/prisma", () => ({
  prisma: {
    auditLog: {
      findMany: vi.fn(),
    },
  },
}));

vi.mock("@/auth", () => ({
  auth: vi.fn(),
}));

describe("Audit Server Actions", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("getAuditLogs", () => {
    it("should throw error if unauthorized", async () => {
      vi.mocked(auth).mockResolvedValueOnce(null);

      await expect(getAuditLogs("1", EntityType.TASK)).rejects.toThrow("Unauthorized");
    });

    it("should return audit logs for a specific entity", async () => {
      vi.mocked(auth).mockResolvedValueOnce({
        user: { id: "user-1", email: "test@test.com" },
        expires: "1",
      });

      const mockLogs = [
        {
          id: "log-1",
          entityId: "1",
          entityType: EntityType.TASK,
          action: "CREATE",
          createdAt: new Date(),
          user: { name: "Test User", email: "test@test.com", image: null },
        },
      ];

      vi.mocked(prisma.auditLog.findMany).mockResolvedValueOnce(mockLogs as unknown as Awaited<ReturnType<typeof prisma.auditLog.findMany>>);

      const result = await getAuditLogs("1", EntityType.TASK);

      expect(prisma.auditLog.findMany).toHaveBeenCalledWith({
        where: {
          entityId: "1",
          entityType: EntityType.TASK,
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
      expect(result).toEqual(mockLogs);
    });
  });
});
