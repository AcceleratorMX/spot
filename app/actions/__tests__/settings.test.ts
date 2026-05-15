import { describe, it, expect, vi, beforeEach } from "vitest";
import type { User } from "@prisma/client";
import { updateSettings } from "../auth";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";

// Mock dependencies
vi.mock("bcryptjs", () => ({
  default: {
    hash: vi.fn(),
    compare: vi.fn(),
  },
}));

const mockAuth = vi.fn();
vi.mock("@/auth", () => ({
  auth: () => mockAuth(),
  signIn: vi.fn(),
  unstable_update: vi.fn(),
}));

vi.mock("@/lib/mail", () => ({
  sendPasswordResetEmail: vi.fn(),
}));

vi.mock("@/lib/tokens", () => ({
  generatePasswordResetToken: vi.fn(),
  getPasswordResetTokenByToken: vi.fn(),
}));

vi.mock("next-intl/server", () => ({
  getLocale: vi.fn(() => Promise.resolve("en")),
}));

vi.mock("next/cache", () => ({
  revalidatePath: vi.fn(),
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

const mockUser: User = {
  id: "user-1",
  email: "test@test.com",
  name: "Test User",
  emailVerified: null,
  image: null,
  passwordHash: "$2a$12$hashedpassword",
  role: "USER",
  createdAt: new Date(),
  updatedAt: new Date(),
};

function makeFormData(fields: Record<string, string>): FormData {
  const fd = new FormData();
  for (const [key, value] of Object.entries(fields)) {
    fd.set(key, value);
  }
  return fd;
}

describe("updateSettings", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Default: authenticated session
    mockAuth.mockResolvedValue({
      user: { id: "user-1", email: "test@test.com", name: "Test User", role: "USER" },
      expires: new Date(Date.now() + 86400000).toISOString(),
    });
  });

  // ─── Unauthorized ───
  it("should return unauthorized error when no session exists", async () => {
    mockAuth.mockResolvedValueOnce(null);

    const formData = makeFormData({ name: "New Name" });
    const result = await updateSettings(null, formData);

    expect(result.success).toBe(false);
    expect(result.error).toBe("unauthorized");
  });

  // ─── Name Validation ───
  it("should return validation error when name is too short", async () => {
    const formData = makeFormData({ name: "A" });
    const result = await updateSettings(null, formData);

    expect(result.success).toBe(false);
    expect(result.fieldErrors?.name).toContain("nameTooShort");
  });

  it("should return validation error when name is too long", async () => {
    const formData = makeFormData({ name: "A".repeat(65) });
    const result = await updateSettings(null, formData);

    expect(result.success).toBe(false);
    expect(result.fieldErrors?.name).toContain("nameTooLong");
  });

  // ─── Name Update (no password change) ───
  it("should update name successfully without changing password", async () => {
    vi.mocked(prisma.user.findUnique).mockResolvedValueOnce(mockUser);

    const formData = makeFormData({ name: "Updated Name" });
    const result = await updateSettings(null, formData);

    expect(result.success).toBe(true);
    expect(prisma.user.update).toHaveBeenCalledWith({
      where: { id: "user-1" },
      data: { name: "Updated Name" },
    });
  });

  it("should preserve name in fields on validation error", async () => {
    const formData = makeFormData({
      name: "Valid Name",
      newPassword: "newpass123",
      confirmNewPassword: "newpass123",
      // No current password — should error
    });
    const result = await updateSettings(null, formData);

    expect(result.success).toBe(false);
    expect(result.fields?.name).toBe("Valid Name");
  });

  // ─── Password Change Validation ───
  it("should return error when newPassword provided without current password", async () => {
    const formData = makeFormData({
      name: "Test User",
      newPassword: "newpassword123",
      confirmNewPassword: "newpassword123",
    });

    const result = await updateSettings(null, formData);

    expect(result.success).toBe(false);
    expect(result.fieldErrors?.password).toContain("passwordRequired");
  });

  it("should return error when current password provided without new password", async () => {
    const formData = makeFormData({
      name: "Test User",
      password: "currentpass123",
    });

    const result = await updateSettings(null, formData);

    expect(result.success).toBe(false);
    expect(result.fieldErrors?.newPassword).toContain("newPasswordRequired");
  });

  it("should return error when new passwords do not match", async () => {
    const formData = makeFormData({
      name: "Test User",
      password: "currentpass",
      newPassword: "newpassword123",
      confirmNewPassword: "differentpassword",
    });

    const result = await updateSettings(null, formData);

    expect(result.success).toBe(false);
    expect(result.fieldErrors?.confirmNewPassword).toContain("passwordsDoNotMatch");
  });

  it("should return error when new password is too short", async () => {
    const formData = makeFormData({
      name: "Test User",
      password: "currentpass",
      newPassword: "short",
      confirmNewPassword: "short",
    });

    const result = await updateSettings(null, formData);

    expect(result.success).toBe(false);
    expect(result.fieldErrors?.newPassword).toContain("passwordTooShort");
  });

  // ─── Password Change — Server-side Checks ───
  it("should return error when current password is incorrect", async () => {
    vi.mocked(prisma.user.findUnique).mockResolvedValueOnce(mockUser);
    vi.mocked(bcrypt.compare).mockResolvedValueOnce(false as never);

    const formData = makeFormData({
      name: "Test User",
      password: "wrongpassword",
      newPassword: "newpassword123",
      confirmNewPassword: "newpassword123",
    });

    const result = await updateSettings(null, formData);

    expect(result.success).toBe(false);
    expect(result.fieldErrors?.password).toContain("invalidPassword");
  });

  it("should return error when social user tries to change password", async () => {
    const socialUser = { ...mockUser, passwordHash: null };
    vi.mocked(prisma.user.findUnique).mockResolvedValueOnce(socialUser);

    const formData = makeFormData({
      name: "Test User",
      password: "somepassword",
      newPassword: "newpassword123",
      confirmNewPassword: "newpassword123",
    });

    const result = await updateSettings(null, formData);

    expect(result.success).toBe(false);
    expect(result.fieldErrors?.password).toContain("socialUserPasswordChange");
  });

  it("should return userNotFound error if user does not exist in DB", async () => {
    vi.mocked(prisma.user.findUnique).mockResolvedValueOnce(null);

    const formData = makeFormData({ name: "Test User" });
    const result = await updateSettings(null, formData);

    expect(result.success).toBe(false);
    expect(result.error).toBe("userNotFound");
  });

  // ─── Successful Password Change ───
  it("should update password successfully when all fields are valid", async () => {
    vi.mocked(prisma.user.findUnique).mockResolvedValueOnce(mockUser);
    vi.mocked(bcrypt.compare).mockResolvedValueOnce(true as never);
    vi.mocked(bcrypt.hash).mockResolvedValueOnce("new_hashed_password" as never);

    const formData = makeFormData({
      name: "Test User",
      password: "currentpassword",
      newPassword: "newpassword123",
      confirmNewPassword: "newpassword123",
    });

    const result = await updateSettings(null, formData);

    expect(result.success).toBe(true);
    expect(bcrypt.compare).toHaveBeenCalledWith("currentpassword", mockUser.passwordHash);
    expect(bcrypt.hash).toHaveBeenCalledWith("newpassword123", 12);
    expect(prisma.user.update).toHaveBeenCalledWith({
      where: { id: "user-1" },
      data: { name: "Test User", passwordHash: "new_hashed_password" },
    });
  });

  it("should update name AND password in a single call", async () => {
    vi.mocked(prisma.user.findUnique).mockResolvedValueOnce(mockUser);
    vi.mocked(bcrypt.compare).mockResolvedValueOnce(true as never);
    vi.mocked(bcrypt.hash).mockResolvedValueOnce("new_hash" as never);

    const formData = makeFormData({
      name: "Brand New Name",
      password: "currentpassword",
      newPassword: "newpassword123",
      confirmNewPassword: "newpassword123",
    });

    const result = await updateSettings(null, formData);

    expect(result.success).toBe(true);
    expect(prisma.user.update).toHaveBeenCalledWith({
      where: { id: "user-1" },
      data: { name: "Brand New Name", passwordHash: "new_hash" },
    });
  });

  // ─── Empty password fields should be treated as "no change" ───
  it("should NOT change password when all password fields are empty strings", async () => {
    vi.mocked(prisma.user.findUnique).mockResolvedValueOnce(mockUser);

    const formData = makeFormData({
      name: "Test User",
      password: "",
      newPassword: "",
      confirmNewPassword: "",
    });

    const result = await updateSettings(null, formData);

    expect(result.success).toBe(true);
    expect(bcrypt.compare).not.toHaveBeenCalled();
    expect(bcrypt.hash).not.toHaveBeenCalled();
    // Should only update name, not passwordHash
    expect(prisma.user.update).toHaveBeenCalledWith({
      where: { id: "user-1" },
      data: { name: "Test User" },
    });
  });
});
