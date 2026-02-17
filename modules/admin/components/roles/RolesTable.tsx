"use client";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useEffect, useState } from "react";
import { Pencil, Trash2, Search, Star, Shield, Eye } from "lucide-react";
import { Role } from "../../types/role";
import { useToast } from "@/hooks/useToast";
import toastConfirm from "@/components/common/ToastConfirm";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";

interface RolesTableProps {
  roles: Role[];
  onEdit: (role: Role) => void;
  onDelete: (roleId: string) => void;
}

export function RolesTable({ roles = [], onEdit, onDelete }: RolesTableProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [filteredRoles, setFilteredRoles] = useState<Role[]>([]);
  const [selectedRole, setSelectedRole] = useState<Role | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    const filtered = (roles || []).filter(
      (role) =>
        role.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        role.description.toLowerCase().includes(searchTerm.toLowerCase())
    );
    setFilteredRoles(filtered);
  }, [roles, searchTerm]);

  const handleDelete = async (roleId: string) => {
    toastConfirm(
      async () => {
        try {
          await onDelete(roleId);
          toast({
            title: "Role deleted",
            description: "The role has been deleted successfully",
          });
        } catch (error) {
          toast({
            title: "Error",
            description: "There was an error deleting the role",
            variant: "destructive",
          });
        }
      },
      "¿Estás seguro de eliminar este rol?"
    );
  };

  return (
    <Card className="w-full">
      <div className="p-4">
        <div className="flex items-center gap-4 mb-4">
          <div className="relative flex-1">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search roles..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-8"
            />
          </div>
        </div>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Description</TableHead>
              <TableHead>Level</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Permissions</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredRoles.map((role) => (
              <TableRow key={role.id}>
                <TableCell className="font-medium">
                  <div className="flex items-center gap-2">
                    {role.name}
                    {role.isDefault && (
                      <Star className="h-4 w-4 text-yellow-500" fill="currentColor" />
                    )}
                  </div>
                </TableCell>
                <TableCell>{role.description}</TableCell>
                <TableCell>
                  <Badge variant="secondary">
                    <Shield className="h-3 w-3 mr-1" />
                    Level {role.level}
                  </Badge>
                </TableCell>
                <TableCell>
                  {role.isDefault ? (
                    <Badge variant="default">Default</Badge>
                  ) : (
                    <Badge variant="secondary">Custom</Badge>
                  )}
                </TableCell>
                <TableCell>
                  <Badge variant="outline">{role.permissions.length} permissions</Badge>
                </TableCell>
                <TableCell className="text-right space-x-2">
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => setSelectedRole(role)}
                  >
                    <Eye className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => onEdit(role)}
                  >
                    <Pencil className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => handleDelete(role.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <Dialog open={!!selectedRole} onOpenChange={(open) => !open && setSelectedRole(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Detalles del Rol</DialogTitle>
          </DialogHeader>
          {selectedRole && (
            <div className="space-y-6">
              <div className="grid gap-4">
                <div>
                  <h4 className="font-medium mb-2">Nombre</h4>
                  <p className="text-sm text-muted-foreground">{selectedRole.name}</p>
                </div>
                <div>
                  <h4 className="font-medium mb-2">Descripción</h4>
                  <p className="text-sm text-muted-foreground">{selectedRole.description}</p>
                </div>
                <div>
                  <h4 className="font-medium mb-2">Nivel</h4>
                  <Badge variant="secondary">
                    <Shield className="h-3 w-3 mr-1" />
                    Level {selectedRole.level}
                  </Badge>
                </div>
                <div>
                  <h4 className="font-medium mb-2">Estado</h4>
                  {selectedRole.isDefault ? (
                    <Badge variant="default">Default</Badge>
                  ) : (
                    <Badge variant="secondary">Custom</Badge>
                  )}
                </div>
                <div>
                  <h4 className="font-medium mb-2">Permisos ({selectedRole.permissions.length})</h4>
                  <ScrollArea className="h-[200px] rounded-md border p-4">
                    <div className="space-y-4">
                      {selectedRole.permissions.map((permission) => (
                        <div key={permission.id} className="space-y-1">
                          <h5 className="text-sm font-medium">{permission.name}</h5>
                          <p className="text-sm text-muted-foreground">{permission.description}</p>
                        </div>
                      ))}
                    </div>
                  </ScrollArea>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </Card>
  );
}