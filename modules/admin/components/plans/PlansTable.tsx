"use client";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useEffect, useState } from "react";
import { Pencil, Trash2, Search, Eye, Truck } from "lucide-react";
import { Plan } from "../../types/plan";
import { useToast } from "@/hooks/useToast";
import toastConfirm from "@/components/common/ToastConfirm";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

interface PlansTableProps {
  plans: Plan[];
  onEdit: (plan: Plan) => void;
  onDelete: (planId: number) => void;
}

const formatLimit = (value: number) => (value === -1 ? "Ilimitado" : String(value));

const formatPrice = (value: number) => `$${value.toFixed(2)}`;

export function PlansTable({ plans = [], onEdit, onDelete }: PlansTableProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [filteredPlans, setFilteredPlans] = useState<Plan[]>([]);
  const [selectedPlan, setSelectedPlan] = useState<Plan | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    const filtered = (plans || []).filter(
      (plan) =>
        plan.displayName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        plan.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
        plan.planType.toLowerCase().includes(searchTerm.toLowerCase())
    );
    setFilteredPlans(filtered);
  }, [plans, searchTerm]);

  const handleDelete = async (planId: number) => {
    toastConfirm(
      async () => {
        try {
          await onDelete(planId);
          toast({
            title: "Plan eliminado",
            description: "El plan ha sido eliminado exitosamente",
          });
        } catch (error) {
          toast({
            title: "Error",
            description: "Hubo un error al eliminar el plan",
            variant: "destructive",
          });
        }
      },
      "¿Estás seguro de eliminar este plan?"
    );
  };

  return (
    <Card className="w-full">
      <div className="p-4">
        <div className="flex items-center gap-4 mb-4">
          <div className="relative flex-1">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar planes..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-8"
            />
          </div>
        </div>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nombre</TableHead>
              <TableHead>Tipo</TableHead>
              <TableHead>Precio Mensual</TableHead>
              <TableHead>Precio Anual</TableHead>
              <TableHead>Límites</TableHead>
              <TableHead>Delivery</TableHead>
              <TableHead>Estado</TableHead>
              <TableHead className="text-right">Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredPlans.map((plan) => (
              <TableRow key={plan.id}>
                <TableCell className="font-medium">{plan.displayName}</TableCell>
                <TableCell>
                  <Badge variant="secondary">{plan.planType}</Badge>
                </TableCell>
                <TableCell>{formatPrice(plan.monthlyPriceUsd)}</TableCell>
                <TableCell>{formatPrice(plan.yearlyPriceUsd)}</TableCell>
                <TableCell>
                  <div className="text-xs space-y-0.5">
                    <div>Items: {formatLimit(plan.maxMenuItems)}</div>
                    <div>Mesas: {formatLimit(plan.maxTables)}</div>
                  </div>
                </TableCell>
                <TableCell>
                  {plan.deliveryEnabled ? (
                    <Badge variant="default" className="bg-green-600">
                      <Truck className="h-3 w-3 mr-1" />
                      Sí
                    </Badge>
                  ) : (
                    <Badge variant="secondary">No</Badge>
                  )}
                </TableCell>
                <TableCell>
                  {plan.active ? (
                    <Badge variant="default" className="bg-green-600">Activo</Badge>
                  ) : (
                    <Badge variant="destructive">Inactivo</Badge>
                  )}
                </TableCell>
                <TableCell className="text-right space-x-2">
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => setSelectedPlan(plan)}
                  >
                    <Eye className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => onEdit(plan)}
                  >
                    <Pencil className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => handleDelete(plan.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <Dialog open={!!selectedPlan} onOpenChange={(open) => !open && setSelectedPlan(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Detalles del Plan</DialogTitle>
          </DialogHeader>
          {selectedPlan && (
            <div className="space-y-6">
              <div className="grid gap-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <h4 className="font-medium mb-1">Nombre</h4>
                    <p className="text-sm text-muted-foreground">{selectedPlan.displayName}</p>
                  </div>
                  <div>
                    <h4 className="font-medium mb-1">Tipo</h4>
                    <Badge variant="secondary">{selectedPlan.planType}</Badge>
                  </div>
                </div>
                <div>
                  <h4 className="font-medium mb-1">Descripción</h4>
                  <p className="text-sm text-muted-foreground">{selectedPlan.description}</p>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <h4 className="font-medium mb-1">Precio Mensual</h4>
                    <p className="text-sm text-muted-foreground">{formatPrice(selectedPlan.monthlyPriceUsd)}</p>
                  </div>
                  <div>
                    <h4 className="font-medium mb-1">Precio Anual</h4>
                    <p className="text-sm text-muted-foreground">{formatPrice(selectedPlan.yearlyPriceUsd)}</p>
                  </div>
                </div>
                <div>
                  <h4 className="font-medium mb-2">Límites</h4>
                  <div className="grid grid-cols-2 gap-2">
                    <div className="flex justify-between border rounded-lg p-2">
                      <span className="text-sm">Menu Items</span>
                      <Badge variant="outline">{formatLimit(selectedPlan.maxMenuItems)}</Badge>
                    </div>
                    <div className="flex justify-between border rounded-lg p-2">
                      <span className="text-sm">Mesas</span>
                      <Badge variant="outline">{formatLimit(selectedPlan.maxTables)}</Badge>
                    </div>
                    <div className="flex justify-between border rounded-lg p-2">
                      <span className="text-sm">Empleados</span>
                      <Badge variant="outline">{formatLimit(selectedPlan.maxEmployees)}</Badge>
                    </div>
                    <div className="flex justify-between border rounded-lg p-2">
                      <span className="text-sm">Categorías</span>
                      <Badge variant="outline">{formatLimit(selectedPlan.maxCategories)}</Badge>
                    </div>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <h4 className="font-medium mb-1">Delivery</h4>
                    {selectedPlan.deliveryEnabled ? (
                      <Badge variant="default" className="bg-green-600">Habilitado</Badge>
                    ) : (
                      <Badge variant="secondary">Deshabilitado</Badge>
                    )}
                  </div>
                  <div>
                    <h4 className="font-medium mb-1">Estado</h4>
                    {selectedPlan.active ? (
                      <Badge variant="default" className="bg-green-600">Activo</Badge>
                    ) : (
                      <Badge variant="destructive">Inactivo</Badge>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </Card>
  );
}
