'use client'

import { useState } from "react"
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion"
import { motion, AnimatePresence, type Variants } from "framer-motion"

export default function FAQ() {
  const [openItem, setOpenItem] = useState<string | undefined>(undefined)

  const itemVariants: Variants = {
    hidden: { opacity: 0, y: 14 },
    show: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.55, ease: "easeOut" },
    },
  }

  const contentMotion: {
    initial: Variants[string]
    animate: Variants[string]
    exit: Variants[string]
  } = {
    initial: { opacity: 0, y: 10 },
    animate: { opacity: 1, y: 0, transition: { duration: 0.25, ease: "easeOut" } },
    exit: { opacity: 0, y: 6, transition: { duration: 0.18, ease: "easeIn" } },
  }

  const handleValueChange = (value: string) => {
    // Radix/shadcn puede devolver "" cuando collapsible está activo
    setOpenItem(value || undefined)
  }

  return (
    <section className="py-16 sm:py-20 xl:py-28 overflow-hidden">
      <div className="container mx-auto px-5 sm:px-8">
        {/* Header */}
        <motion.div
          className="text-center max-w-3xl mx-auto"
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.35 }}
          transition={{ duration: 0.6, ease: "easeOut" }}
        >
          <p className="text-sm tracking-widest uppercase text-muted-foreground">
            Soporte & Consultas
          </p>

          <h2 className="mt-3 text-3xl sm:text-4xl xl:text-5xl font-bold tracking-tight">
            Preguntas frecuentes
          </h2>

          <p className="mt-5 text-base sm:text-lg text-muted-foreground leading-relaxed">
            Aquí respondemos las dudas más comunes de nuestros clientes para que
            puedas tomar una decisión informada y con total confianza.
          </p>
        </motion.div>

        {/* Accordion */}
        <motion.div
          className="mt-14 max-w-4xl mx-auto"
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, amount: 0.25 }}
          variants={{
            hidden: {},
            show: { transition: { staggerChildren: 0.12, delayChildren: 0.1 } },
          }}
        >
          <Accordion
            type="single"
            collapsible
            value={openItem}
            onValueChange={handleValueChange}
            className="space-y-6"
          >
            {[
              {
                value: "item-1",
                q: "¿Qué servicios ofrece Global Plus?",
                a: `En Global Plus brindamos soluciones integrales enfocadas en logística,
                    optimización de procesos, soporte operativo y acompañamiento estratégico.
                    Nuestro objetivo es mejorar la eficiencia, reducir costos y garantizar
                    operaciones más seguras y ordenadas, adaptándonos a las necesidades
                    específicas de cada empresa.`,
              },
              {
                value: "item-2",
                q: "¿Cómo es el proceso de trabajo con su equipo?",
                a: `Nuestro proceso inicia con una evaluación detallada de tu operación actual.
                    Luego definimos objetivos claros, elaboramos un plan de acción personalizado
                    y acompañamos la implementación con seguimiento continuo, indicadores y
                    mejoras progresivas para asegurar resultados sostenibles.`,
              },
              {
                value: "item-3",
                q: "¿En cuánto tiempo se empiezan a ver resultados?",
                a: `Los tiempos varían según el alcance del proyecto, pero en la mayoría de
                    los casos nuestros clientes comienzan a notar mejoras desde las primeras
                    semanas. A corto plazo se optimizan procesos críticos y, a mediano plazo,
                    se consolidan resultados medibles y sostenibles.`,
              },
              {
                value: "item-4",
                q: "¿Por qué elegir Global Plus y no otra empresa?",
                a: `Nos diferenciamos por nuestro enfoque personalizado, experiencia en
                    operaciones reales y compromiso con los resultados. No ofrecemos
                    soluciones genéricas: analizamos, acompañamos y optimizamos cada proceso
                    como si fuera propio, generando confianza y relaciones a largo plazo.`,
              },
            ].map((item) => (
              <motion.div key={item.value} variants={itemVariants}>
                <AccordionItem
                  value={item.value}
                  className="rounded-2xl border border-border bg-background px-6
                             transition-all duration-200
                             hover:shadow-lg hover:-translate-y-[1px]"
                >
                  <AccordionTrigger
                    className="
                      py-6 text-left
                      text-xl sm:text-2xl xl:text-[26px]
                      font-bold tracking-tight
                      hover:no-underline
                      [&>svg]:h-6 [&>svg]:w-6
                      [&>svg]:transition-transform
                      [&[data-state=open]>svg]:rotate-180
                    "
                  >
                    {item.q}
                  </AccordionTrigger>

                  <AccordionContent className="pb-6 text-base sm:text-lg leading-relaxed text-muted-foreground">
                    <AnimatePresence initial={false}>
                      {openItem === item.value && (
                        <motion.div
                          key={`${item.value}-content`}
                          initial={contentMotion.initial as any}
                          animate={contentMotion.animate as any}
                          exit={contentMotion.exit as any}
                        >
                          {item.a}
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </AccordionContent>
                </AccordionItem>
              </motion.div>
            ))}
          </Accordion>
        </motion.div>
      </div>
    </section>
  )
}
