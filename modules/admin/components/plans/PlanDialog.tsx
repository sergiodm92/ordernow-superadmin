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
import { Plan } from "../../types/plan";
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
import { Plus } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";

const PLAN_TYPES = ["FREE", "BASIC", "PRO", "ENTERPRISE"] as const;

const planSchema = z.object({
  planType: z.string().min(1, "El tipo de plan es requerido"),
  displayName: z.string().min(1, "El nombre es requerido"),
  description: z.string().min(1, "La descripción es requerida"),
  maxMenuItems: z.number(),
  maxTables: z.number(),
  maxEmployees: z.number(),
  maxCategories: z.number(),
  maxOptionGroups: z.number(),
  maxPromotions: z.number(),
  unlimitedMenuItems: z.boolean().default(false),
  unlimitedTables: z.boolean().default(false),
  unlimitedEmployees: z.boolean().default(false),
  unlimitedCategories: z.boolean().default(false),
  unlimitedOptionGroups: z.boolean().default(false),
  unlimitedPromotions: z.boolean().default(false),
  deliveryEnabled: z.boolean().default(false),
  monthlyPriceUsd: z.number().min(0, "El precio debe ser mayor o igual a 0"),
  yearlyPriceUsd: z.number().min(0, "El precio debe ser mayor o igual a 0"),
  active: z.boolean().default(true),
});

type PlanFormData = z.infer<typeof planSchema>;

interface PlanDialogProps {
  plan?: Plan;
  onSubmit: (data: any) => Promise<void>;
  trigger?: React.ReactNode;
  title: string;
  onClose?: () => void;
}

export function PlanDialog({ plan, onSubmit, trigger, title, onClose }: PlanDialogProps) {
  const [open, setOpen] = useState(!!plan);
  const { toast } = useToast();

  useEffect(() => {
    if (plan && !trigger) {
      setOpen(true);
    }
  }, [plan, trigger]);

  const form = useForm<PlanFormData>({
    resolver: zodResolver(planSchema),
    defaultValues: {
      planType: plan?.planType || "",
      displayName: plan?.displayName || "",
      description: plan?.description || "",
      maxMenuItems: plan ? (plan.maxMenuItems === -1 ? 0 : plan.maxMenuItems) : 0,
      maxTables: plan ? (plan.maxTables === -1 ? 0 : plan.maxTables) : 0,
      maxEmployees: plan ? (plan.maxEmployees === -1 ? 0 : plan.maxEmployees) : 0,
      maxCategories: plan ? (plan.maxCategories === -1 ? 0 : plan.maxCategories) : 0,
      maxOptionGroups: plan ? (plan.maxOptionGroups === -1 ? 0 : plan.maxOptionGroups ?? 0) : 0,
      maxPromotions: plan ? (plan.maxPromotions === -1 ? 0 : plan.maxPromotions ?? 0) : 0,
      unlimitedMenuItems: plan?.maxMenuItems === -1,
      unlimitedTables: plan?.maxTables === -1,
      unlimitedEmployees: plan?.maxEmployees === -1,
      unlimitedCategories: plan?.maxCategories === -1,
      unlimitedOptionGroups: plan?.maxOptionGroups === -1,
      unlimitedPromotions: plan?.maxPromotions === -1,
      deliveryEnabled: plan?.deliveryEnabled || false,
      monthlyPriceUsd: plan?.monthlyPriceUsd || 0,
      yearlyPriceUsd: plan?.yearlyPriceUsd || 0,
      active: plan?.active ?? true,
    },
  });

  const handleSubmit = async (data: PlanFormData) => {
    try {
      const {
        unlimitedMenuItems,
        unlimitedTables,
        unlimitedEmployees,
        unlimitedCategories,
        unlimitedOptionGroups,
        unlimitedPromotions,
        ...rest
      } = data;
      const payload = {
        ...rest,
        maxMenuItems: unlimitedMenuItems ? -1 : rest.maxMenuItems,
        maxTables: unlimitedTables ? -1 : rest.maxTables,
        maxEmployees: unlimitedEmployees ? -1 : rest.maxEmployees,
        maxCategories: unlimitedCategories ? -1 : rest.maxCategories,
        maxOptionGroups: unlimitedOptionGroups ? -1 : rest.maxOptionGroups,
        maxPromotions: unlimitedPromotions ? -1 : rest.maxPromotions,
      };
      await onSubmit(payload);
      setOpen(false);
      form.reset();
      onClose?.();
      toast({
        title: "Éxito",
        description: `Plan ${plan ? "actualizado" : "creado"} exitosamente`,
      });
    } catch (error) {
      toast({
        title: "Error",
        description: `Error al ${plan ? "actualizar" : "crear"} el plan`,
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

  const watchUnlimitedMenuItems = form.watch("unlimitedMenuItems");
  const watchUnlimitedTables = form.watch("unlimitedTables");
  const watchUnlimitedEmployees = form.watch("unlimitedEmployees");
  const watchUnlimitedCategories = form.watch("unlimitedCategories");
  const watchUnlimitedOptionGroups = form.watch("unlimitedOptionGroups");
  const watchUnlimitedPromotions = form.watch("unlimitedPromotions");

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        {trigger || (
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            Crear Plan
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-hidden">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4 overflow-y-auto max-h-[calc(90vh-8rem)] pr-2">
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="planType"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Tipo de Plan</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Seleccionar tipo" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {PLAN_TYPES.map((type) => (
                          <SelectItem key={type} value={type}>
                            {type}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="displayName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nombre</FormLabel>
                    <FormControl>
                      <Input placeholder="Nombre del plan" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Descripción</FormLabel>
                  <FormControl>
                    <Textarea placeholder="Descripción del plan" {...field} rows={2} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="monthlyPriceUsd"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Precio Mensual (USD)</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        step="0.01"
                        placeholder="0.00"
                        {...field}
                        onChange={(e) => field.onChange(Number(e.target.value) || 0)}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="yearlyPriceUsd"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Precio Anual (USD)</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        step="0.01"
                        placeholder="0.00"
                        {...field}
                        onChange={(e) => field.onChange(Number(e.target.value) || 0)}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="space-y-3">
              <h4 className="font-medium text-sm">Límites</h4>
              <div className="grid grid-cols-2 gap-4">
                {/* Max Menu Items */}
                <div className="space-y-2 border rounded-lg p-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Menu Items</span>
                    <div className="flex items-center gap-2">
                      <Checkbox
                        checked={watchUnlimitedMenuItems}
                        onCheckedChange={(checked) => form.setValue("unlimitedMenuItems", !!checked)}
                      />
                      <span className="text-xs text-muted-foreground">Ilimitado</span>
                    </div>
                  </div>
                  {!watchUnlimitedMenuItems && (
                    <FormField
                      control={form.control}
                      name="maxMenuItems"
                      render={({ field }) => (
                        <FormItem>
                          <FormControl>
                            <Input
                              type="number"
                              min={0}
                              {...field}
                              onChange={(e) => field.onChange(Number(e.target.value) || 0)}
                            />
                          </FormControl>
                        </FormItem>
                      )}
                    />
                  )}
                </div>

                {/* Max Tables */}
                <div className="space-y-2 border rounded-lg p-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Mesas</span>
                    <div className="flex items-center gap-2">
                      <Checkbox
                        checked={watchUnlimitedTables}
                        onCheckedChange={(checked) => form.setValue("unlimitedTables", !!checked)}
                      />
                      <span className="text-xs text-muted-foreground">Ilimitado</span>
                    </div>
                  </div>
                  {!watchUnlimitedTables && (
                    <FormField
                      control={form.control}
                      name="maxTables"
                      render={({ field }) => (
                        <FormItem>
                          <FormControl>
                            <Input
                              type="number"
                              min={0}
                              {...field}
                              onChange={(e) => field.onChange(Number(e.target.value) || 0)}
                            />
                          </FormControl>
                        </FormItem>
                      )}
                    />
                  )}
                </div>

                {/* Max Employees */}
                <div className="space-y-2 border rounded-lg p-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Empleados</span>
                    <div className="flex items-center gap-2">
                      <Checkbox
                        checked={watchUnlimitedEmployees}
                        onCheckedChange={(checked) => form.setValue("unlimitedEmployees", !!checked)}
                      />
                      <span className="text-xs text-muted-foreground">Ilimitado</span>
                    </div>
                  </div>
                  {!watchUnlimitedEmployees && (
                    <FormField
                      control={form.control}
                      name="maxEmployees"
                      render={({ field }) => (
                        <FormItem>
                          <FormControl>
                            <Input
                              type="number"
                              min={0}
                              {...field}
                              onChange={(e) => field.onChange(Number(e.target.value) || 0)}
                            />
                          </FormControl>
                        </FormItem>
                      )}
                    />
                  )}
                </div>

                {/* Max Categories */}
                <div className="space-y-2 border rounded-lg p-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Categorías</span>
                    <div className="flex items-center gap-2">
                      <Checkbox
                        checked={watchUnlimitedCategories}
                        onCheckedChange={(checked) => form.setValue("unlimitedCategories", !!checked)}
                      />
                      <span className="text-xs text-muted-foreground">Ilimitado</span>
                    </div>
                  </div>
                  {!watchUnlimitedCategories && (
                    <FormField
                      control={form.control}
                      name="maxCategories"
                      render={({ field }) => (
                        <FormItem>
                          <FormControl>
                            <Input
                              type="number"
                              min={0}
                              {...field}
                              onChange={(e) => field.onChange(Number(e.target.value) || 0)}
                            />
                          </FormControl>
                        </FormItem>
                      )}
                    />
                  )}
                </div>

                {/* Max Option Groups */}
                <div className="space-y-2 border rounded-lg p-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Grupos de opciones</span>
                    <div className="flex items-center gap-2">
                      <Checkbox
                        checked={watchUnlimitedOptionGroups}
                        onCheckedChange={(checked) => form.setValue("unlimitedOptionGroups", !!checked)}
                      />
                      <span className="text-xs text-muted-foreground">Ilimitado</span>
                    </div>
                  </div>
                  {!watchUnlimitedOptionGroups && (
                    <FormField
                      control={form.control}
                      name="maxOptionGroups"
                      render={({ field }) => (
                        <FormItem>
                          <FormControl>
                            <Input
                              type="number"
                              min={0}
                              {...field}
                              onChange={(e) => field.onChange(Number(e.target.value) || 0)}
                            />
                          </FormControl>
                        </FormItem>
                      )}
                    />
                  )}
                </div>

                {/* Max Promotions */}
                <div className="space-y-2 border rounded-lg p-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Promociones</span>
                    <div className="flex items-center gap-2">
                      <Checkbox
                        checked={watchUnlimitedPromotions}
                        onCheckedChange={(checked) => form.setValue("unlimitedPromotions", !!checked)}
                      />
                      <span className="text-xs text-muted-foreground">Ilimitado</span>
                    </div>
                  </div>
                  {!watchUnlimitedPromotions && (
                    <FormField
                      control={form.control}
                      name="maxPromotions"
                      render={({ field }) => (
                        <FormItem>
                          <FormControl>
                            <Input
                              type="number"
                              min={0}
                              {...field}
                              onChange={(e) => field.onChange(Number(e.target.value) || 0)}
                            />
                          </FormControl>
                        </FormItem>
                      )}
                    />
                  )}
                </div>
              </div>
            </div>

            <FormField
              control={form.control}
              name="deliveryEnabled"
              render={({ field }) => (
                <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                  <div className="space-y-0.5">
                    <FormLabel>Delivery</FormLabel>
                    <div className="text-sm text-muted-foreground">
                      Habilitar servicio de delivery
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
              name="active"
              render={({ field }) => (
                <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                  <div className="space-y-0.5">
                    <FormLabel>Activo</FormLabel>
                    <div className="text-sm text-muted-foreground">
                      El plan estará disponible para asignar
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

            <Button type="submit" className="w-full">
              {plan ? "Actualizar" : "Crear"} Plan
            </Button>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
