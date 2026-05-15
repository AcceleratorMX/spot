"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Settings, Plus, Trash2, UserMinus, UserPlus } from "lucide-react";
import { createLabel, deleteLabel } from "@/app/actions/labels";
import { updateBoard, inviteMember, removeMember } from "@/app/actions/boards";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

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
    members: {
      user: {
        id: string;
        name: string | null;
        email: string;
        image?: string | null;
      };
    }[];
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
  const [inviteEmail, setInviteEmail] = useState("");
  const t = useTranslations("boards");

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

  const handleInviteMember = async () => {
    if (!inviteEmail.trim()) return;
    setLoading(true);
    await inviteMember(board.id, inviteEmail);
    setInviteEmail("");
    setLoading(false);
  };

  const handleRemoveMember = async (userId: string) => {
    setLoading(true);
    await removeMember(board.id, userId);
    setLoading(false);
  };

  const handleUpdateField = async (field: "title" | "description", value: string) => {
    if (value === board[field]) return;
    setLoading(true);
    await updateBoard(board.id, { [field]: value });
    setLoading(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      {controlledOpen === undefined && (
        <DialogTrigger asChild>
          <Button variant="ghost" size="icon" id="board-settings-trigger">
            <Settings className="h-4 w-4" />
          </Button>
        </DialogTrigger>
      )}
      <DialogContent className="sm:max-w-[550px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{t("boardSettings") || "Board Settings"}</DialogTitle>
          <DialogDescription className="sr-only">
            Manage board metadata, labels, and members.
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-8 py-4">
          <div className="space-y-4">
            <div className="grid gap-2">
              <Label htmlFor="title">{t("boardTitle")}</Label>
              <Input
                id="title"
                name="title"
                defaultValue={board.title}
                onBlur={(e) => handleUpdateField("title", e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    handleUpdateField("title", e.currentTarget.value);
                  }
                }}
                required
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="description">{t("description")}</Label>
              <Textarea
                id="description"
                name="description"
                defaultValue={board.description || ""}
                onBlur={(e) => handleUpdateField("description", e.target.value)}
                placeholder={t("descPlaceholder")}
              />
            </div>
          </div>

          {/* Members Management */}
          <div className="border-t pt-6 space-y-4">
            <Label className="text-base font-semibold">{t("manageMembers") || "Manage Members"}</Label>
            
            <div className="flex gap-2">
              <Input
                id="invite-member-input"
                placeholder={t("emailPlaceholder") || "Enter email address"}
                type="email"
                value={inviteEmail}
                onChange={(e) => setInviteEmail(e.target.value)}
                disabled={loading}
              />
              <Button 
                id="invite-member-submit"
                type="button" 
                onClick={handleInviteMember} 
                disabled={loading || !inviteEmail.trim()}
              >
                <UserPlus className="h-4 w-4 mr-2" />
                {t("invite")}
              </Button>
            </div>

            <div className="space-y-3 mt-4">
              {board.members.map((member) => (
                <div key={member.user.id} className="flex items-center justify-between p-2 rounded-lg border bg-muted/30">
                  <div className="flex items-center gap-3">
                    <Avatar className="h-8 w-8">
                      <AvatarImage src={member.user.image || ""} />
                      <AvatarFallback>
                        {member.user.name?.[0] || member.user.email[0]}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex flex-col">
                      <span className="text-sm font-medium">
                        {member.user.name || member.user.email}
                        {member.user.id === board.userId && (
                          <Badge variant="outline" className="ml-2 text-[10px] py-0">Owner</Badge>
                        )}
                      </span>
                      {member.user.name && (
                        <span className="text-xs text-muted-foreground">{member.user.email}</span>
                      )}
                    </div>
                  </div>
                  {member.user.id !== board.userId && (
                    <Button
                      id={`remove-member-${member.user.id}`}
                      variant="ghost"
                      size="icon"
                      className="text-destructive hover:text-destructive hover:bg-destructive/10"
                      onClick={() => handleRemoveMember(member.user.id)}
                      disabled={loading}
                    >
                      <UserMinus className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Labels Management */}
          <div className="border-t pt-6 space-y-4">
            <Label className="text-base font-semibold">{t("manageLabels") || "Manage Labels"}</Label>
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
