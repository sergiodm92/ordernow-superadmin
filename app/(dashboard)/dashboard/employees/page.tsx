"use client";

import { useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useFetchEmployees } from "@/modules/admin/hooks/useFetchEmployees";
import { useEmployeesStore } from "@/modules/admin/store/employees";
import { deleteEmployeeService } from "@/modules/admin/services/employeeService";
import { toast } from "sonner";
import { Trash2 } from "lucide-react";

export default function EmployeesPage() {
  const [page, setPage] = useState(0);
  const [size] = useState(20);
  const [searchTerm, setSearchTerm] = useState("");

  const { fetchEmployees } = useFetchEmployees(page, size);
  const { employees, totalElements, totalPages } = useEmployeesStore();

  const filteredEmployees = employees.filter((emp) => {
    if (searchTerm === "") return true;
    const term = searchTerm.toLowerCase();
    return (
      emp.firstName.toLowerCase().includes(term) ||
      emp.lastName.toLowerCase().includes(term) ||
      emp.email.toLowerCase().includes(term)
    );
  });

  const handleDelete = async (id: number, name: string) => {
    try {
      await deleteEmployeeService(id);
      toast.success(`Empleado ${name} eliminado exitosamente`);
      fetchEmployees();
    } catch {
      toast.error("Error al eliminar empleado");
    }
  };

  return (
    <div className="flex-1 space-y-4 p-8 pt-6">
      <div className="flex items-center justify-between">
        <h2 className="text-3xl font-bold tracking-tight">Empleados</h2>
      </div>
      <div className="grid gap-4">
        <Card>
          <CardHeader>
            <CardTitle>Todos los Empleados</CardTitle>
            <CardDescription>
              {totalElements} empleados en total.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="mb-4">
              <Input
                placeholder="Buscar por nombre o email..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="max-w-sm"
              />
            </div>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nombre</TableHead>
                  <TableHead>Apellido</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Establecimiento</TableHead>
                  <TableHead>Posición</TableHead>
                  <TableHead className="text-right">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredEmployees.length === 0 ? (
                  <TableRow>
                    <TableCell
                      colSpan={6}
                      className="text-center text-muted-foreground py-8"
                    >
                      No se encontraron empleados.
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredEmployees.map((emp) => (
                    <TableRow key={emp.id}>
                      <TableCell className="font-medium">
                        {emp.firstName}
                      </TableCell>
                      <TableCell>{emp.lastName}</TableCell>
                      <TableCell>{emp.email}</TableCell>
                      <TableCell>{emp.establishmentId}</TableCell>
                      <TableCell>{emp.position}</TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() =>
                            handleDelete(
                              emp.id,
                              `${emp.firstName} ${emp.lastName}`
                            )
                          }
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>

            <div className="flex items-center justify-between mt-4">
              <div className="text-sm text-muted-foreground">
                Página {page + 1} de {Math.max(totalPages, 1)}
              </div>
              <div className="flex space-x-2">
                <Button
                  variant="outline"
                  onClick={() => setPage(page - 1)}
                  disabled={page === 0}
                >
                  Anterior
                </Button>
                <Button
                  variant="outline"
                  onClick={() => setPage(page + 1)}
                  disabled={page >= totalPages - 1}
                >
                  Siguiente
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
