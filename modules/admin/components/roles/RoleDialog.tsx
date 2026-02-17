"use client";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/useToast";
import { Role } from "../../types/role";
import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Plus, Eye } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { Checkbox } from "@/components/ui/checkbox";
import { usePermissions } from "../../hooks/usePermissions";
import { Search } from "lucide-react";

const roleSchema = z.object({
  name: z.string()
    .min(1, "El nombre es requerido")
    .regex(/^ROLE_/, "El nombre debe comenzar con 'ROLE_'")
    .transform(val => val.toUpperCase()),
  description: z.string().min(1, "La descripción es requerida"),
  isDefault: z.boolean().default(false),
  level: z.number().min(0).default(0),
  permissions: z.array(z.string()).default([]),
});

type RoleFormData = z.infer<typeof roleSchema>;

interface RoleDialogProps {
  role?: Role;
  onSubmit: (data: RoleFormData) => Promise<void>;
  trigger?: React.ReactNode;
  title: string;
  onClose?: () => void;
}

export function RoleDialog({ role, onSubmit, trigger, title, onClose }: RoleDialogProps) {
  const [open, setOpen] = useState(!!role);
  const [searchTerm, setSearchTerm] = useState("");
  const { toast } = useToast();
  const { permissions } = usePermissions();

  // Filtrar permisos basado en el término de búsqueda
  const filteredPermissions = permissions.filter(permission =>
    permission.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    permission.description.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Abrir automáticamente cuando se pasa un role para editar
  useEffect(() => {
    if (role && !trigger) {
      setOpen(true);
    }
  }, [role, trigger]);

  const form = useForm<RoleFormData>({
    resolver: zodResolver(roleSchema),
    defaultValues: {
      name: role?.name || "",
      description: role?.description || "",
      isDefault: role?.isDefault || false,
      level: role?.level || 0,
      permissions: role?.permissions?.map(p => p.id) || [],
    },
  });

  const handleSubmit = async (data: RoleFormData) => {
    try {
      await onSubmit(data);
      setOpen(false);
      form.reset();
      onClose?.();
      toast({
        title: "Success",
        description: `Role ${role ? "updated" : "created"} successfully`,
      });
    } catch (error) {
      toast({
        title: "Error",
        description: `Error ${role ? "updating" : "creating"} role`,
        variant: "destructive",
      });
    }
  };

  const handleOpenChange = (newOpen: boolean) => {
    setOpen(newOpen);
    if (!newOpen) {
      onClose?.();
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        {trigger || (
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            Create Role
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-hidden">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4 overflow-y-auto max-h-[calc(90vh-8rem)] pr-2">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Name</FormLabel>
                  <FormControl>
                    <Input placeholder="Role name" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Role description"
                      {...field}
                      rows={3}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="isDefault"
              render={({ field }) => (
                <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                  <div className="space-y-0.5">
                    <FormLabel>Default Role</FormLabel>
                    <div className="text-sm text-muted-foreground">
                      Make this a default role for new users
                    </div>
                  </div>
                  <FormControl>
                    <Switch
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="level"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Level</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      placeholder="Role level"
                      {...field}
                      onChange={(e) => {
                        const value = e.target.value;
                        field.onChange(value === '' ? 0 : Number(value) || 0);
                      }}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <div className="space-y-4">
              <FormField
                control={form.control}
                name="permissions"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Permisos</FormLabel>
                    <div className="space-y-3">
                      <div className="relative">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                        <Input
                          placeholder="Buscar permisos..."
                          value={searchTerm}
                          onChange={(e) => setSearchTerm(e.target.value)}
                          className="pl-10"
                        />
                      </div>
                      <div className="grid grid-cols-1 gap-3 p-4 border rounded-lg max-h-60 overflow-y-auto">
                        {filteredPermissions.length > 0 ? (
                          filteredPermissions.map((permission) => (
                        <div key={permission.id} className="flex items-center space-x-2">
                          <Checkbox
                            checked={field.value?.includes(permission.id)}
                            onCheckedChange={(checked) => {
                              const updatedPermissions = checked
                                ? [...field.value, permission.id]
                                : field.value.filter((id: string) => id !== permission.id);
                              field.onChange(updatedPermissions);
                            }}
                          />
                          <div className="grid gap-1.5 leading-none">
                            <label
                              htmlFor={permission.id}
                              className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                            >
                              {permission.name}
                            </label>
                            <p className="text-sm text-muted-foreground">
                              {permission.description}
                            </p>
                          </div>
                            </div>
                          ))
                        ) : (
                          <div className="text-center py-4 text-gray-500">
                            No se encontraron permisos que coincidan con la búsqueda
                          </div>
                        )}
                      </div>
                    </div>
                  </FormItem>
                )}
              />
              <Button type="submit" className="w-full">
                {role ? "Update" : "Create"} Role
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}