"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { updateTask, deleteTask, createSubtask, toggleSubtask, deleteSubtask } from "@/app/actions/tasks";
import { addTaskLabel, removeTaskLabel } from "@/app/actions/labels";
import { useRouter } from "next/navigation";
import { Priority } from "@prisma/client";
import { Plus, X } from "lucide-react";

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
import { Badge } from "@/components/ui/badge";

type Task = {
  id: string;
  title: string;
  description: string | null;
  priority: Priority;
  dueDate: Date | null;
  participants: { userId: string }[];
  subtasks: { id: string; title: string; isDone: boolean }[];
  labels: { label: { id: string; name: string; color: string } }[];
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
  allLabels: { id: string; name: string; color: string }[];
};

export function TaskDetailsDialog({
  task,
  boardId,
  members,
  open,
  onOpenChange,
  allLabels,
}: TaskDetailsDialogProps) {
  const [loading, setLoading] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [selectedAssignees, setSelectedAssignees] = useState(
    task.participants.map((p) => p.userId)
  );
  const [title, setTitle] = useState(task.title);
  const [description, setDescription] = useState(task.description || "");
  const [priority, setPriority] = useState<Priority>(task.priority);
  const [dueDate, setDueDate] = useState(task.dueDate ? new Date(task.dueDate).toISOString().split("T")[0] : "");
  const router = useRouter();

  const [prevTask, setPrevTask] = useState(task);

  if (task !== prevTask) {
    setSelectedAssignees(task.participants.map((p) => p.userId));
    setTitle(task.title);
    setDescription(task.description || "");
    setPriority(task.priority);
    setDueDate(task.dueDate ? new Date(task.dueDate).toISOString().split("T")[0] : "");
    setPrevTask(task);
  }
  const t = useTranslations("boards");

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);

    await updateTask(task.id, boardId, {
      title,
      description,
      priority,
      dueDate: dueDate ? new Date(dueDate) : null,
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

  const toggleAssignee = async (userId: string) => {
    const newAssignees = selectedAssignees.includes(userId)
      ? selectedAssignees.filter((id) => id !== userId)
      : [...selectedAssignees, userId];
    
    setSelectedAssignees(newAssignees);
    await updateTask(task.id, boardId, { assigneeUserIds: newAssignees });
    router.refresh();
  };

  const [newSubtaskTitle, setNewSubtaskTitle] = useState("");
  const handleAddSubtask = async () => {
    if (!newSubtaskTitle.trim()) return;
    await createSubtask(task.id, newSubtaskTitle, boardId);
    setNewSubtaskTitle("");
    router.refresh();
  };

  const handleToggleSubtask = async (id: string, isDone: boolean) => {
    await toggleSubtask(id, isDone, boardId);
    router.refresh();
  };

  const handleDeleteSubtask = async (id: string) => {
    await deleteSubtask(id, boardId);
    router.refresh();
  };

  const handleToggleLabel = async (labelId: string) => {
    const isSelected = task.labels.some((tl) => tl.label.id === labelId);
    if (isSelected) {
      await removeTaskLabel(task.id, labelId, boardId);
    } else {
      await addTaskLabel(task.id, labelId, boardId);
    }
    router.refresh();
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{t("taskTitle")}</DialogTitle>
            <DialogDescription className="sr-only">
              {t("addTaskDesc")}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={onSubmit}>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="title">{t("taskTitle")}</Label>
                <Input
                  id="title"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  required
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="description">{t("description")}</Label>
                <Textarea
                  id="description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder={t("descPlaceholder")}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="priority">{t("priority")}</Label>
                  <Select
                    name="priority"
                    value={priority}
                    onValueChange={(value: Priority) => setPriority(value)}
                  >
                    <SelectTrigger id="priority">
                      <SelectValue placeholder="Select priority" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value={Priority.LOW}>{t("low")}</SelectItem>
                      <SelectItem value={Priority.MEDIUM}>{t("medium")}</SelectItem>
                      <SelectItem value={Priority.HIGH}>{t("high")}</SelectItem>
                      <SelectItem value={Priority.URGENT}>{t("urgent")}</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="dueDate">{t("dueDate")}</Label>
                  <Input
                    id="dueDate"
                    name="dueDate"
                    type="date"
                    value={dueDate}
                    onChange={(e) => setDueDate(e.target.value)}
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

              <div className="grid gap-2">
                <Label>{t("labels") || "Labels"}</Label>
                <div className="flex flex-wrap gap-2 mt-1">
                  {allLabels.map((label) => {
                    const isSelected = task.labels.some((l) => l.label.id === label.id);
                    return (
                      <Badge
                        key={label.id}
                        variant={isSelected ? "default" : "outline"}
                        className="cursor-pointer"
                        style={{
                          backgroundColor: isSelected ? label.color : "transparent",
                          borderColor: label.color,
                          color: isSelected ? "white" : "inherit",
                        }}
                        onClick={() => handleToggleLabel(label.id)}
                      >
                        {label.name}
                      </Badge>
                    );
                  })}
                </div>
              </div>

              <div className="grid gap-2">
                <Label>{t("subtasks") || "Subtasks"}</Label>
                <div className="space-y-2 mt-1">
                  {task.subtasks.map((subtask) => (
                    <div key={subtask.id} className="flex items-center justify-between group">
                      <div className="flex items-center space-x-2">
                        <Checkbox
                          id={`sub-${subtask.id}`}
                          checked={subtask.isDone}
                          onCheckedChange={(checked) => handleToggleSubtask(subtask.id, !!checked)}
                        />
                        <Label
                          htmlFor={`sub-${subtask.id}`}
                          className={`text-sm font-normal cursor-pointer ${subtask.isDone ? "line-through text-muted-foreground" : ""}`}
                        >
                          {subtask.title}
                        </Label>
                      </div>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
                        onClick={() => handleDeleteSubtask(subtask.id)}
                      >
                        <X className="h-3 w-3" />
                      </Button>
                    </div>
                  ))}
                  <div className="flex items-center gap-2 mt-2">
                    <Input
                      placeholder={t("addSubtask") || "Add subtask..."}
                      value={newSubtaskTitle}
                      onChange={(e) => setNewSubtaskTitle(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          e.preventDefault();
                          handleAddSubtask();
                        }
                      }}
                      className="h-8"
                    />
                    <Button
                      type="button"
                      size="icon"
                      className="h-8 w-8"
                      onClick={handleAddSubtask}
                    >
                      <Plus className="h-4 w-4" />
                    </Button>
                  </div>
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
