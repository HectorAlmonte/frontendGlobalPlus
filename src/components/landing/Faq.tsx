import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion"

export default function FAQ() {
  return (
    <section className="py-16 sm:py-20 xl:py-28">
      <div className="container mx-auto px-5 sm:px-8">

        {/* Header */}
        <div className="text-center max-w-3xl mx-auto">
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
        </div>

        {/* Accordion */}
        <div className="mt-14 max-w-4xl mx-auto">
          <Accordion type="single" collapsible className="space-y-6">

            {/* ITEM 1 */}
            <AccordionItem
              value="item-1"
              className="rounded-2xl border border-border bg-background px-6 transition-shadow hover:shadow-lg"
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
                ¿Qué servicios ofrece Global Plus?
              </AccordionTrigger>

              <AccordionContent className="pb-6 text-base sm:text-lg leading-relaxed text-muted-foreground">
                En Global Plus brindamos soluciones integrales enfocadas en logística,
                optimización de procesos, soporte operativo y acompañamiento estratégico.
                Nuestro objetivo es mejorar la eficiencia, reducir costos y garantizar
                operaciones más seguras y ordenadas, adaptándonos a las necesidades
                específicas de cada empresa.
              </AccordionContent>
            </AccordionItem>

            {/* ITEM 2 */}
            <AccordionItem
              value="item-2"
              className="rounded-2xl border border-border bg-background px-6 transition-shadow hover:shadow-lg"
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
                ¿Cómo es el proceso de trabajo con su equipo?
              </AccordionTrigger>

              <AccordionContent className="pb-6 text-base sm:text-lg leading-relaxed text-muted-foreground">
                Nuestro proceso inicia con una evaluación detallada de tu operación actual.
                Luego definimos objetivos claros, elaboramos un plan de acción personalizado
                y acompañamos la implementación con seguimiento continuo, indicadores y
                mejoras progresivas para asegurar resultados sostenibles.
              </AccordionContent>
            </AccordionItem>

            {/* ITEM 3 */}
            <AccordionItem
              value="item-3"
              className="rounded-2xl border border-border bg-background px-6 transition-shadow hover:shadow-lg"
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
                ¿En cuánto tiempo se empiezan a ver resultados?
              </AccordionTrigger>

              <AccordionContent className="pb-6 text-base sm:text-lg leading-relaxed text-muted-foreground">
                Los tiempos varían según el alcance del proyecto, pero en la mayoría de
                los casos nuestros clientes comienzan a notar mejoras desde las primeras
                semanas. A corto plazo se optimizan procesos críticos y, a mediano plazo,
                se consolidan resultados medibles y sostenibles.
              </AccordionContent>
            </AccordionItem>

            {/* ITEM 4 (NUEVO) */}
            <AccordionItem
              value="item-4"
              className="rounded-2xl border border-border bg-background px-6 transition-shadow hover:shadow-lg"
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
                ¿Por qué elegir Global Plus y no otra empresa?
              </AccordionTrigger>

              <AccordionContent className="pb-6 text-base sm:text-lg leading-relaxed text-muted-foreground">
                Nos diferenciamos por nuestro enfoque personalizado, experiencia en
                operaciones reales y compromiso con los resultados. No ofrecemos
                soluciones genéricas: analizamos, acompañamos y optimizamos cada proceso
                como si fuera propio, generando confianza y relaciones a largo plazo.
              </AccordionContent>
            </AccordionItem>

          </Accordion>
        </div>
      </div>
    </section>
  )
}
