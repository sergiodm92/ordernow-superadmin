"use client";

import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { useMutation } from "@tanstack/react-query";
import { deleteUserService } from "../../services/userService";
import { TrashIcon } from "lucide-react";
import toastConfirm from "@/components/common/ToastConfirm";

interface DeleteUserDialogProps {
  userId: string;
  userName: string;
  onSuccess: () => void;
}

export function DeleteUserDialog({ userId, userName, onSuccess }: DeleteUserDialogProps) {
  const deleteUserMutation = useMutation({
    mutationFn: deleteUserService,
    onSuccess: () => {
      toast.success("Usuario eliminado exitosamente");
      onSuccess();
    },
    onError: () => {
      toast.error("Error al eliminar usuario. Por favor, intente nuevamente.");
    },
  });

  const handleDelete = () => {
    toastConfirm(
      () => deleteUserMutation.mutate(userId),
      `¿Estás seguro que deseas eliminar al usuario ${userName}? Esta acción no se puede deshacer.`
    );
  };

  return (
    <Button variant="ghost" size="sm" className="text-red-600" onClick={handleDelete}>
      <TrashIcon className="h-4 w-4" />
    </Button>
  );
}