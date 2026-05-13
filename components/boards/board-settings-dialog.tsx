"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Settings, Plus, Trash2 } from "lucide-react";
import { createLabel, deleteLabel } from "@/app/actions/labels";
import { updateBoard } from "@/app/actions/boards";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";

type BoardSettingsDialogProps = {
  board: {
    id: string;
    title: string;
    description: string | null;
    userId: string;
    labels: { id: string; name: string; color: string }[];
  };
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
};

export function BoardSettingsDialog({ 
  board,
  open: controlledOpen,
  onOpenChange: controlledOnOpenChange 
}: BoardSettingsDialogProps) {
  const [internalOpen, setInternalOpen] = useState(false);
  const open = controlledOpen ?? internalOpen;
  const setOpen = controlledOnOpenChange ?? setInternalOpen;
  
  const [loading, setLoading] = useState(false);
  const [newLabelName, setNewLabelName] = useState("");
  const [newLabelColor, setNewLabelColor] = useState("#3b82f6");
  const t = useTranslations("boards");

  const handleUpdateBoard = async (formData: FormData) => {
    setLoading(true);
    const title = formData.get("title") as string;
    const description = formData.get("description") as string;
    
    await updateBoard(board.id, { title, description });
    setLoading(false);
    setOpen(false);
  };

  const handleCreateLabel = async () => {
    if (!newLabelName.trim()) return;
    setLoading(true);
    await createLabel(board.id, newLabelName, newLabelColor);
    setNewLabelName("");
    setLoading(false);
  };

  const handleDeleteLabel = async (id: string) => {
    setLoading(true);
    await deleteLabel(id, board.id);
    setLoading(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      {controlledOpen === undefined && (
        <DialogTrigger asChild>
          <Button variant="ghost" size="icon">
            <Settings className="h-4 w-4" />
          </Button>
        </DialogTrigger>
      )}
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>{t("boardSettings") || "Board Settings"}</DialogTitle>
          <DialogDescription className="sr-only">
            Manage board metadata and labels.
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-6 py-4">
          <form action={handleUpdateBoard} className="space-y-4">
            <div className="grid gap-2">
              <Label htmlFor="title">{t("boardTitle")}</Label>
              <Input
                id="title"
                name="title"
                defaultValue={board.title}
                required
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="description">{t("description")}</Label>
              <Textarea
                id="description"
                name="description"
                defaultValue={board.description || ""}
                placeholder={t("descPlaceholder")}
              />
            </div>
            <Button type="submit" disabled={loading} className="w-full">
              {loading ? "..." : t("saveChanges") || "Save Changes"}
            </Button>
          </form>

          <div className="border-t pt-6 space-y-4">
            <Label>{t("manageLabels") || "Manage Labels"}</Label>
            <div className="flex flex-wrap gap-2">
              {board.labels.map((label) => (
                <Badge
                  key={label.id}
                  className="flex items-center gap-1 pl-2 pr-1 py-1"
                  style={{ backgroundColor: label.color, color: "white" }}
                >
                  {label.name}
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-4 w-4 text-white hover:bg-white/20"
                    onClick={() => handleDeleteLabel(label.id)}
                    disabled={loading}
                  >
                    <Trash2 className="h-3 w-3" />
                  </Button>
                </Badge>
              ))}
            </div>
            
            <div className="flex items-end gap-2 mt-2">
              <div className="grid gap-1.5 flex-1">
                <Label htmlFor="labelName" className="text-[10px] uppercase font-bold text-muted-foreground">
                  Label Name
                </Label>
                <Input
                  id="labelName"
                  placeholder="Feature, Bug, etc."
                  value={newLabelName}
                  onChange={(e) => setNewLabelName(e.target.value)}
                  className="h-8"
                />
              </div>
              <div className="grid gap-1.5 w-20">
                <Label htmlFor="labelColor" className="text-[10px] uppercase font-bold text-muted-foreground">
                  Color
                </Label>
                <Input
                  id="labelColor"
                  type="color"
                  value={newLabelColor}
                  onChange={(e) => setNewLabelColor(e.target.value)}
                  className="h-8 p-1 cursor-pointer"
                />
              </div>
              <Button
                type="button"
                size="icon"
                className="h-8 w-8"
                onClick={handleCreateLabel}
                disabled={loading}
              >
                <Plus className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
