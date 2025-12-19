'use client'

import { Card, CardContent, CardHeader,CardTitle } from '@/components/ui/card'
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel } from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import z from 'zod'
import { Button } from '@/components/ui/button'

const Userschema = z.object({
    name: z.string().min(2, {message: "El nombre debe tener al menos 2 caracteres"}),
    lastname: z.string().min(2, {message: "El apellido debe tener al menos 2 caracteres"}),
    email: z.string().email({message: "El email no es valido"}),
    age: z.string().transform((val) => parseInt(val, 10)).refine((val) => val >= 18, {message: "Debes ser mayor de 18 años"})
})

const page = () => {

    const form = useForm({
        resolver: zodResolver(Userschema),
    })

    const onSubmit = form.handleSubmit(values => {
        console.log(values)
    })

    return (
    <div className="flex flex-1 flex-col gap-4 p-4 pt-0">
        <div className="@container/main flex flex-1 flex-col gap-2">
            <div className="flex flex-col gap-3 py-3 md:gap-6 md:py-6">
                <Card>
                    <CardHeader>
                        <CardTitle>Formulario Basico</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <Form {...form}>
                            <form className='flex flex-col gap-y-2' onSubmit={onSubmit}>
                                <FormField
                                    name = "name" 
                                    control = {form.control}
                                    render = {({field}) => (
                                        <FormItem>
                                            <FormLabel>Nombre</FormLabel>
                                            <FormItem>
                                                <FormControl>
                                                    <Input placeholder='Nombre' {...field} />
                                                </FormControl>
                                            </FormItem>
                                            <FormDescription>Ingresa tu nombre</FormDescription>
                                        </FormItem>)}
                                />
                                <FormField
                                    name = "lastname"
                                    control={form.control}
                                    render = {({field}) => (
                                        <FormItem>
                                            <FormLabel>Apellido</FormLabel>
                                            <FormItem>
                                                <FormControl>
                                                    <Input placeholder='Apellido' {...field} />
                                                </FormControl>
                                            </FormItem>
                                            <FormDescription>Ingresa tu apellido</FormDescription>
                                        </FormItem>)}
                                />
                                <FormField
                                    name = "email"
                                    control={form.control}
                                    render = {({field}) => (
                                        <FormItem>
                                            <FormLabel>Email</FormLabel>
                                            <FormItem>
                                                <FormControl>
                                                    <Input placeholder='Email' {...field} />
                                                </FormControl>
                                            </FormItem>
                                            <FormDescription>Ingresa tu email</FormDescription>
                                        </FormItem>)}
                                />
                                <FormField
                                    name = "age"
                                    control={form.control}
                                    render = {({field}) => (
                                        <FormItem>
                                            <FormLabel>Edad</FormLabel>
                                            <FormItem>
                                                <FormControl>
                                                    <Input type='number' placeholder='Edad' {...field} />
                                                </FormControl>
                                            </FormItem>
                                            <FormDescription>Ingresa tu edad</FormDescription>
                                        </FormItem>)}
                                />
                                <Button>Enviar</Button>
                            </form>
                        </Form>
                    </CardContent>
                </Card>
            </div>
        </div>
    </div>
    )
}

export default page