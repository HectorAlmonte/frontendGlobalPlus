'use client'

import React from 'react'
import Image from 'next/image'
import { motion, type Variants } from 'framer-motion'
import Pretitle from '@/components/landing/basicComponents/Pretitle'

import {
  PiClipboardTextFill,
  PiBlueprintFill,
  PiHammerFill,
  PiShieldCheckFill,
} from 'react-icons/pi'

const steps = [
  {
    icon: PiClipboardTextFill,
    title: 'Diagnóstico y planificación',
    description:
      'Levantamos requerimientos, tiempos y presupuesto para ejecutar el proyecto sin sorpresas.',
  },
  {
    icon: PiBlueprintFill,
    title: 'Diseño y estrategia',
    description:
      'Definimos el plan de trabajo, recursos y responsables para cumplir objetivos con precisión.',
  },
  {
    icon: PiHammerFill,
    title: 'Ejecución del proyecto',
    description:
      'Supervisión constante, control de calidad y comunicación clara durante todo el proceso.',
  },
  {
    icon: PiShieldCheckFill,
    title: 'Entrega y garantía',
    description:
      'Cierre formal del trabajo, validación final y soporte post-entrega cuando lo necesites.',
  },
]

const container = {
  hidden: {},
  show: {
    transition: { staggerChildren: 0.12, delayChildren: 0.1 },
  },
}

const item: Variants = {
  hidden: { opacity: 0, y: 18 },
  show: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.45, ease: 'easeOut' },
  },
}

const Work = () => {
  return (
    <section id="work" className="py-16 sm:py-20 xl:py-28">
      <div className="container mx-auto px-5 sm:px-8">
        {/* Top */}
        <motion.div
          initial={{ opacity: 0, y: 14 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.3 }}
          transition={{ duration: 0.5, ease: 'easeOut' }}
          className="text-center max-w-2xl mx-auto"
        >
          <Pretitle text="Proceso de trabajo" center />
          <h2 className="h2 mt-4 mb-4">Así trabajamos contigo</h2>
          <p className="text-muted-foreground leading-relaxed">
            Un flujo simple y claro para lograr resultados consistentes: desde la
            planificación hasta la entrega final.
          </p>
        </motion.div>

        {/* Content */}
        <div className="mt-12 xl:mt-16 grid gap-10 xl:grid-cols-2 xl:items-center">
          {/* Image */}
          <motion.div
            initial={{ opacity: 0, scale: 0.98 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true, amount: 0.25 }}
            transition={{ duration: 0.55, ease: 'easeOut' }}
            className="relative w-full h-[320px] sm:h-[380px] xl:h-[520px] rounded-2xl overflow-hidden shadow-lg"
          >
            {/* Cambia esta ruta por una imagen tuya */}
            <Image
              src="/imgReferencia/work/work-1.jpg"
              alt="Proceso de trabajo"
              fill
              priority={false}
              className="object-cover"
            />
            {/* Overlay suave */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/35 via-black/10 to-transparent" />
          </motion.div>

          {/* Steps */}
          <motion.div
            variants={container}
            initial="hidden"
            whileInView="show"
            viewport={{ once: true, amount: 0.25 }}
            className="grid gap-4 sm:gap-5"
          >
            {steps.map((s, idx) => {
              const Icon = s.icon
              return (
                <motion.div
                  key={idx}
                  variants={item}
                  className="rounded-2xl border bg-background p-5 sm:p-6 shadow-sm hover:shadow-md transition-shadow"
                >
                  <div className="flex gap-4">
                    <div className="shrink-0 w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
                      <Icon className="text-2xl text-primary" />
                    </div>

                    <div className="flex-1">
                      <div className="flex items-center justify-between gap-3">
                        <h3 className="text-lg font-semibold">{s.title}</h3>
                        <span className="text-xs font-medium text-muted-foreground">
                          0{idx + 1}
                        </span>
                      </div>
                      <p className="mt-2 text-sm sm:text-[15px] text-muted-foreground leading-relaxed">
                        {s.description}
                      </p>
                    </div>
                  </div>
                </motion.div>
              )
            })}
          </motion.div>
        </div>
      </div>
    </section>
  )
}

export default Work
