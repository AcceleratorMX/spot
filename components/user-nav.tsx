"use client";

import { useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { LogOut, User } from "lucide-react";
import { signOut } from "next-auth/react";

import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

type UserNavProps = {
  user: {
    name?: string | null;
    email?: string | null;
  };
};

export function UserNav({ user }: UserNavProps) {
  const t = useTranslations("nav");
  const router = useRouter();

  const initials = user.name
    ? user.name
        .split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase()
        .slice(0, 2)
    : "U";

  const handleSignOut = async () => {
    await signOut({ redirect: false });
    router.push("/");
    router.refresh();
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          className="relative h-8 w-8 rounded-full"
          id="user-nav-trigger"
        >
          <Avatar className="h-8 w-8">
            <AvatarFallback className="bg-primary/10 text-primary text-xs">
              {initials}
            </AvatarFallback>
          </Avatar>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-56" align="end" forceMount>
        <DropdownMenuLabel className="font-normal">
          <div className="flex flex-col space-y-1">
            <p className="text-sm font-medium leading-none">{user.name}</p>
            <p className="text-xs leading-none text-muted-foreground">
              {user.email}
            </p>
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem id="nav-profile">
          <User className="mr-2 h-4 w-4" />
          <span>{t("profile")}</span>
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={handleSignOut} id="nav-sign-out">
          <LogOut className="mr-2 h-4 w-4" />
          <span>{t("signOut")}</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
