import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { Sidebar } from "@/components/sidebar";

// Mock next-intl
vi.mock("next-intl", () => ({
  useTranslations: () => (key: string) => {
    const translations: Record<string, string> = {
      dashboard: "Dashboard",
      boards: "Boards",
      settings: "Settings",
      toggleSidebar: "Toggle sidebar",
    };
    return translations[key] ?? key;
  },
  useLocale: () => "en",
}));

// Mock next/navigation
vi.mock("next/navigation", () => ({
  useRouter: () => ({
    push: vi.fn(),
  }),
  usePathname: () => "/en/dashboard",
}));

// Mock @radix-ui/react-tooltip to avoid portal issues
vi.mock("@radix-ui/react-tooltip", () => ({
  Provider: ({ children }: { children: React.ReactNode }) => <>{children}</>,
  Root: ({ children }: { children: React.ReactNode }) => <>{children}</>,
  Trigger: ({ children, asChild, ...props }: { children: React.ReactNode; asChild?: boolean }) => {
    if (asChild) return <>{children}</>;
    return <span {...props}>{children}</span>;
  },
  Portal: ({ children }: { children: React.ReactNode }) => <>{children}</>,
  Content: () => null,
}));

describe("Sidebar", () => {
  it("renders the sidebar", () => {
    render(<Sidebar />);
    expect(screen.getByTestId("sidebar")).toBeInTheDocument();
  });

  it("shows SPOT logo text", () => {
    render(<Sidebar />);
    expect(screen.getByText("SPOT")).toBeInTheDocument();
  });

  it("shows navigation items", () => {
    render(<Sidebar />);
    expect(screen.getByText("Dashboard")).toBeInTheDocument();
    expect(screen.getByText("Boards")).toBeInTheDocument();
    expect(screen.getByText("Settings")).toBeInTheDocument();
  });

  it("has correct navigation links", () => {
    render(<Sidebar />);
    const dashboardLink = document.getElementById("sidebar-nav-dashboard");
    expect(dashboardLink).toBeInTheDocument();
    expect(dashboardLink?.getAttribute("href")).toBe("/en/dashboard");
  });

  it("collapses on toggle button click", () => {
    render(<Sidebar />);
    const toggleBtn = document.getElementById("sidebar-toggle")!;

    // Initially expanded
    expect(screen.getByText("SPOT")).toBeInTheDocument();
    expect(screen.getByText("Dashboard")).toBeInTheDocument();

    // Click collapse
    fireEvent.click(toggleBtn);

    // After collapse: SPOT text and nav labels hidden
    expect(screen.queryByText("SPOT")).not.toBeInTheDocument();
    expect(screen.queryByText("Dashboard")).not.toBeInTheDocument();
  });

  it("expands back on second toggle click", () => {
    render(<Sidebar />);
    const toggleBtn = document.getElementById("sidebar-toggle")!;

    fireEvent.click(toggleBtn); // collapse
    fireEvent.click(toggleBtn); // expand

    expect(screen.getByText("SPOT")).toBeInTheDocument();
    expect(screen.getByText("Dashboard")).toBeInTheDocument();
  });

  it("highlights active link based on current pathname", () => {
    render(<Sidebar />);
    const dashboardLink = document.getElementById("sidebar-nav-dashboard");
    expect(dashboardLink?.className).toContain("bg-sidebar-accent");
  });
});
