import { auth } from "@/auth";
import { useTranslations } from "next-intl";
import { getTranslations } from "next-intl/server";
import { User, Mail, Shield, Calendar } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";

export default async function ProfilePage() {
  const session = await auth();
  const user = session?.user;
  const t = await getTranslations("profile");

  if (!user) {
    return null;
  }

  const initials = user.name
    ? user.name
        .split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase()
        .slice(0, 2)
    : "U";

  return (
    <div className="container mx-auto max-w-4xl space-y-8 py-10">
      <div className="flex items-center gap-6">
        <Avatar className="h-24 w-24 border-4 border-background shadow-xl">
          <AvatarFallback className="bg-primary/10 text-primary text-2xl font-bold">
            {initials}
          </AvatarFallback>
        </Avatar>
        <div className="space-y-1">
          <h1 className="text-3xl font-bold tracking-tight">{user.name}</h1>
          <p className="text-muted-foreground">{user.email}</p>
          <div className="flex gap-2 pt-2">
            <Badge variant="secondary" className="capitalize">
              {user.role?.toLowerCase() || "User"}
            </Badge>
          </div>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5" />
              {t("personalInfo")}
            </CardTitle>
            <CardDescription>
              {t("personalInfoDesc")}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between border-b pb-2">
              <span className="text-sm font-medium text-muted-foreground">{t("name")}</span>
              <span className="text-sm">{user.name}</span>
            </div>
            <div className="flex items-center justify-between border-b pb-2">
              <span className="text-sm font-medium text-muted-foreground">Email</span>
              <span className="text-sm">{user.email}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-muted-foreground">{t("id")}</span>
              <span className="text-sm font-mono text-[10px]">{user.id}</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5" />
              {t("security")}
            </CardTitle>
            <CardDescription>
              {t("securityDesc")}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between border-b pb-2">
              <span className="text-sm font-medium text-muted-foreground">{t("role")}</span>
              <Badge variant="outline" className="capitalize">
                {user.role?.toLowerCase() || "User"}
              </Badge>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-muted-foreground">{t("twoFactor")}</span>
              <span className="text-sm text-yellow-600">{t("disabled")}</span>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
