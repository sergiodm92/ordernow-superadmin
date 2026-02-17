"use client";

import { useState } from "react";
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
import { Textarea } from "@/components/ui/textarea";
import { createNotification } from "../services/notificationService";
import { CreateNotificationPayload } from "../types/notification";
import { toast } from "sonner";
import { Plus } from "lucide-react";

interface CreateNotificationDialogProps {
  defaultType: "PLATFORM" | "ESTABLISHMENT";
}

export function CreateNotificationDialog({ defaultType }: CreateNotificationDialogProps) {
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [type, setType] = useState<"PLATFORM" | "ESTABLISHMENT">(defaultType);
  const [establishmentId, setEstablishmentId] = useState<string>("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    if (!title.trim() || !body.trim()) {
      toast.error("Title and body are required");
      return;
    }

    if (type === "ESTABLISHMENT" && !establishmentId) {
      toast.error("Please select an establishment");
      return;
    }

    setLoading(true);
    try {
      const payload: CreateNotificationPayload = {
        title: title.trim(),
        body: body.trim(),
        type,
      };

      if (type === "ESTABLISHMENT" && establishmentId) {
        payload.establishmentId = Number(establishmentId);
      }

      await createNotification(payload);
      toast.success("Notification sent successfully");
      setOpen(false);
      setTitle("");
      setBody("");
      setEstablishmentId("");
    } catch {
      toast.error("Failed to send notification");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <Plus className="h-4 w-4 mr-2" />
          {defaultType === "PLATFORM" ? "Create Notification" : "Send to Customers"}
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Create Notification</DialogTitle>
          <DialogDescription>
            {defaultType === "PLATFORM"
              ? "Send a notification to all restaurant owners."
              : "Send a notification to all customers."}
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid gap-2">
            <Label htmlFor="title">Title</Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Notification title"
              maxLength={150}
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="body">Body</Label>
            <Textarea
              id="body"
              value={body}
              onChange={(e) => setBody(e.target.value)}
              placeholder="Notification body"
              maxLength={1000}
              rows={4}
            />
          </div>
          {defaultType === "ESTABLISHMENT" && (
            <div className="grid gap-2">
              <Label htmlFor="establishment">Establishment ID</Label>
              <Input
                id="establishment"
                value={establishmentId}
                onChange={(e) => setEstablishmentId(e.target.value)}
                placeholder="Enter establishment ID"
                type="number"
              />
            </div>
          )}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={loading}>
            {loading ? "Sending..." : "Send Notification"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
