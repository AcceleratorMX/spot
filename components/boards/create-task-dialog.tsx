"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Plus } from "lucide-react";
import { createTask } from "@/app/actions/tasks";

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

type CreateTaskDialogProps = {
  columnId: string;
  boardId: string;
};

export function CreateTaskDialog({ columnId, boardId }: CreateTaskDialogProps) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const t = useTranslations("boards");

  async function handleAction(formData: FormData) {
    setLoading(true);
    const title = formData.get("title") as string;
    await createTask(columnId, title, boardId);
    setOpen(false);
    setLoading(false);
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className="mt-2 w-full justify-start text-muted-foreground hover:text-foreground"
        >
          <Plus className="mr-2 h-4 w-4" />
          {t("addTask")}
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>{t("addTask")}</DialogTitle>
          <DialogDescription>{t("addTaskDesc")}</DialogDescription>
        </DialogHeader>
        <form action={handleAction}>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="title">{t("taskTitle")}</Label>
              <Input
                id="title"
                name="title"
                placeholder={t("taskPlaceholder")}
                required
                disabled={loading}
                autoFocus
              />
            </div>
          </div>
          <DialogFooter>
            <Button type="submit" disabled={loading} id="create-task-submit">
              {loading ? "..." : t("addTask")}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
