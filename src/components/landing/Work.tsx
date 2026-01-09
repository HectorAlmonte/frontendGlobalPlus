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
      'Levantamos requerimientos, tiempos y presupuesto para ejecutar el proyecto con claridad desde el inicio.',
  },
  {
    icon: PiBlueprintFill,
    title: 'Diseño y estrategia',
    description:
      'Definimos el plan de trabajo, recursos y responsables para cumplir objetivos con precisión y control.',
  },
  {
    icon: PiHammerFill,
    title: 'Ejecución del proyecto',
    description:
      'Supervisión constante, control de calidad y comunicación continua durante toda la operación.',
  },
  {
    icon: PiShieldCheckFill,
    title: 'Entrega y garantía',
    description:
      'Cierre formal, validación final y soporte post-entrega cuando lo necesites.',
  },
]

const container = {
  hidden: {},
  show: { transition: { staggerChildren: 0.12, delayChildren: 0.1 } },
}

const item: Variants = {
  hidden: { opacity: 0, y: 16 },
  show: { opacity: 1, y: 0, transition: { duration: 0.45, ease: 'easeOut' } },
}

const Work = () => {
  return (
    <section id="work" className="py-16 sm:py-20 xl:py-28 overflow-hidden">
      <div className="container mx-auto px-5 sm:px-8 max-w-6xl">
        {/* Top */}
        <motion.div
          initial={{ opacity: 0, y: 14 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.3 }}
          transition={{ duration: 0.55, ease: 'easeOut' }}
          className="text-center max-w-2xl mx-auto"
        >
          <Pretitle text="Proceso de trabajo" center />
          <h2 className="h2 mt-4 mb-4">Así trabajamos contigo</h2>
          <p className="text-muted-foreground leading-relaxed">
            Un flujo claro para resultados consistentes: desde la planificación hasta la entrega final.
          </p>
        </motion.div>

        {/* Content */}
        <div className="mt-12 xl:mt-16 grid gap-10 xl:grid-cols-2 xl:items-center">
          {/* Image */}
          <motion.div
            initial={{ opacity: 0, scale: 0.985 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true, amount: 0.25 }}
            transition={{ duration: 0.6, ease: 'easeOut' }}
            className="
              relative w-full
              h-80 sm:h-[380px] xl:h-[520px]
              rounded-3xl overflow-hidden
              shadow-[0_18px_60px_rgba(0,0,0,0.18)]
              bg-primary
            "
          >
            {/* profundidad + ring */}
            <div className="pointer-events-none absolute inset-0 ring-1 ring-white/10" />
            <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(255,255,255,0.18),transparent_55%)]" />
            <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_80%_80%,rgba(0,0,0,0.22),transparent_60%)]" />

            <Image
              src="/images/work/workimg.png"
              alt="Proceso de trabajo"
              fill
              priority={false}
              className="object-cover"
              sizes="(max-width: 1280px) 100vw, 560px"
            />

            {/* overlay suave */}
            <div className="absolute inset-0 bg-linear-to-t from-black/45 via-black/15 to-transparent" />

            {/* caption opcional (corporativo) */}
            <div className="absolute bottom-5 left-5 right-5">
              <div className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-4 py-2 text-[12px] font-semibold tracking-[1.2px] uppercase text-white/90 backdrop-blur">
                Proceso estandarizado • Control • Entrega
              </div>
            </div>
          </motion.div>

          {/* Steps */}
          <motion.div
            variants={container}
            initial="hidden"
            whileInView="show"
            viewport={{ once: true, amount: 0.25 }}
            className="relative"
          >
            {/* línea vertical (timeline) */}
            <div className="pointer-events-none absolute left-[22px] top-2 bottom-2 w-px bg-border hidden sm:block" />

            <div className="grid gap-4 sm:gap-5">
              {steps.map((s, idx) => {
                const Icon = s.icon
                const stepNum = String(idx + 1).padStart(2, '0')

                return (
                  <motion.div
                    key={idx}
                    variants={item}
                    className="
                      group relative
                      rounded-2xl border border-border
                      bg-white
                      p-5 sm:p-6
                      shadow-sm
                      transition-all duration-200
                      hover:-translate-y-px hover:shadow-md
                    "
                  >
                    <div className="flex gap-4">
                      {/* left: number + icon */}
                      <div className="shrink-0 flex flex-col items-center">
                        <div className="grid h-11 w-11 place-items-center rounded-xl bg-primary text-white shadow-sm">
                          <Icon className="text-2xl" />
                        </div>
                        <div className="mt-2 text-[11px] font-extrabold tracking-[1.6px] text-primary/80">
                          {stepNum}
                        </div>
                      </div>

                      {/* right: content */}
                      <div className="flex-1">
                        <h3 className="text-[17px] sm:text-lg font-extrabold tracking-tight text-primary">
                          {s.title}
                        </h3>
                        <p className="mt-2 text-sm sm:text-[15px] text-muted-foreground leading-relaxed">
                          {s.description}
                        </p>

                        {/* detalle corporativo sutil */}
                        <div className="mt-4 flex items-center gap-2 text-xs text-muted-foreground">
                          <span className="h-1.5 w-1.5 rounded-full bg-accent" />
                          Seguimiento y comunicación durante la etapa
                        </div>
                      </div>
                    </div>

                    {/* borde activo sutil al hover */}
                    <div className="pointer-events-none absolute inset-0 rounded-2xl ring-1 ring-transparent group-hover:ring-primary/15 transition" />
                  </motion.div>
                )
              })}
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  )
}

export default Work
