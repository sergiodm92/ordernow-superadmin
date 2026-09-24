"use client";

import { useEffect, useState } from "react";
import { Plus } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { useEstablishments } from "@/modules/admin/hooks/useEstablishments";
import { IEstablishment } from "@/modules/admin/types/establishment";
import toastConfirm from "@/components/common/ToastConfirm";
import { EstablishmentDialog } from "@/modules/admin/components/establishments/EstablishmentDialog";

export default function EstablishmentsPage() {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedEstablishment, setSelectedEstablishment] = useState<IEstablishment | undefined>();
  const [mode, setMode] = useState<"create" | "edit">("create");

  const { establishments, fetchEstablishments, createEstablishment, updateEstablishment, deleteEstablishment } = useEstablishments();

  useEffect(() => {
    fetchEstablishments();
  }, [fetchEstablishments]);

  const handleCreate = () => {
    setMode("create");
    setSelectedEstablishment(undefined);
    setIsOpen(true);
  };

  const handleEdit = (establishment: IEstablishment) => {
    setMode("edit");
    setSelectedEstablishment(establishment);
    setIsOpen(true);
  };

  const handleDelete = (id: number) => {
    toastConfirm(
      () => deleteEstablishment(id),
      "¿Estás seguro de eliminar este establecimiento?"
    );
  };

  const handleSubmit = async (data: any) => {
    try {
      if (mode === "create") {
        await createEstablishment(data);
      } else if (selectedEstablishment) {
        // UpdateEstablishmentDto doesn't accept userOwnerId — the backend's
        // whitelist validation 400s if it's present, so strip it here.
        const { userOwnerId, ...updateData } = data;
        await updateEstablishment(selectedEstablishment.id, updateData);
      }
      setIsOpen(false);
    } catch (error) {
      console.error(error);
    }
  };

  return (
    <div className="flex-1 space-y-4 p-8 pt-6">
      <div className="flex items-center justify-between">
        <h2 className="text-3xl font-bold tracking-tight">Establecimientos</h2>
        <Button onClick={handleCreate}>
          <Plus className="mr-2 h-4 w-4" />
          Agregar Establecimiento
        </Button>
      </div>
      <div className="grid gap-4">
        <Card>
          <CardHeader>
            <CardTitle>Todos los Establecimientos</CardTitle>
            <CardDescription>
              Lista de todos los establecimientos en el sistema.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Propietario ID</TableHead>
                  <TableHead>Nombre</TableHead>
                  <TableHead>Dirección</TableHead>
                  <TableHead>Ciudad</TableHead>
                  <TableHead>Teléfono</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead className="text-right">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {establishments.map((establishment) => (
                  <TableRow key={establishment.id}>
                    <TableCell>{establishment.userOwnerId || 'N/A'}</TableCell>
                    <TableCell className="font-medium">{establishment.name}</TableCell>
                    <TableCell>{establishment.address}</TableCell>
                    <TableCell>{establishment.city}</TableCell>
                    <TableCell>{establishment.phone}</TableCell>
                    <TableCell>{establishment.email}</TableCell>
                    <TableCell className="text-right space-x-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleEdit(establishment)}
                      >
                        Editar
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-red-600"
                        onClick={() => handleDelete(establishment.id)}
                      >
                        Eliminar
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
      <EstablishmentDialog
        open={isOpen}
        onOpenChange={setIsOpen}
        onSubmit={handleSubmit}
        establishment={selectedEstablishment}
        mode={mode}
      />
    </div>
  );
}
