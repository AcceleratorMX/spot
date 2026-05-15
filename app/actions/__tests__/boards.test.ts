import { describe, it, expect, vi, beforeEach } from "vitest";
import { inviteMember, removeMember } from "../boards";
import { prisma } from "@/lib/prisma";
import { createAuditLog } from "@/lib/audit";
import { revalidatePath } from "next/cache";

// Mock dependencies
vi.mock("@/lib/prisma", () => ({
  prisma: {
    user: {
      findUnique: vi.fn(),
    },
    board: {
      findUnique: vi.fn(),
    },
    boardMember: {
      create: vi.fn(),
      delete: vi.fn(),
    },
    taskAssignee: {
      deleteMany: vi.fn(),
    },
    $transaction: vi.fn((cb) => (Array.isArray(cb) ? Promise.all(cb) : cb(prisma))),
  },
}));

const mockAuth = vi.fn();
vi.mock("@/auth", () => ({
  auth: () => mockAuth(),
}));

vi.mock("@/lib/audit", () => ({
  createAuditLog: vi.fn(),
}));

vi.mock("next/cache", () => ({
  revalidatePath: vi.fn(),
}));

describe("Boards Server Actions - Member Management", () => {
  const mockSession = {
    user: { id: "owner-1", email: "owner@test.com" },
    expires: "1",
  };

  beforeEach(() => {
    vi.clearAllMocks();
    mockAuth.mockResolvedValue(mockSession);
  });

  describe("inviteMember", () => {
    it("should return error if user not found", async () => {
      vi.mocked(prisma.user.findUnique).mockResolvedValueOnce(null);
      const result = await inviteMember("board-1", "nonexistent@test.com");
      expect(result.error).toBe("User not found");
    });

    it("should invite user successfully", async () => {
      vi.mocked(prisma.user.findUnique).mockResolvedValueOnce({ id: "user-2", email: "user2@test.com" } as unknown as Awaited<ReturnType<typeof prisma.user.findUnique>>);
      
      const result = await inviteMember("board-1", "user2@test.com");

      expect(prisma.boardMember.create).toHaveBeenCalledWith({
        data: {
          boardId: "board-1",
          userId: "user-2",
          role: "MEMBER"
        }
      });
      expect(createAuditLog).toHaveBeenCalled();
      expect(revalidatePath).toHaveBeenCalledWith("/boards/board-1");
      expect(result.success).toBe(true);
    });
  });

  describe("removeMember", () => {
    it("should return error if not owner", async () => {
      vi.mocked(prisma.board.findUnique).mockResolvedValueOnce({ id: "board-1", userId: "other-user" } as unknown as Awaited<ReturnType<typeof prisma.board.findUnique>>);
      const result = await removeMember("board-1", "user-2");
      expect(result.error).toBe("Forbidden");
    });

    it("should return error if trying to remove owner", async () => {
      vi.mocked(prisma.board.findUnique).mockResolvedValueOnce({ id: "board-1", userId: "owner-1" } as unknown as Awaited<ReturnType<typeof prisma.board.findUnique>>);
      const result = await removeMember("board-1", "owner-1");
      expect(result.error).toBe("Cannot remove owner");
    });

    it("should remove member and their task assignments", async () => {
      vi.mocked(prisma.board.findUnique).mockResolvedValueOnce({ id: "board-1", userId: "owner-1" } as unknown as Awaited<ReturnType<typeof prisma.board.findUnique>>);
      vi.mocked(prisma.boardMember.delete).mockResolvedValueOnce({ 
        user: { email: "removed@test.com" } 
      } as unknown as Awaited<ReturnType<typeof prisma.boardMember.delete>>);

      const result = await removeMember("board-1", "user-2");

      // Verify task assignments are deleted
      expect(prisma.taskAssignee.deleteMany).toHaveBeenCalledWith({
        where: {
          userId: "user-2",
          task: {
            column: {
              boardId: "board-1"
            }
          }
        }
      });

      // Verify board membership is deleted
      expect(prisma.boardMember.delete).toHaveBeenCalledWith(expect.objectContaining({
        where: {
          boardId_userId: {
            boardId: "board-1",
            userId: "user-2"
          }
        }
      }));

      expect(createAuditLog).toHaveBeenCalled();
      expect(revalidatePath).toHaveBeenCalledWith("/boards/board-1");
      expect(result.success).toBe(true);
    });
  });
});
