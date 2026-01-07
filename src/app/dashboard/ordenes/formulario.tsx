'use client'

import React from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel } from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Button } from '@/components/ui/button'

/* ------------------- FECHAS PERÚ (FUNCIONES TS) ------------------- */

function getPeruDate(): Date {
  return new Date(
    new Date().toLocaleString("en-US", { timeZone: "America/Lima" })
  )
}

function subtractMonths(date: Date, months: number): Date {
  const d = new Date(date)
  d.setMonth(d.getMonth() - months)
  return d
}

function toInputFormat(date: Date): string {
  return date.toISOString().split("T")[0]
}

function parseInputDate(value: string): Date {
  // Evita problemas de zona horaria al parsear YYYY-MM-DD
  const [y, m, d] = value.split('-').map(Number)
  return new Date(y, m - 1, d)
}

/* ------------------------------------------------------------------ */

const SearchSchema = z.object({
  firstDate: z.string().min(1, "La fecha inicial es requerida"),
  secondDate: z.string().min(1, "La fecha final es requerida"),
}).refine((data) => {
  const first = parseInputDate(data.firstDate)
  const second = parseInputDate(data.secondDate)
  return second >= first
}, {
  message: "La fecha final debe ser mayor o igual a la fecha inicial",
  path: ["secondDate"],
})

type SearchValues = z.infer<typeof SearchSchema>

const Formulario = () => {
  const peruNow = getPeruDate()
  const oneMonthBefore = subtractMonths(peruNow, 1)

  const form = useForm<SearchValues>({
    resolver: zodResolver(SearchSchema),
    defaultValues: {
      firstDate: toInputFormat(oneMonthBefore),
      secondDate: toInputFormat(peruNow),
    },
  })

  const onSubmit = form.handleSubmit((values) => {
    console.log(values)
  })

  return (
    <div className='w-full mx-auto px-5'>
      <Card>
        <CardHeader>
          <CardTitle>Formulario de busqueda por fecha</CardTitle>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form className='flex flex-col gap-y-4' onSubmit={onSubmit}>
              <FormField
                name="firstDate"
                control={form.control}
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Fecha Inicial</FormLabel>
                    <FormItem>
                      <FormControl>
                        <Input type='date' {...field} />
                      </FormControl>
                    </FormItem>
                    <FormDescription>Selecciona la fecha inicial</FormDescription>
                  </FormItem>
                )}
              />

              <FormField
                name="secondDate"
                control={form.control}
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Fecha Final</FormLabel>
                    <FormItem>
                      <FormControl>
                        <Input type='date' {...field} />
                      </FormControl>
                    </FormItem>
                    <FormDescription>Selecciona la fecha final</FormDescription>
                  </FormItem>
                )}
              />

              <Button type='submit'>Buscar</Button>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  )
}

export default Formulario
