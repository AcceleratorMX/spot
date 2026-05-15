import { getTranslations } from "next-intl/server";
import { LayoutDashboard, Users, CheckSquare, Calendar, AlertCircle, Star, Activity } from "lucide-react";
import { CreateBoardDialog } from "@/components/boards/create-board-dialog";
import { getDashboardData } from "@/app/actions/dashboard";
import { StatsCard } from "@/components/dashboard/stats-card";
import { RecentActivity } from "@/components/dashboard/recent-activity";
import { FavoriteBoards } from "@/components/dashboard/favorite-boards";
import { MyTasks } from "@/components/dashboard/my-tasks";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Link } from "@/i18n/navigation";
import { RefreshHandler } from "@/components/dashboard/refresh-handler";

type Props = {
  params: Promise<{ locale: string }>;
};

export default async function DashboardPage({ params }: Props) {
  await params;
  const data = await getDashboardData();
  const t = await getTranslations("dashboard");

  return (
    <div className="flex-1 overflow-auto p-6 bg-slate-50/40 dark:bg-slate-950/40">
      <RefreshHandler />
      <div className="space-y-8 max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-lg shadow-primary/20">
              <LayoutDashboard className="h-6 w-6" />
            </div>
            <div>
              <h1 className="text-3xl font-bold tracking-tight">
                {t("welcome", { name: data.user.name || "User" })}
              </h1>
              <p className="text-muted-foreground">{t("subtitle")}</p>
            </div>
          </div>
          <CreateBoardDialog />
        </div>

        {/* Stats Grid */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <StatsCard
            title={t("stats.totalBoards")}
            value={data.stats.totalBoards}
            icon={Users}
            className="border-none shadow-sm bg-background"
          />
          <StatsCard
            title={t("stats.assignedTasks")}
            value={data.stats.assignedTasksCount}
            icon={CheckSquare}
            className="border-none shadow-sm bg-background"
          />
          <StatsCard
            title={t("stats.upcomingDeadlines")}
            value={data.stats.upcomingDeadlinesCount}
            icon={Calendar}
            className="border-none shadow-sm bg-background"
          />
          <StatsCard
            title={t("stats.highPriority")}
            value={data.stats.highPriorityTasksCount}
            icon={AlertCircle}
            className="border-none shadow-sm bg-background"
          />
        </div>

        <div className="grid gap-8 lg:grid-cols-12">
          {/* Main Content (Tasks & Activity) */}
          <div className="lg:col-span-8 space-y-8">
            {/* My Tasks */}
            <Card className="shadow-sm border-muted/40">
              <CardHeader className="flex flex-row items-center justify-between">
                <div className="flex items-center gap-2">
                  <CheckSquare className="h-5 w-5 text-primary" />
                  <CardTitle className="text-lg">{t("myTasks")}</CardTitle>
                </div>
                <Button variant="ghost" size="sm" asChild>
                  <Link href="/boards">{t("viewAllTasks")}</Link>
                </Button>
              </CardHeader>
              <CardContent>
                <MyTasks tasks={data.myTasks} />
              </CardContent>
            </Card>

            {/* Recent Activity */}
            <Card className="shadow-sm border-muted/40">
              <CardHeader>
                <div className="flex items-center gap-2">
                  <Activity className="h-5 w-5 text-primary" />
                  <CardTitle className="text-lg">{t("recentActivity")}</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <RecentActivity logs={data.recentActivity} />
              </CardContent>
            </Card>
          </div>

          {/* Sidebar (Favorites) */}
          <div className="lg:col-span-4 space-y-8">
            <Card className="shadow-sm border-muted/40 h-fit">
              <CardHeader className="flex flex-row items-center justify-between">
                <div className="flex items-center gap-2">
                  <Star className="h-5 w-5 text-amber-500 fill-amber-500" />
                  <CardTitle className="text-lg">{t("favoriteBoards")}</CardTitle>
                </div>
                <Button variant="ghost" size="sm" asChild>
                  <Link href="/boards">{t("viewAllBoards")}</Link>
                </Button>
              </CardHeader>
              <CardContent>
                <FavoriteBoards boards={data.favoriteBoards} />
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
