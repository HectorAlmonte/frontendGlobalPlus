'use client'

import React, { useState } from 'react'
import { motion } from 'framer-motion'
import Pretitle from '@/components/landing/basicComponents/Pretitle'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'

import { PiPhoneFill, PiEnvelopeFill, PiMapPinFill } from 'react-icons/pi'

interface ContactForm {
  name: string
  phone: string
  email: string
  subject: string
  message: string
}

const Contact = () => {
  const [formData, setFormData] = useState<ContactForm>({
    name: '',
    phone: '',
    email: '',
    subject: '',
    message: ''
  })
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleInputChange = (field: keyof ContactForm) => (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    setFormData(prev => ({
      ...prev,
      [field]: e.target.value
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    // Validación básica
    if (!formData.name || !formData.email || !formData.message) {
      toast.error('Por favor completa los campos obligatorios')
      return
    }

    setIsSubmitting(true)

    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/contact`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      })

      if (response.ok) {
        toast.success('Mensaje enviado correctamente. Nos pondremos en contacto pronto.')
        // Resetear formulario
        setFormData({
          name: '',
          phone: '',
          email: '',
          subject: '',
          message: ''
        })
      } else {
        const error = await response.json()
        toast.error(error.message || 'Error al enviar el mensaje')
      }
    } catch (error) {
      console.error('Error sending contact form:', error)
      toast.error('Error de conexión. Por favor intenta nuevamente.')
    } finally {
      setIsSubmitting(false)
    }
  }
  return (
    <section id="contact" className="py-16 sm:py-20 xl:py-28 bg-muted/30">
      <div className="container mx-auto px-5 sm:px-8 max-w-6xl">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 14 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.35 }}
          transition={{ duration: 0.55, ease: 'easeOut' }}
          className="text-center max-w-2xl mx-auto"
        >
          <Pretitle text="Contacto" center />
          <h2 className="h2 mt-4 mb-4">
            ¿Listo para comenzar?
          </h2>
          <p className="text-muted-foreground leading-relaxed">
            Cuéntanos sobre tu operación y te responderemos con una propuesta clara y personalizada.
          </p>
        </motion.div>

        <div className="mt-12 xl:mt-14 grid gap-10 xl:grid-cols-2 xl:items-start">
          {/* Info */}
          <motion.div
            initial={{ opacity: 0, x: -18 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, amount: 0.25 }}
            transition={{ duration: 0.55, ease: 'easeOut' }}
            className="rounded-2xl border border-border bg-white p-6 sm:p-7 shadow-sm"
          >
            <h3 className="text-xl font-extrabold text-primary">
              Información de contacto
            </h3>
            <p className="mt-3 text-muted-foreground leading-relaxed">
              Nuestro equipo está listo para atenderte y evaluar tu necesidad operativa.
            </p>

            <div className="mt-6 space-y-5">
              <div className="flex gap-4">
                <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
                  <PiPhoneFill className="text-2xl text-primary" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Teléfono</p>
                  <p className="font-semibold text-foreground">
                    +51 915 149 329
                  </p>
                </div>
              </div>

              <div className="flex gap-4">
                <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
                  <PiEnvelopeFill className="text-2xl text-primary" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Correo</p>
                  <p className="font-semibold text-foreground">
                    ventas@globalpluscorporation.com
                  </p>
                </div>
              </div>

              <div className="flex gap-4">
                <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
                  <PiMapPinFill className="text-2xl text-primary" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Ubicación</p>
                  <p className="font-semibold text-foreground">
                    Perú
                  </p>
                </div>
              </div>
            </div>
          </motion.div>

          {/* Form */}
          <motion.form
            initial={{ opacity: 0, x: 18 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, amount: 0.25 }}
            transition={{ duration: 0.55, ease: 'easeOut' }}
            className="rounded-2xl border border-border bg-white p-6 sm:p-7 shadow-sm"
            onSubmit={handleSubmit}
          >
            <h3 className="text-xl font-extrabold text-primary">
              Envíanos un mensaje
            </h3>
            <p className="mt-3 text-muted-foreground leading-relaxed">
              Completa el formulario y nos pondremos en contacto contigo.
            </p>

            <div className="mt-6 grid gap-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <Input 
                  placeholder="Nombre completo" 
                  value={formData.name}
                  onChange={handleInputChange('name')}
                  required
                />
                <Input 
                  placeholder="Teléfono" 
                  value={formData.phone}
                  onChange={handleInputChange('phone')}
                />
              </div>

              <Input 
                placeholder="Correo corporativo" 
                type="email" 
                value={formData.email}
                onChange={handleInputChange('email')}
                required
              />
              <Input 
                placeholder="Asunto" 
                value={formData.subject}
                onChange={handleInputChange('subject')}
              />

              <Textarea
                placeholder="Cuéntanos brevemente sobre tu operación o necesidad"
                className="min-h-[140px]"
                value={formData.message}
                onChange={handleInputChange('message')}
                required
              />

              <Button
                type="submit"
                disabled={isSubmitting}
                className="mt-2 w-full sm:w-auto px-8 font-semibold"
              >
                {isSubmitting ? 'Enviando...' : 'Enviar mensaje'}
              </Button>
            </div>
          </motion.form>
        </div>
      </div>
    </section>
  )
}

export default Contact
