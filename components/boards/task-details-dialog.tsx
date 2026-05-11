"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { updateTask, deleteTask } from "@/app/actions/tasks";
import { Priority } from "@prisma/client";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Trash2 } from "lucide-react";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";

type Task = {
  id: string;
  title: string;
  description: string | null;
  priority: Priority;
  dueDate: Date | null;
  participants: { userId: string }[];
};

type Member = {
  user: {
    id: string;
    name: string | null;
    email: string;
  };
};

type TaskDetailsDialogProps = {
  task: Task;
  boardId: string;
  members: Member[];
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

export function TaskDetailsDialog({
  task,
  boardId,
  members,
  open,
  onOpenChange,
}: TaskDetailsDialogProps) {
  const [loading, setLoading] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [selectedAssignees, setSelectedAssignees] = useState<string[]>(
    task.participants.map((a) => a.userId)
  );
  const t = useTranslations("boards");

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);

    const formData = new FormData(event.currentTarget);
    const title = formData.get("title") as string;
    const description = formData.get("description") as string;
    const priority = formData.get("priority") as Priority;
    const dueDateStr = formData.get("dueDate") as string;
    const dueDate = dueDateStr ? new Date(dueDateStr) : null;

    await updateTask(task.id, boardId, {
      title,
      description,
      priority,
      dueDate,
      assigneeUserIds: selectedAssignees,
    });

    setLoading(false);
    onOpenChange(false);
  }

  const handleDelete = async () => {
    setLoading(true);
    await deleteTask(task.id, boardId);
    setLoading(false);
    onOpenChange(false);
  };

  const toggleAssignee = (userId: string) => {
    setSelectedAssignees((prev) =>
      prev.includes(userId)
        ? prev.filter((id) => id !== userId)
        : [...prev, userId]
    );
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-[500px]">
          <form onSubmit={onSubmit}>
            <DialogHeader>
              <DialogTitle>{t("taskTitle")}</DialogTitle>
              <DialogDescription>{t("addTaskDesc")}</DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="title">{t("taskTitle")}</Label>
                <Input
                  id="title"
                  name="title"
                  defaultValue={task.title}
                  required
                  disabled={loading}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="description">{t("description")}</Label>
                <Textarea
                  id="description"
                  name="description"
                  defaultValue={task.description || ""}
                  placeholder={t("descPlaceholder")}
                  disabled={loading}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="priority">{t("priority")}</Label>
                  <Select name="priority" defaultValue={task.priority}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="LOW">{t("low")}</SelectItem>
                      <SelectItem value="MEDIUM">{t("medium")}</SelectItem>
                      <SelectItem value="HIGH">{t("high")}</SelectItem>
                      <SelectItem value="URGENT">{t("urgent")}</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="dueDate">{t("dueDate")}</Label>
                  <Input
                    id="dueDate"
                    name="dueDate"
                    type="date"
                    defaultValue={task.dueDate ? new Date(task.dueDate).toISOString().split('T')[0] : ""}
                    disabled={loading}
                  />
                </div>
              </div>
              <div className="grid gap-2">
                <Label>{t("assignee")}</Label>
                <div className="grid grid-cols-2 gap-2 mt-1">
                  {members.map((member) => (
                    <div key={member.user.id} className="flex items-center space-x-2">
                      <Checkbox
                        id={`user-${member.user.id}`}
                        checked={selectedAssignees.includes(member.user.id)}
                        onCheckedChange={() => toggleAssignee(member.user.id)}
                      />
                      <Label
                        htmlFor={`user-${member.user.id}`}
                        className="text-sm font-normal cursor-pointer"
                      >
                        {member.user.name || member.user.email}
                      </Label>
                    </div>
                  ))}
                </div>
              </div>
            </div>
            <DialogFooter className="flex items-center justify-between">
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="text-destructive"
                onClick={() => setShowDeleteConfirm(true)}
                disabled={loading}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
              <div className="flex gap-2">
                <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={loading}>
                  {loading ? "..." : "Save changes"}
                </Button>
              </div>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={showDeleteConfirm}
        onOpenChange={setShowDeleteConfirm}
        onConfirm={handleDelete}
        title="Delete Task"
        description="Are you sure you want to delete this task? This action cannot be undone."
        variant="destructive"
        confirmText="Delete"
      />
    </>
  );
}
