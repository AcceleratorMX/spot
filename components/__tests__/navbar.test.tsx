import { describe, it, expect, vi } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { NavbarClient } from "@/components/navbar-client";

// Mock next-intl
vi.mock("next-intl", () => ({
  useTranslations: () => (key: string) => {
    const translations: Record<string, string> = {
      signIn: "Sign In",
      signUp: "Sign Up",
      theme: "Theme",
      light: "Light",
      dark: "Dark",
      system: "System",
      language: "Language",
      signOut: "Sign Out",
      profile: "Profile",
    };
    return translations[key] ?? key;
  },
  useLocale: () => "en",
}));

// Mock next/navigation
vi.mock("next/navigation", () => ({
  useRouter: () => ({
    push: vi.fn(),
    refresh: vi.fn(),
  }),
  usePathname: () => "/en/dashboard",
}));

// Mock custom theme provider
vi.mock("@/components/theme-provider", () => ({
  useTheme: () => ({
    theme: "light",
    setTheme: vi.fn(),
  }),
}));

// Mock next-auth/react
vi.mock("next-auth/react", () => ({
  signOut: vi.fn(),
}));

describe("NavbarClient", () => {
  it("renders the navbar", () => {
    render(<NavbarClient user={null} />);
    expect(screen.getByTestId("navbar")).toBeInTheDocument();
  });

  it("shows sign in and sign up buttons when user is not authenticated", () => {
    render(<NavbarClient user={null} />);
    expect(screen.getByText("Sign In")).toBeInTheDocument();
    expect(screen.getByText("Sign Up")).toBeInTheDocument();
  });

  it("shows user avatar when user is authenticated", () => {
    render(
      <NavbarClient user={{ name: "John Doe", email: "john@example.com" }} />,
    );
    expect(document.getElementById("user-nav-trigger")).toBeInTheDocument();
    expect(screen.queryByText("Sign In")).not.toBeInTheDocument();
  });

  it("shows theme toggle button", () => {
    render(<NavbarClient user={null} />);
    expect(document.getElementById("theme-toggle")).toBeInTheDocument();
  });

  it("shows language switcher button", () => {
    render(<NavbarClient user={null} />);
    expect(document.getElementById("language-switcher")).toBeInTheDocument();
  });

  it("opens user menu and shows user info", async () => {
    const user = userEvent.setup();
    render(
      <NavbarClient user={{ name: "John Doe", email: "john@example.com" }} />,
    );

    const trigger = document.getElementById("user-nav-trigger")!;
    await user.click(trigger);

    await waitFor(() => {
      expect(screen.getByText("John Doe")).toBeInTheDocument();
      expect(screen.getByText("john@example.com")).toBeInTheDocument();
      expect(screen.getByText("Sign Out")).toBeInTheDocument();
    });
  });
});
