import { describe, it, expect, vi, beforeEach } from "vitest";
import type { User, VerificationToken } from "@prisma/client";
import { signUp, signIn, forgotPassword, resetPassword } from "../auth";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { signIn as nextAuthSignIn } from "@/auth";
import { AuthError } from "next-auth";
import { generatePasswordResetToken, getPasswordResetTokenByToken } from "@/lib/tokens";
import { sendPasswordResetEmail } from "@/lib/mail";

// Mock dependencies
vi.mock("bcryptjs", () => ({
  default: {
    hash: vi.fn(),
    compare: vi.fn(),
  },
}));

vi.mock("@/auth", () => ({
  signIn: vi.fn(),
}));

vi.mock("@/lib/tokens", () => ({
  generatePasswordResetToken: vi.fn(),
  getPasswordResetTokenByToken: vi.fn(),
}));

vi.mock("@/lib/mail", () => ({
  sendPasswordResetEmail: vi.fn(),
}));

vi.mock("next-intl/server", () => ({
  getLocale: vi.fn(() => Promise.resolve("en")),
}));

vi.mock("@/lib/prisma", () => ({
  prisma: {
    user: {
      findUnique: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
    },
    verificationToken: {
      findFirst: vi.fn(),
      delete: vi.fn(),
      create: vi.fn(),
    },
    $transaction: vi.fn((cb) => cb),
  },
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
      formData.set("confirmPassword", "short");

      const result = await signUp(null, formData);

      expect(result.success).toBe(false);
      expect(result.fieldErrors).toBeDefined();
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
      formData.set("confirmPassword", "password123");

      const result = await signUp(null, formData);

      expect(result.success).toBe(false);
      expect(result.fieldErrors?.email).toContain("userExists");
    });

    it("should create user and return success", async () => {
      vi.mocked(prisma.user.findUnique).mockResolvedValueOnce(null);
      vi.mocked(bcrypt.hash).mockResolvedValueOnce("hashed_password" as never);

      const formData = new FormData();
      formData.set("name", "Test User");
      formData.set("email", "test@test.com");
      formData.set("password", "password123");
      formData.set("confirmPassword", "password123");

      const result = await signUp(null, formData);

      expect(prisma.user.create).toHaveBeenCalledWith({
        data: {
          name: "Test User",
          email: "test@test.com",
          passwordHash: "hashed_password",
        },
      });
      expect(result.success).toBe(true);
      expect(result.fieldErrors).toBeUndefined();
    });
  });

  describe("signIn", () => {
    it("should return validation error for invalid data", async () => {
      const formData = new FormData();
      formData.set("email", "invalid");
      formData.set("password", "");

      const result = await signIn(null, formData);

      expect(result.success).toBe(false);
      expect(result.fieldErrors?.email).toContain("invalidEmail");
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

  describe("forgotPassword", () => {
    it("should return validation error for invalid email", async () => {
      const formData = new FormData();
      formData.set("email", "invalid");

      const result = await forgotPassword(null, formData);

      expect(result.success).toBe(false);
      expect(result.error).toBe("invalidEmail");
    });

    it("should return success even if user not found", async () => {
      vi.mocked(prisma.user.findUnique).mockResolvedValueOnce(null);

      const formData = new FormData();
      formData.set("email", "nonexistent@test.com");

      const result = await forgotPassword(null, formData);

      expect(result.success).toBe(true);
    });

    it("should send email and return success for valid user", async () => {
      const user = {
        id: "1",
        email: "test@test.com",
        passwordHash: "hash",
      };
      vi.mocked(prisma.user.findUnique).mockResolvedValueOnce(user as unknown as User);
      vi.mocked(generatePasswordResetToken).mockResolvedValueOnce({
        identifier: "test@test.com",
        token: "token123",
        expires: new Date(),
      } as unknown as VerificationToken);

      const formData = new FormData();
      formData.set("email", "test@test.com");

      const result = await forgotPassword(null, formData);

      expect(generatePasswordResetToken).toHaveBeenCalledWith("test@test.com");
      expect(sendPasswordResetEmail).toHaveBeenCalledWith("test@test.com", "token123", "en");
      expect(result.success).toBe(true);
    });

    it("should return error if user is social-only", async () => {
      const user = {
        id: "1",
        email: "test@test.com",
        passwordHash: null,
      };
      vi.mocked(prisma.user.findUnique).mockResolvedValueOnce(user as unknown as User);

      const formData = new FormData();
      formData.set("email", "test@test.com");

      const result = await forgotPassword(null, formData);

      expect(result.success).toBe(false);
      expect(result.error).toBe("socialUser");
    });
  });

  describe("resetPassword", () => {
    it("should return error if token is missing", async () => {
      const formData = new FormData();
      const result = await resetPassword(null, null, formData);

      expect(result.success).toBe(false);
      expect(result.error).toBe("missingToken");
    });

    it("should return validation error if passwords do not match", async () => {
      const formData = new FormData();
      formData.set("password", "password123");
      formData.set("confirmPassword", "different");

      const result = await resetPassword("token", null, formData);

      expect(result.success).toBe(false);
      expect(result.error).toBe("passwordsDoNotMatch");
    });

    it("should reset password and return success", async () => {
      const token = {
        identifier: "test@test.com",
        token: "token123",
        expires: new Date(Date.now() + 100000),
      };
      vi.mocked(getPasswordResetTokenByToken).mockResolvedValueOnce(token as unknown as VerificationToken);
      vi.mocked(prisma.user.findUnique).mockResolvedValueOnce({
        id: "1",
        email: "test@test.com",
      } as unknown as User);
      vi.mocked(bcrypt.hash).mockResolvedValueOnce("new_hash" as never);

      const formData = new FormData();
      formData.set("password", "newpassword123");
      formData.set("confirmPassword", "newpassword123");

      const result = await resetPassword("token123", null, formData);

      expect(prisma.user.update).toHaveBeenCalled();
      expect(result.success).toBe(true);
    });

    it("should return error if token is expired", async () => {
      const token = {
        identifier: "test@test.com",
        token: "token123",
        expires: new Date(Date.now() - 100000),
      };
      vi.mocked(getPasswordResetTokenByToken).mockResolvedValueOnce(token as unknown as VerificationToken);

      const formData = new FormData();
      formData.set("password", "newpassword123");
      formData.set("confirmPassword", "newpassword123");

      const result = await resetPassword("token123", null, formData);

      expect(result.success).toBe(false);
      expect(result.error).toBe("tokenExpired");
    });
  });
});
