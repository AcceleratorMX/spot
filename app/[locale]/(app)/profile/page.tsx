import { auth } from "@/auth";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { ProfileForm } from "@/components/profile-form";

export default async function ProfilePage() {
  const session = await auth();
  const user = session?.user;

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

  // Prepare a clean user object for the form
  const userData = {
    id: user.id || "",
    name: user.name,
    email: user.email || "",
    role: user.role,
  };

  return (
    <div className="flex-1 overflow-auto">
      <div className="container mx-auto max-w-4xl space-y-8 py-10 px-6">
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

        <ProfileForm user={userData} />
      </div>
    </div>
  );
}
