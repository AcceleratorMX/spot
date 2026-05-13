import { describe, it, expect, vi, beforeEach } from "vitest";
import { addTaskDependency, removeTaskDependency } from "../tasks";
import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";
import { createAuditLog } from "@/lib/audit";
import { revalidatePath } from "next/cache";

// Mock dependencies
vi.mock("@/lib/prisma", () => ({
  prisma: {
    task: {
      findUnique: vi.fn(),
    },
    board: {
      findFirst: vi.fn(),
    },
    taskDependency: {
      upsert: vi.fn(),
      delete: vi.fn(),
    },
    $transaction: vi.fn((cb) => (Array.isArray(cb) ? Promise.all(cb) : cb(prisma))),
  },
}));

vi.mock("@/auth", () => ({
  auth: vi.fn(),
}));

vi.mock("@/lib/audit", () => ({
  createAuditLog: vi.fn(),
}));

vi.mock("next/cache", () => ({
  revalidatePath: vi.fn(),
}));

vi.mock("../boards", () => ({
  touchBoard: vi.fn(),
}));

describe("Tasks Server Actions - Dependencies", () => {
  const mockSession = {
    user: { id: "user-1", email: "test@test.com" },
    expires: "1",
  };

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(auth).mockResolvedValue(mockSession);
  });

  describe("addTaskDependency", () => {
    it("should return error if unauthorized", async () => {
      vi.mocked(auth).mockResolvedValueOnce(null);
      const result = await addTaskDependency("board-1", "task-dep", "task-pre");
      expect(result.error).toBe("Unauthorized");
    });

    it("should return error if task depends on itself", async () => {
      const result = await addTaskDependency("board-1", "task-1", "task-1");
      expect(result.error).toBe("Task cannot depend on itself");
    });

    it("should return error if board access is denied", async () => {
      vi.mocked(prisma.board.findFirst).mockResolvedValueOnce(null);
      const result = await addTaskDependency("board-1", "task-dep", "task-pre");
      expect(result.error).toBe("Forbidden");
    });

    it("should add dependency and create dual audit logs", async () => {
      vi.mocked(prisma.board.findFirst).mockResolvedValueOnce({ id: "board-1" } as unknown as Awaited<ReturnType<typeof prisma.board.findFirst>>);
      vi.mocked(prisma.task.findUnique)
        .mockResolvedValueOnce({ title: "Dependent Task" } as unknown as Awaited<ReturnType<typeof prisma.task.findUnique>>) // for depTask
        .mockResolvedValueOnce({ title: "Prerequisite Task" } as unknown as Awaited<ReturnType<typeof prisma.task.findUnique>>); // for preTask

      const result = await addTaskDependency("board-1", "task-dep", "task-pre");

      expect(prisma.taskDependency.upsert).toHaveBeenCalled();
      
      // Check dual audit logs
      expect(createAuditLog).toHaveBeenCalledTimes(2);
      
      // Log for dependent task
      expect(createAuditLog).toHaveBeenCalledWith(expect.objectContaining({
        entityId: "task-dep",
        action: "UPDATE",
        newData: expect.objectContaining({
          dependencyAdded: "Prerequisite Task"
        })
      }));

      // Log for prerequisite task
      expect(createAuditLog).toHaveBeenCalledWith(expect.objectContaining({
        entityId: "task-pre",
        action: "UPDATE",
        newData: expect.objectContaining({
          prerequisiteFor: "Dependent Task"
        })
      }));

      expect(revalidatePath).toHaveBeenCalled();
      expect(result).not.toHaveProperty("error");
    });
  });

  describe("removeTaskDependency", () => {
    it("should remove dependency and create dual audit logs", async () => {
      vi.mocked(prisma.board.findFirst).mockResolvedValueOnce({ id: "board-1" } as unknown as Awaited<ReturnType<typeof prisma.board.findFirst>>);
      vi.mocked(prisma.task.findUnique)
        .mockResolvedValueOnce({ title: "Dependent Task" } as unknown as Awaited<ReturnType<typeof prisma.task.findUnique>>)
        .mockResolvedValueOnce({ title: "Prerequisite Task" } as unknown as Awaited<ReturnType<typeof prisma.task.findUnique>>);

      const result = await removeTaskDependency("board-1", "task-dep", "task-pre");

      expect(prisma.taskDependency.delete).toHaveBeenCalled();
      expect(createAuditLog).toHaveBeenCalledTimes(2);

      // Log for dependent task removal
      expect(createAuditLog).toHaveBeenCalledWith(expect.objectContaining({
        entityId: "task-dep",
        newData: expect.objectContaining({
          dependencyRemoved: "Prerequisite Task"
        })
      }));

      expect(revalidatePath).toHaveBeenCalled();
      expect(result).not.toHaveProperty("error");
    });
  });
});
