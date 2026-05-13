"use client";

import { useState, useEffect, useCallback } from "react";
import { useSession } from "next-auth/react";
import { useTranslations } from "next-intl";
import {
  updateTask,
  deleteTask,
  createSubtask,
  toggleSubtask,
  deleteSubtask,
  addTaskDependency,
  removeTaskDependency,
} from "@/app/actions/tasks";
import { addTaskLabel, removeTaskLabel } from "@/app/actions/labels";
import { useRouter } from "next/navigation";
import { Priority } from "@prisma/client";
import { Plus, X, Calendar as CalendarIcon, Loader2, Link as LinkIcon } from "lucide-react";
import { format } from "date-fns";
import { uk, enUS } from "date-fns/locale";
import { useLocale } from "next-intl";

import {
  Dialog,
  DialogContent,
  DialogDescription,
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
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { cn } from "@/lib/utils";
import { ActivityHistory } from "./activity-history";
import { EntityType } from "@prisma/client";

type Task = {
  id: string;
  title: string;
  description: string | null;
  priority: Priority;
  dueDate: Date | null;
  participants: { userId: string }[];
  subtasks: { id: string; title: string; isDone: boolean }[];
  labels: { label: { id: string; name: string; color: string } }[];
  dependencies: { precedingTaskId: string }[];
  userId?: string | null;
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
  boardOwnerId: string;
  allTasks: { id: string; title: string }[];
};

export function TaskDetailsDialog({
  task,
  boardId,
  members,
  open,
  onOpenChange,
  allLabels,
  boardOwnerId,
  allTasks,
}: TaskDetailsDialogProps) {
  const [loading, setLoading] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [selectedAssignees, setSelectedAssignees] = useState(
    task.participants.map((p) => p.userId),
  );
  const [title, setTitle] = useState(task.title);
  const [description, setDescription] = useState(task.description || "");
  const [priority, setPriority] = useState<Priority>(task.priority);
  const [dueDate, setDueDate] = useState<Date | undefined>(
    task.dueDate ? new Date(task.dueDate) : undefined,
  );

  const [activityKey, setActivityKey] = useState(0);
  const refreshActivity = useCallback(
    () => setActivityKey((prev) => prev + 1),
    [],
  );

  const { data: session } = useSession();
  const isCreator = session?.user?.id === task.userId;
  const isBoardOwner = session?.user?.id === boardOwnerId;
  const isMember = members.some((m) => m.user.id === session?.user?.id);
  const canEdit = isCreator || isBoardOwner || isMember;

  const router = useRouter();
  const locale = useLocale();
  const dateLocale = locale === "uk" ? uk : enUS;
  const t = useTranslations("boards");

  const [prevTask, setPrevTask] = useState(task);

  // Synchronize internal state when task changes (e.g. from server refresh)
  if (task !== prevTask) {
    setSelectedAssignees(task.participants.map((p) => p.userId));
    setTitle(task.title);
    setDescription(task.description || "");
    setPriority(task.priority);
    setDueDate(task.dueDate ? new Date(task.dueDate) : undefined);
    setPrevTask(task);
  }

  // Auto-save logic
  useEffect(() => {
    if (!open || !canEdit) return;

    const timer = setTimeout(async () => {
      // Check for changes
      const hasTitleChanged = title !== task.title;
      const hasDescriptionChanged = description !== (task.description || "");
      const hasPriorityChanged = priority !== task.priority;
      const hasDateChanged =
        JSON.stringify(dueDate) !==
        JSON.stringify(task.dueDate ? new Date(task.dueDate) : undefined);

      if (
        !hasTitleChanged &&
        !hasDescriptionChanged &&
        !hasPriorityChanged &&
        !hasDateChanged
      ) {
        return;
      }

      setLoading(true);
      await updateTask(task.id, boardId, {
        title,
        description,
        priority,
        dueDate: dueDate || null,
      });
      setLoading(false);
      refreshActivity();
      router.refresh();
    }, 800); // 800ms debounce

    return () => clearTimeout(timer);
  }, [
    title,
    description,
    priority,
    dueDate,
    open,
    canEdit,
    boardId,
    task,
    router,
    refreshActivity,
  ]);

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
    setLoading(true);
    await updateTask(task.id, boardId, { assigneeUserIds: newAssignees });
    setLoading(false);
    refreshActivity();
    router.refresh();
  };

  const [newSubtaskTitle, setNewSubtaskTitle] = useState("");
  const handleAddSubtask = async () => {
    if (!newSubtaskTitle.trim()) return;
    setLoading(true);
    await createSubtask(task.id, newSubtaskTitle, boardId);
    setNewSubtaskTitle("");
    setLoading(false);
    refreshActivity();
    router.refresh();
  };

  const handleToggleSubtask = async (id: string, isDone: boolean) => {
    setLoading(true);
    await toggleSubtask(id, isDone, boardId);
    setLoading(false);
    refreshActivity();
    router.refresh();
  };

  const handleDeleteSubtask = async (id: string) => {
    setLoading(true);
    await deleteSubtask(id, boardId);
    setLoading(false);
    refreshActivity();
    router.refresh();
  };

  const handleToggleLabel = async (labelId: string) => {
    setLoading(true);
    const isSelected = task.labels.some((tl) => tl.label.id === labelId);
    if (isSelected) {
      await removeTaskLabel(task.id, labelId, boardId);
    } else {
      await addTaskLabel(task.id, labelId, boardId);
    }
    setLoading(false);
    refreshActivity();
    router.refresh();
  };

  const handleAddDependency = async (precedingTaskId: string) => {
    setLoading(true);
    const result = await addTaskDependency(boardId, task.id, precedingTaskId);
    setLoading(false);
    if (!result.error) {
      refreshActivity();
      router.refresh();
    }
  };

  const handleRemoveDependency = async (precedingTaskId: string) => {
    setLoading(true);
    const result = await removeTaskDependency(boardId, task.id, precedingTaskId);
    setLoading(false);
    if (!result.error) {
      refreshActivity();
      router.refresh();
    }
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
          <DialogHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <div className="space-y-1">
              <DialogTitle>{t("taskTitle")}</DialogTitle>
              <DialogDescription className="sr-only">
                {t("addTaskDesc")}
              </DialogDescription>
            </div>
            {loading && (
              <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
            )}
          </DialogHeader>

          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label
                htmlFor="title"
                className="text-xs font-bold uppercase text-muted-foreground"
              >
                {t("taskTitle")}
              </Label>
              <Input
                id="title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Task title..."
                className="font-semibold text-lg border-none px-0 focus-visible:ring-0 h-auto"
                disabled={!canEdit}
              />
            </div>

            <div className="grid gap-2">
              <Label
                htmlFor="description"
                className="text-xs font-bold uppercase text-muted-foreground"
              >
                {t("description")}
              </Label>
              <Textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder={t("descPlaceholder")}
                className="resize-none min-h-[100px] bg-muted/30 focus-visible:ring-1"
                disabled={!canEdit}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label
                  htmlFor="priority"
                  className="text-xs font-bold uppercase text-muted-foreground"
                >
                  {t("priority")}
                </Label>
                <Select
                  name="priority"
                  value={priority}
                  onValueChange={(value: Priority) => setPriority(value)}
                  disabled={!canEdit}
                >
                  <SelectTrigger id="priority" className="bg-muted/30">
                    <SelectValue placeholder="Select priority" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value={Priority.LOW}>{t("low")}</SelectItem>
                    <SelectItem value={Priority.MEDIUM}>
                      {t("medium")}
                    </SelectItem>
                    <SelectItem value={Priority.HIGH}>{t("high")}</SelectItem>
                    <SelectItem value={Priority.URGENT}>
                      {t("urgent")}
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-2">
                <Label
                  htmlFor="dueDate"
                  className="text-xs font-bold uppercase text-muted-foreground"
                >
                  {t("dueDate")}
                </Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant={"outline"}
                      className={cn(
                        "w-full justify-start text-left font-normal bg-muted/30",
                        !dueDate && "text-muted-foreground",
                      )}
                      disabled={!canEdit}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {dueDate ? (
                        format(dueDate, "PPP", { locale: dateLocale })
                      ) : (
                        <span>{t("pickDate")}</span>
                      )}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={dueDate}
                      onSelect={(date) => {
                        setDueDate(date);
                        // Force refresh for date as it's not a text input
                        setTimeout(() => refreshActivity(), 500);
                      }}
                      locale={dateLocale}
                    />
                  </PopoverContent>
                </Popover>
              </div>
            </div>

            <div className="grid gap-2">
              <Label className="text-xs font-bold uppercase text-muted-foreground">
                {t("assignee")}
              </Label>
              <div className="flex flex-wrap gap-2 mt-1">
                {members.map((member) => {
                  const isAssigned = selectedAssignees.includes(member.user.id);
                  return (
                    <Badge
                      key={member.user.id}
                      variant={isAssigned ? "default" : "outline"}
                      className="cursor-pointer py-1.5 px-3"
                      onClick={() => canEdit && toggleAssignee(member.user.id)}
                    >
                      {member.user.name || member.user.email}
                    </Badge>
                  );
                })}
              </div>
            </div>

            <div className="grid gap-2">
              <Label className="text-xs font-bold uppercase text-muted-foreground">
                {t("dependencies") || "Dependencies"}
              </Label>
              <div className="space-y-2 mt-1 bg-muted/20 p-3 rounded-lg border border-dashed border-muted-foreground/30">
                <div className="flex flex-wrap gap-2">
                  {task.dependencies.map((dep) => {
                    const depTask = allTasks.find(t => t.id === dep.precedingTaskId);
                    return (
                      <Badge key={dep.precedingTaskId} variant="secondary" className="pl-2 pr-1 py-1 gap-1 flex items-center">
                        <LinkIcon className="h-3 w-3 text-muted-foreground" />
                        <span className="max-w-[150px] truncate">{depTask?.title || dep.precedingTaskId}</span>
                        {canEdit && (
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-4 w-4 hover:bg-destructive hover:text-destructive-foreground rounded-full"
                            onClick={() => handleRemoveDependency(dep.precedingTaskId)}
                          >
                            <X className="h-3 w-3" />
                          </Button>
                        )}
                      </Badge>
                    );
                  })}
                  {task.dependencies.length === 0 && (
                    <span className="text-xs text-muted-foreground italic">{t("noDependencies") || "No dependencies"}</span>
                  )}
                </div>
                
                {canEdit && (
                  <div className="mt-3">
                    <Select onValueChange={handleAddDependency}>
                      <SelectTrigger className="h-8 text-xs bg-background">
                        <Plus className="h-3.3 w-3.3 mr-2" />
                        <SelectValue placeholder={t("addDependency") || "Add dependency..."} />
                      </SelectTrigger>
                      <SelectContent>
                        {allTasks
                          .filter(t => 
                            t.id !== task.id && 
                            !task.dependencies.some(d => d.precedingTaskId === t.id)
                          )
                          .map(t => (
                            <SelectItem key={t.id} value={t.id} className="text-xs">
                              {t.title}
                            </SelectItem>
                          ))
                        }
                        {allTasks.length <= 1 && (
                          <div className="p-2 text-xs text-muted-foreground italic">No other tasks available</div>
                        )}
                      </SelectContent>
                    </Select>
                  </div>
                )}
              </div>
            </div>

            <div className="grid gap-2">
              <Label className="text-xs font-bold uppercase text-muted-foreground">
                {t("labels")}
              </Label>
              <div className="flex flex-wrap gap-2 mt-1">
                {allLabels.map((label) => {
                  const isSelected = task.labels.some(
                    (tl) => tl.label.id === label.id,
                  );
                  return (
                    <Badge
                      key={label.id}
                      variant={isSelected ? "default" : "outline"}
                      className="cursor-pointer"
                      style={{
                        backgroundColor: isSelected
                          ? label.color
                          : "transparent",
                        borderColor: label.color,
                        color: isSelected ? "white" : "inherit",
                      }}
                      onClick={() => canEdit && handleToggleLabel(label.id)}
                    >
                      {label.name}
                    </Badge>
                  );
                })}
              </div>
            </div>

            <div className="grid gap-2">
              <Label className="text-xs font-bold uppercase text-muted-foreground">
                {t("subtasks")}
              </Label>
              <div className="space-y-2 mt-1 bg-muted/20 p-3 rounded-lg border border-dashed border-muted-foreground/30">
                {task.subtasks.map((subtask) => (
                  <div
                    key={subtask.id}
                    className="flex items-center justify-between group"
                  >
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id={`sub-${subtask.id}`}
                        checked={subtask.isDone}
                        onCheckedChange={(checked) =>
                          handleToggleSubtask(subtask.id, !!checked)
                        }
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
                    className="h-8 bg-background"
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

            <div className="flex items-center justify-between mt-2 pt-2 border-t">
              <span className="text-[10px] text-muted-foreground italic">
                {loading ? "Saving changes..." : "All changes saved"}
              </span>
              {canEdit && (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="h-8 text-destructive hover:text-destructive hover:bg-destructive/10"
                  onClick={() => setShowDeleteConfirm(true)}
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete Task
                </Button>
              )}
            </div>

            <ActivityHistory
              entityId={task.id}
              entityType={EntityType.TASK}
              refreshKey={activityKey}
            />
          </div>
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
