import "@testing-library/jest-dom/vitest";
import { vi } from "vitest";

// Mock next-auth to avoid next/server resolution issue in node environments
vi.mock("next-auth", () => {
  class AuthError extends Error {
    type: string;
    constructor() {
      super();
      this.type = "AuthError";
    }
  }
  return { AuthError, default: vi.fn(() => ({ auth: vi.fn(), handlers: { GET: vi.fn(), POST: vi.fn() }, signIn: vi.fn(), signOut: vi.fn() })) };
});

vi.mock("next-auth/providers/credentials", () => {
  return { default: vi.fn() };
});

vi.mock("@auth/prisma-adapter", () => {
  return { PrismaAdapter: vi.fn() };
});
