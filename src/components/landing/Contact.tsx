'use client'

import React from 'react'
import { motion } from 'framer-motion'
import Pretitle from '@/components/landing/basicComponents/Pretitle'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Button } from '@/components/ui/button'

import { PiPhoneFill, PiEnvelopeFill, PiMapPinFill } from 'react-icons/pi'

const Contact = () => {
  return (
    <section id="contact" className="py-16 sm:py-20 xl:py-28 bg-slate-100">
      <div className="container mx-auto px-5 sm:px-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 14 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.35 }}
          transition={{ duration: 0.55, ease: 'easeOut' }}
          className="text-center max-w-2xl mx-auto"
        >
          <Pretitle text="Contact" center />
          <h2 className="text-3xl sm:text-4xl font-semibold mt-4 mb-4 text-slate-900">
            ¿Listo para comenzar?
          </h2>
          <p className="text-slate-600 leading-relaxed">
            Cuéntanos qué necesitas y te responderemos con una propuesta lo antes posible.
          </p>
        </motion.div>

        <div className="mt-12 xl:mt-14 grid gap-10 xl:grid-cols-2 xl:items-start">
          {/* Info */}
          <motion.div
            initial={{ opacity: 0, x: -18 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, amount: 0.25 }}
            transition={{ duration: 0.55, ease: 'easeOut' }}
            className="rounded-2xl border border-slate-200 bg-white p-6 sm:p-7 shadow-sm"
          >
            <h3 className="text-xl font-semibold text-slate-900">
              Información de contacto
            </h3>
            <p className="mt-3 text-slate-600 leading-relaxed">
              Estamos listos para atenderte. Escríbenos o llámanos y coordinamos.
            </p>

            <div className="mt-6 space-y-4">
              <div className="flex gap-4">
                <div className="w-12 h-12 rounded-xl bg-slate-100 flex items-center justify-center">
                  <PiPhoneFill className="text-2xl text-slate-900" />
                </div>
                <div>
                  <p className="text-sm text-slate-500">Teléfono</p>
                  <p className="text-slate-900 font-medium">+51 999 999 999</p>
                </div>
              </div>

              <div className="flex gap-4">
                <div className="w-12 h-12 rounded-xl bg-slate-100 flex items-center justify-center">
                  <PiEnvelopeFill className="text-2xl text-slate-900" />
                </div>
                <div>
                  <p className="text-sm text-slate-500">Correo</p>
                  <p className="text-slate-900 font-medium">contacto@tuempresa.com</p>
                </div>
              </div>

              <div className="flex gap-4">
                <div className="w-12 h-12 rounded-xl bg-slate-100 flex items-center justify-center">
                  <PiMapPinFill className="text-2xl text-slate-900" />
                </div>
                <div>
                  <p className="text-sm text-slate-500">Ubicación</p>
                  <p className="text-slate-900 font-medium">Lima, Perú</p>
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
            className="rounded-2xl border border-slate-200 bg-white p-6 sm:p-7 shadow-sm"
            onSubmit={(e) => e.preventDefault()}
          >
            <h3 className="text-xl font-semibold text-slate-900">Envíanos un mensaje</h3>
            <p className="mt-3 text-slate-600 leading-relaxed">
              Completa el formulario y te contactaremos.
            </p>

            <div className="mt-6 grid gap-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <Input placeholder="Nombre" />
                <Input placeholder="Teléfono" />
              </div>
              <Input placeholder="Correo" type="email" />
              <Input placeholder="Asunto" />
              <Textarea placeholder="Mensaje" className="min-h-[140px]" />

              <Button className="w-full sm:w-auto">
                Enviar mensaje
              </Button>
            </div>
          </motion.form>
        </div>
      </div>
    </section>
  )
}

export default Contact
