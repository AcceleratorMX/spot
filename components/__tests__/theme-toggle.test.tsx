import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { ThemeToggle } from "@/components/theme-toggle";

// Mock custom theme provider
const mockSetTheme = vi.fn();
vi.mock("@/components/theme-provider", () => ({
  useTheme: () => ({
    theme: "light",
    setTheme: mockSetTheme,
  }),
}));

// Mock next-intl
vi.mock("next-intl", () => ({
  useTranslations: () => (key: string) => {
    const translations: Record<string, string> = {
      theme: "Theme",
      light: "Light",
      dark: "Dark",
      system: "System",
    };
    return translations[key] ?? key;
  },
}));

describe("ThemeToggle", () => {
  beforeEach(() => {
    mockSetTheme.mockClear();
  });

  it("renders the toggle button", () => {
    render(<ThemeToggle />);
    const button = screen.getByRole("button");
    expect(button).toBeInTheDocument();
  });

  it("has the correct id attribute", () => {
    render(<ThemeToggle />);
    expect(document.getElementById("theme-toggle")).toBeInTheDocument();
  });

  it("has accessible screen reader text", () => {
    render(<ThemeToggle />);
    expect(screen.getByText("Theme")).toBeInTheDocument();
  });

  it("opens dropdown menu on click and shows options", async () => {
    const user = userEvent.setup();
    render(<ThemeToggle />);

    await user.click(screen.getByRole("button"));

    await waitFor(() => {
      expect(screen.getByRole("menuitem", { name: /light/i })).toBeInTheDocument();
      expect(screen.getByRole("menuitem", { name: /dark/i })).toBeInTheDocument();
      expect(screen.getByRole("menuitem", { name: /system/i })).toBeInTheDocument();
    });
  });

  it("calls setTheme with 'dark' when Dark is clicked", async () => {
    const user = userEvent.setup();
    render(<ThemeToggle />);

    await user.click(screen.getByRole("button"));

    await waitFor(() => {
      expect(screen.getByRole("menuitem", { name: /dark/i })).toBeInTheDocument();
    });

    await user.click(screen.getByRole("menuitem", { name: /dark/i }));
    expect(mockSetTheme).toHaveBeenCalledWith("dark");
  });

  it("calls setTheme with 'light' when Light is clicked", async () => {
    const user = userEvent.setup();
    render(<ThemeToggle />);

    await user.click(screen.getByRole("button"));

    await waitFor(() => {
      expect(screen.getByRole("menuitem", { name: /light/i })).toBeInTheDocument();
    });

    await user.click(screen.getByRole("menuitem", { name: /light/i }));
    expect(mockSetTheme).toHaveBeenCalledWith("light");
  });
});
