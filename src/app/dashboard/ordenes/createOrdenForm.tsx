"use client"

import * as React from "react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"

import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { Orden } from "@/types/orden"



const CreateOrderSchema = z.object({
  turno: z.string().min(1, "Turno requerido"),
  tracto: z.string().min(1, "Placa de tracto requerida"),
  carreta: z.string().min(1, "Placa de carreta requerida"),
  ticket: z.string().optional(),
  peso: z.string().min(1, "Peso requerido"),
  destino: z.string().min(1, "Destino requerido"),
  ingreso: z.string().min(1, "Hora de ingreso requerida"),
  salida: z.string().optional(),
}).refine((data) => {
  if (!data.salida) return true; // salida opcional
  return data.salida >= data.ingreso;
}, {
  message: "La hora de salida no puede ser menor que la de ingreso",
  path: ["salida"],
});
type CreateOrderValues = z.infer<typeof CreateOrderSchema>

export function CreateOrderForm({
  onSubmit,
  className,
}: {
  onSubmit: (order: Omit<Orden, "id">) => void
  className?: string
}) {
  const form = useForm<CreateOrderValues>({
    resolver: zodResolver(CreateOrderSchema),
    defaultValues: {
      turno: "",
      tracto: "",
      carreta: "",
      ticket: "",
      peso: "",
      destino: "",
      ingreso: "",
      salida: "",
    },
  })

  const handleSubmit = form.handleSubmit((values) => {
    let duracion = "";
    if (values.ingreso && values.salida) {
      const [h1, m1] = values.ingreso.split(":").map(Number);
      const [h2, m2] = values.salida.split(":").map(Number);

      let minutesDiff = (h2 * 60 + m2) - (h1 * 60 + m1);
      if (minutesDiff < 0) minutesDiff = 0; // seguridad
      const hours = Math.floor(minutesDiff / 60);
      const minutes = minutesDiff % 60;
      duracion = `${hours}h ${minutes}m`;
    }

    onSubmit({ ...values, duracion });
    form.reset();
  })

  const destinos = ["J1", "J2", "J3", "J4", "J5", "J6", "J7"]
  const turnos = ["TURNO 1", "TURNO 2", "TURNO 3", "TURNO 4", "TURNO 5"]

  return (
    <Form {...form}>
      <form
        onSubmit={handleSubmit}
        className={cn("grid gap-4", className)}
      >
        <div className="grid grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="turno"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Turno</FormLabel>
                <FormControl>
                  <select
                    {...field}
                    className="w-full rounded-md border border-gray-300 px-3 py-2"
                  >
                    <option value="">Selecciona un turno</option>
                    {turnos.map((dest) => (
                      <option key={dest} value={dest}>
                        {dest}
                      </option>
                    ))}
                  </select>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="tracto"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Placa Tracto</FormLabel>
                <FormControl>
                  <Input placeholder="Placa Tracto" {...field} onChange={(e) => field.onChange(e.target.value.toUpperCase())}/>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="carreta"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Placa Carreta</FormLabel>
                <FormControl>
                  <Input placeholder="Placa Carreta" {...field} onChange={(e) => field.onChange(e.target.value.toUpperCase()) }/>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="ticket"
            render={({ field }) => (
              <FormItem>
                <FormLabel>N° Ticket (opcional)</FormLabel>
                <FormControl>
                  <Input placeholder="Ticket" {...field} onChange={(e) => field.onChange(e.target.value.toUpperCase())}/>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="peso"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Peso Neto</FormLabel>
                <FormControl>
                  <Input placeholder="Peso Neto" {...field} onChange={(e) => field.onChange(e.target.value.toUpperCase())} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="destino"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Destino</FormLabel>
                <FormControl>
                  <select
                    {...field}
                    className="w-full rounded-md border border-gray-300 px-3 py-2"
                  >
                    <option value="">Selecciona un destino</option>
                    {destinos.map((dest) => (
                      <option key={dest} value={dest}>
                        {dest}
                      </option>
                    ))}
                  </select>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="ingreso"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Hora Ingreso</FormLabel>
                <FormControl>
                  <Input type="time" placeholder="HH:MM" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="salida"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Hora Salida (opcional)</FormLabel>
                <FormControl>
                  <Input type="time" placeholder="HH:MM" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <Button type="submit">Guardar orden</Button>
      </form>
    </Form>
  )
}
