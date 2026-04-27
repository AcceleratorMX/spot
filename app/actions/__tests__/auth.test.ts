import { describe, it, expect, vi, beforeEach } from "vitest";
import { signUp, signIn } from "../auth";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { signIn as nextAuthSignIn } from "@/auth";
import { AuthError } from "next-auth";

// Mock dependencies
vi.mock("@/lib/prisma", () => ({
  prisma: {
    user: {
      findUnique: vi.fn(),
      create: vi.fn(),
    },
  },
}));

vi.mock("bcryptjs", () => ({
  default: {
    hash: vi.fn(),
    compare: vi.fn(),
  },
}));

vi.mock("@/auth", () => ({
  signIn: vi.fn(),
}));

describe("Auth Server Actions", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("signUp", () => {
    it("should return validation error for invalid data", async () => {
      const formData = new FormData();
      formData.set("name", "a"); // too short
      formData.set("email", "invalid");
      formData.set("password", "short");

      const result = await signUp(null, formData);

      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
    });

    it("should return error if user already exists", async () => {
      vi.mocked(prisma.user.findUnique).mockResolvedValueOnce({
        id: "1",
        email: "test@test.com",
        name: "Test User",
        emailVerified: null,
        image: null,
        passwordHash: "hash",
        role: "USER",
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      const formData = new FormData();
      formData.set("name", "Test User");
      formData.set("email", "test@test.com");
      formData.set("password", "password123");

      const result = await signUp(null, formData);

      expect(result.success).toBe(false);
      expect(result.error).toBe("userExists");
    });

    it("should create user and return success", async () => {
      vi.mocked(prisma.user.findUnique).mockResolvedValueOnce(null);
      vi.mocked(bcrypt.hash).mockResolvedValueOnce("hashed_password" as never);

      const formData = new FormData();
      formData.set("name", "Test User");
      formData.set("email", "test@test.com");
      formData.set("password", "password123");

      const result = await signUp(null, formData);

      expect(prisma.user.create).toHaveBeenCalledWith({
        data: {
          name: "Test User",
          email: "test@test.com",
          passwordHash: "hashed_password",
        },
      });
      expect(result.success).toBe(true);
      expect(result.error).toBeUndefined();
    });
  });

  describe("signIn", () => {
    it("should return validation error for invalid data", async () => {
      const formData = new FormData();
      formData.set("email", "invalid");
      formData.set("password", "");

      const result = await signIn(null, formData);

      expect(result.success).toBe(false);
      expect(result.error).toBe("invalidEmail");
    });

    it("should return success when nextAuthSignIn succeeds", async () => {
      vi.mocked(nextAuthSignIn).mockResolvedValueOnce(undefined);

      const formData = new FormData();
      formData.set("email", "test@test.com");
      formData.set("password", "password123");

      const result = await signIn(null, formData);

      expect(nextAuthSignIn).toHaveBeenCalledWith("credentials", {
        email: "test@test.com",
        password: "password123",
        redirect: false,
      });
      expect(result.success).toBe(true);
    });

    it("should return invalidCredentials error when CredentialsSignin is thrown", async () => {
      class CustomAuthError extends AuthError {
        constructor() {
          super();
          this.type = "CredentialsSignin";
        }
      }
      
      vi.mocked(nextAuthSignIn).mockRejectedValueOnce(new CustomAuthError());

      const formData = new FormData();
      formData.set("email", "test@test.com");
      formData.set("password", "wrongpassword");

      const result = await signIn(null, formData);

      expect(result.success).toBe(false);
      expect(result.error).toBe("invalidCredentials");
    });
  });
});
