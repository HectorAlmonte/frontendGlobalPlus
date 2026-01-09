'use client'

import { useState } from "react"
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion"
import { motion, type Variants } from "framer-motion"
import Pretitle from "@/components/landing/basicComponents/Pretitle"
import { RiArrowRightUpLine } from "react-icons/ri"

export default function FAQ() {
  const [openItem, setOpenItem] = useState<string | undefined>(undefined)

  const itemVariants: Variants = {
    hidden: { opacity: 0, y: 12 },
    show: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.5, ease: "easeOut" },
    },
  }

  const handleValueChange = (value: string) => {
    setOpenItem(value || undefined)
  }

  const faqs = [
    {
      value: "item-1",
      q: "¿Qué servicios ofrece Global Plus?",
      a: `En Global Plus brindamos soluciones integrales enfocadas en logística, optimización de procesos,
          soporte operativo y acompañamiento estratégico. Nuestro objetivo es mejorar la eficiencia,
          reducir costos y garantizar operaciones más seguras y ordenadas, adaptándonos a las necesidades
          específicas de cada empresa.`,
    },
    {
      value: "item-2",
      q: "¿Cómo es el proceso de trabajo con su equipo?",
      a: `Nuestro proceso inicia con una evaluación detallada de tu operación actual. Luego definimos
          objetivos claros, elaboramos un plan de acción personalizado y acompañamos la implementación
          con seguimiento continuo, indicadores y mejoras progresivas para asegurar resultados sostenibles.`,
    },
    {
      value: "item-3",
      q: "¿En cuánto tiempo se empiezan a ver resultados?",
      a: `Los tiempos varían según el alcance del proyecto, pero en la mayoría de los casos nuestros
          clientes comienzan a notar mejoras desde las primeras semanas. A corto plazo se optimizan
          procesos críticos y, a mediano plazo, se consolidan resultados medibles y sostenibles.`,
    },
    {
      value: "item-4",
      q: "¿Por qué elegir Global Plus y no otra empresa?",
      a: `Nos diferenciamos por nuestro enfoque personalizado, experiencia en operaciones reales y
          compromiso con los resultados. No ofrecemos soluciones genéricas: analizamos, acompañamos y
          optimizamos cada proceso como si fuera propio, generando confianza y relaciones a largo plazo.`,
    },
  ]

  return (
    <section className="py-16 sm:py-20 xl:py-28 overflow-hidden bg-muted/20">
      <div className="container mx-auto px-5 sm:px-8 max-w-6xl">
        {/* Header (mismo patrón del resto) */}
        <motion.div
          className="text-center max-w-3xl mx-auto"
          initial={{ opacity: 0, y: 14 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.35 }}
          transition={{ duration: 0.55, ease: "easeOut" }}
        >
          <Pretitle text="Soporte & Consultas" center />

          <h2 className="h2 mt-4">Preguntas frecuentes</h2>

          <p className="mt-4 text-base sm:text-lg text-muted-foreground leading-relaxed">
            Resolvemos las dudas más comunes para que tomes una decisión informada y con total confianza.
          </p>
        </motion.div>

        {/* Accordion */}
        <motion.div
          className="mt-12 max-w-4xl mx-auto"
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, amount: 0.25 }}
          variants={{
            hidden: {},
            show: { transition: { staggerChildren: 0.1, delayChildren: 0.08 } },
          }}
        >
          <Accordion
            type="single"
            collapsible
            value={openItem}
            onValueChange={handleValueChange}
            className="space-y-4"
          >
            {faqs.map((item) => (
              <motion.div key={item.value} variants={itemVariants}>
                <AccordionItem
                  value={item.value}
                  className={`
                    group rounded-2xl border border-border
                    bg-white/85 backdrop-blur
                    px-5 sm:px-6
                    shadow-sm
                    transition-all duration-200
                    hover:shadow-md hover:-translate-y-[1px]
                    ${openItem === item.value ? "ring-1 ring-primary/20" : ""}
                  `}
                >
                  <AccordionTrigger
                    className="
                      py-5 text-left
                      text-[16px] sm:text-[18px] xl:text-[20px]
                      font-extrabold tracking-tight text-primary
                      hover:no-underline
                      focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30 focus-visible:ring-offset-2
                      [&>svg]:h-5 [&>svg]:w-5
                      [&>svg]:transition-transform
                      [&[data-state=open]>svg]:rotate-180
                    "
                  >
                    {item.q}
                  </AccordionTrigger>

                  {/* IMPORTANTE:
                     aquí NO usamos AnimatePresence para que el cierre no sea brusco.
                     La animación suave la hace Radix/shadcn con altura (accordion-up/down). */}
                  <AccordionContent className="pb-6 pt-0 text-[14px] sm:text-[15px] leading-relaxed text-muted-foreground">
                    <div className="pt-1">
                      {item.a}
                    </div>
                  </AccordionContent>
                </AccordionItem>
              </motion.div>
            ))}
          </Accordion>

          {/* CTA final consistente */}
          <motion.div
            className="mt-10 flex flex-col sm:flex-row items-center justify-between gap-4 rounded-2xl border border-border bg-white/80 backdrop-blur px-6 py-5 shadow-sm"
            initial={{ opacity: 0, y: 12 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.25 }}
            transition={{ duration: 0.5, ease: "easeOut" }}
          >
            <div>
              <div className="text-base font-extrabold text-primary">¿Aún tienes dudas?</div>
              <div className="mt-1 text-sm text-muted-foreground">
                Escríbenos y te orientamos según tu operación.
              </div>
            </div>

            <button
              type="button"
              onClick={() => {
                const el = document.getElementById("contact")
                if (el) el.scrollIntoView({ behavior: "smooth" })
              }}
              className="
                group h-[46px] w-full sm:w-auto min-w-[220px]
                inline-flex items-center justify-between
                rounded-full
                bg-primary text-white
                border border-primary/30
                shadow-sm
                transition-all duration-200
                hover:-translate-y-px hover:shadow-md
              "
            >
              <span className="flex-1 text-center tracking-[1.2px] font-primary font-extrabold text-[13px] uppercase">
                Contactar ahora
              </span>
              <span className="mr-2 grid h-9 w-9 place-items-center rounded-full bg-white/10 border border-white/15">
                <RiArrowRightUpLine className="text-white text-lg group-hover:rotate-45 transition-transform duration-200" />
              </span>
            </button>
          </motion.div>
        </motion.div>
      </div>
    </section>
  )
}
