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
import { cn } from "@/lib/utils";
import { Plan } from "../../types/plan";
import { type ChangeEvent, useState, useEffect, useMemo } from "react";
import { type Control, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Info, Plus } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import {
  PLAN_DESCRIPTION_MAX_LENGTH,
  PLAN_TYPES,
  type PlanFormValues,
  buildCreatePlanPayload,
  buildUpdatePlanPayload,
  getArsPriceError,
  getPlanFormDefaults,
  getPlanFormSchema,
  parseArsPriceInput,
} from "../../validations/planValidation";
import { formatArsPrice } from "../../utils/formatPrice";

type ArsPriceFieldName = "monthlyPriceArs" | "yearlyPriceArs";

/**
 * Precio en pesos enteros; vacío = sin precio. Es un campo de texto y no de número a propósito: un
 * `type="number"` lee "50.000" como 50 (el punto como decimal) y se guardaría un precio mil veces
 * menor. Acá solo se aceptan dígitos y, debajo, se lee en voz alta cómo se va a guardar.
 */
function ArsPriceField({
  control,
  name,
  label,
}: {
  control: Control<PlanFormValues>;
  name: ArsPriceFieldName;
  label: string;
}) {
  return (
    <FormField
      control={control}
      name={name}
      render={({ field }) => {
        const price = parseArsPriceInput(field.value);
        const savedAs = price !== null && !getArsPriceError(field.value) ? formatArsPrice(price) : null;
        return (
          <FormItem>
            <FormLabel>{label}</FormLabel>
            <FormControl>
              <Input type="text" inputMode="numeric" autoComplete="off" placeholder="Sin precio" {...field} />
            </FormControl>
            <FormDescription>
              Solo números, sin puntos ni comas (ej. 49900). Vacío = sin precio.
              {savedAs && <span className="block font-medium text-foreground">Se guardará como {savedAs}</span>}
            </FormDescription>
            <FormMessage />
          </FormItem>
        );
      }}
    />
  );
}

/**
 * Props de un `<Input type="number">` ligado al formulario. Vacío = `null` (la validación lo rechaza
 * con un mensaje), nunca `|| 0`: el navegador lee "9." como vacío y, si el estado pasara a 0, React
 * reescribiría lo que se está escribiendo ("9." -> "0") y se perderían los dígitos siguientes.
 */
function numberInputProps<F extends { value: number | null; onChange: (...event: any[]) => void }>(
  field: F
) {
  return {
    ...field,
    value: field.value ?? "",
    onChange: (e: ChangeEvent<HTMLInputElement>) =>
      field.onChange(e.target.value === "" ? null : Number(e.target.value)),
  };
}

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

  // Editar: el tipo de plan es de solo lectura (el backend no lo acepta en PUT /plans/:id).
  const isEditing = !!plan;
  const schema = useMemo(() => getPlanFormSchema(isEditing ? "edit" : "create"), [isEditing]);

  const form = useForm<PlanFormValues>({
    resolver: zodResolver(schema),
    defaultValues: getPlanFormDefaults(plan),
  });

  const handleSubmit = async (data: PlanFormValues) => {
    try {
      const payload = isEditing ? buildUpdatePlanPayload(data) : buildCreatePlanPayload(data);
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
          {/* noValidate: la validación es la de zod, con mensajes en español en cada campo; la nativa
              (min/step de los inputs numéricos) mostraría un globito del navegador en su lugar. */}
          <form
            noValidate
            onSubmit={form.handleSubmit(handleSubmit)}
            className="space-y-4 overflow-y-auto max-h-[calc(90vh-8rem)] pr-2"
          >
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="planType"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Tipo de Plan</FormLabel>
                    {isEditing ? (
                      <>
                        <FormControl>
                          <Input value={field.value} disabled />
                        </FormControl>
                        <FormDescription>El tipo de un plan no se puede cambiar.</FormDescription>
                      </>
                    ) : (
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
                    )}
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
                  <FormDescription
                    className={cn(
                      "text-right text-xs",
                      field.value.length > PLAN_DESCRIPTION_MAX_LENGTH && "text-destructive"
                    )}
                  >
                    {field.value.length}/{PLAN_DESCRIPTION_MAX_LENGTH}
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-2 gap-4">
              <ArsPriceField control={form.control} name="monthlyPriceArs" label="Precio mensual (ARS)" />
              <ArsPriceField control={form.control} name="yearlyPriceArs" label="Precio anual (ARS)" />
            </div>

            <div
              role="note"
              className="flex items-start gap-2 rounded-lg border bg-muted/40 p-3 text-sm text-muted-foreground"
            >
              <Info aria-hidden="true" className="mt-0.5 h-4 w-4 shrink-0" />
              <p>
                Los precios nuevos rigen para las suscripciones nuevas: las suscripciones activas
                conservan el monto con el que se crearon. Un plan sin precio en ARS para un ciclo no
                se puede comprar con Mercado Pago.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="monthlyPriceUsd"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Precio mensual (USD, referencia)</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        step="0.01"
                        placeholder="0.00"
                        {...numberInputProps(field)}
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
                    <FormLabel>Precio anual (USD, referencia)</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        step="0.01"
                        placeholder="0.00"
                        {...numberInputProps(field)}
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
                              {...numberInputProps(field)}
                            />
                          </FormControl>
                          <FormMessage />
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
                              {...numberInputProps(field)}
                            />
                          </FormControl>
                          <FormMessage />
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
                              {...numberInputProps(field)}
                            />
                          </FormControl>
                          <FormMessage />
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
                              {...numberInputProps(field)}
                            />
                          </FormControl>
                          <FormMessage />
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
                              {...numberInputProps(field)}
                            />
                          </FormControl>
                          <FormMessage />
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
                              {...numberInputProps(field)}
                            />
                          </FormControl>
                          <FormMessage />
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
                      {field.value === undefined
                        ? "No se pudo leer el estado actual del plan: se conserva mientras no se cambie este interruptor."
                        : "Un plan inactivo sale del catálogo público y no se puede comprar con Mercado Pago. Las suscripciones que ya lo tienen lo conservan."}
                    </div>
                  </div>
                  <FormControl>
                    <Switch
                      checked={field.value === true}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                </FormItem>
              )}
            />

            <Button type="submit" className="w-full" disabled={form.formState.isSubmitting}>
              {form.formState.isSubmitting ? "Guardando..." : `${plan ? "Actualizar" : "Crear"} Plan`}
            </Button>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
