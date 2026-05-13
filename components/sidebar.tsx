"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useLocale, useTranslations } from "next-intl";
import {
  LayoutDashboard,
  Kanban,
  Settings,
  PanelLeftClose,
  PanelLeft,
} from "lucide-react";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

const navItems = [
  { key: "dashboard", href: "/dashboard", icon: LayoutDashboard },
  { key: "boards", href: "/boards", icon: Kanban },
  { key: "settings", href: "/settings", icon: Settings },
] as const;

export function Sidebar() {
  const [collapsed, setCollapsed] = useState(false);
  const t = useTranslations("nav");
  const locale = useLocale();
  const pathname = usePathname();

  return (
    <aside
      data-testid="sidebar"
      className={cn(
        "flex flex-col border-r bg-sidebar-background text-sidebar-foreground transition-all duration-300",
        collapsed ? "w-16" : "w-64",
      )}
    >
      {/* Logo area */}
      <div className="flex h-14 items-center border-b px-4">
        <Link
          href={`/${locale}/dashboard`}
          className="flex items-center gap-2 font-semibold"
          id="sidebar-logo"
        >
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground text-sm font-bold">
            S
          </div>
          {!collapsed && (
            <span className="text-lg font-bold tracking-tight">SPOT</span>
          )}
        </Link>
      </div>

      {/* Navigation */}
      <nav className="flex-1 space-y-1 p-2">
        {navItems.map((item) => {
          const href = `/${locale}${item.href}`;
          const isActive = pathname.startsWith(href);
          const Icon = item.icon;

          const link = (
            <Link
              key={item.key}
              href={href}
              id={`sidebar-nav-${item.key}`}
              className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
                isActive &&
                  "bg-sidebar-accent text-sidebar-primary",
                collapsed && "justify-center",
              )}
            >
              <Icon className="h-5 w-5 shrink-0" />
              {!collapsed && <span>{t(item.key)}</span>}
            </Link>
          );

          if (collapsed) {
            return (
              <Tooltip key={item.key}>
                <TooltipTrigger asChild>{link}</TooltipTrigger>
                <TooltipContent side="right">{t(item.key)}</TooltipContent>
              </Tooltip>
            );
          }

          return link;
        })}
      </nav>

      {/* Collapse toggle */}
      <div className="border-t p-2">
        <Button
          variant="ghost"
          size="sm"
          className={cn("w-full", collapsed ? "justify-center" : "justify-start")}
          onClick={() => setCollapsed(!collapsed)}
          id="sidebar-toggle"
          aria-label={t("toggleSidebar")}
        >
          {collapsed ? (
            <PanelLeft className="h-5 w-5" />
          ) : (
            <>
              <PanelLeftClose className="mr-2 h-5 w-5" />
              <span>{t("toggleSidebar")}</span>
            </>
          )}
        </Button>
      </div>
    </aside>
  );
}
