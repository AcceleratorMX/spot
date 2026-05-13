"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { UserPlus } from "lucide-react";
import { inviteMember } from "@/app/actions/boards";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type InviteMemberDialogProps = {
  boardId: string;
};

export function InviteMemberDialog({ boardId }: InviteMemberDialogProps) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const t = useTranslations("boards");

  async function handleAction(formData: FormData) {
    setLoading(true);
    setError(null);

    const email = formData.get("email") as string;
    const result = await inviteMember(boardId, email);

    if (result.error) {
      setError(result.error);
      setLoading(false);
    } else {
      setOpen(false);
      setLoading(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="h-8">
          <UserPlus className="mr-2 h-4 w-4" />
          {t("invite")}
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <form action={handleAction}>
          <DialogHeader>
            <DialogTitle>{t("inviteMember")}</DialogTitle>
            <DialogDescription>
              {t("emailPlaceholder")}
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                name="email"
                type="email"
                placeholder={t("emailPlaceholder")}
                required
                disabled={loading}
              />
              {error && <p className="text-sm text-destructive">{error}</p>}
            </div>
          </div>
          <DialogFooter>
            <Button type="submit" disabled={loading}>
              {loading ? "..." : t("invite")}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
