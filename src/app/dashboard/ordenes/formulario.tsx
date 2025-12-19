'use client'

import React from 'react'
import { Card, CardContent, CardHeader,CardTitle } from '@/components/ui/card'
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel } from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import z, { date } from 'zod'
import { Button } from '@/components/ui/button'

const SearchSchema = z.object({
    firstDate: z.coerce.date({message: "La fecha inicial es requerida"}),
    secondDate: z.coerce.date({message: "La fecha final es requerida"}),
}).refine((data) => data.secondDate >= data.firstDate, {
    message: "La fecha final debe ser mayor o igual a la fecha inicial",
    path: ["secondDate"],
})

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

/* ------------------------------------------------------------------ */

const Formulario = () => {

    const peruNow = getPeruDate()
    const oneMonthBefore = subtractMonths(peruNow, 1)

    const form = useForm({
        resolver: zodResolver(SearchSchema),
        defaultValues: {
            firstDate: toInputFormat(oneMonthBefore) as unknown as Date,
            secondDate: toInputFormat(peruNow) as unknown as Date,
        },
    })

    const onSubmit = form.handleSubmit(values => {
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
                            name = "firstDate" 
                            control = {form.control}
                            render = {({field}) => (
                                <FormItem>
                                    <FormLabel>Fecha Inicial</FormLabel>
                                    <FormItem>
                                        <FormControl>
                                            <Input type='date' {...field} />
                                        </FormControl>
                                    </FormItem>
                                    <FormDescription>Selecciona la fecha inicial</FormDescription>
                                </FormItem>)}
                        />
                        <FormField
                            name = "secondDate" 
                            control = {form.control}
                            render = {({field}) => (
                                <FormItem>
                                    <FormLabel>Fecha Final</FormLabel>
                                    <FormItem>
                                        <FormControl>
                                            <Input type='date' {...field} />
                                        </FormControl>
                                    </FormItem>
                                    <FormDescription>Selecciona la fecha final</FormDescription>
                                </FormItem>)}
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