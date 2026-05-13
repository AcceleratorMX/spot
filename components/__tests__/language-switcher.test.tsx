import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { LanguageSwitcher } from "@/components/language-switcher";

// Mock next-intl
vi.mock("next-intl", () => ({
  useTranslations: () => (key: string) => {
    const translations: Record<string, string> = {
      language: "Language",
    };
    return translations[key] ?? key;
  },
  useLocale: () => "en",
}));

const mockPush = vi.fn();
vi.mock("next/navigation", () => ({
  useRouter: () => ({
    push: mockPush,
  }),
  usePathname: () => "/en/dashboard",
  useSearchParams: () => new URLSearchParams(),
}));

describe("LanguageSwitcher", () => {
  beforeEach(() => {
    mockPush.mockClear();
  });

  it("renders the language button", () => {
    render(<LanguageSwitcher />);
    expect(document.getElementById("language-switcher")).toBeInTheDocument();
  });

  it("opens dropdown with language options", async () => {
    const user = userEvent.setup();
    render(<LanguageSwitcher />);

    await user.click(document.getElementById("language-switcher")!);

    await waitFor(() => {
      expect(screen.getByText("Українська")).toBeInTheDocument();
      expect(screen.getByText("English")).toBeInTheDocument();
    });
  });

  it("navigates to Ukrainian locale when selected", async () => {
    const user = userEvent.setup();
    render(<LanguageSwitcher />);

    await user.click(document.getElementById("language-switcher")!);

    await waitFor(() => {
      expect(screen.getByText("Українська")).toBeInTheDocument();
    });

    await user.click(screen.getByText("Українська"));
    expect(mockPush).toHaveBeenCalledWith("/uk/dashboard");
  });

  it("highlights the current locale", async () => {
    const user = userEvent.setup();
    render(<LanguageSwitcher />);

    await user.click(document.getElementById("language-switcher")!);

    await waitFor(() => {
      const enOption = document.getElementById("language-en");
      expect(enOption?.className).toContain("bg-accent");
    });
  });
});
