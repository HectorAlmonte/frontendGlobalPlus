'use client'

import { useMemo, useState } from 'react'
import { Tabs, TabsList, TabsContent, TabsTrigger } from '@/components/ui/tabs'
import {
  RiTruckLine,
  RiRouteLine,
  RiLineChartLine,
} from 'react-icons/ri'
import { motion, AnimatePresence } from 'framer-motion'
import { RiArrowRightUpLine, RiCheckLine } from 'react-icons/ri'

const serviceData = [
  {
    name: 'logistica',
    icon: RiTruckLine,
    label: 'Logística',
    title: 'Servicios de logística integral',
    description:
      'Soluciones logísticas end-to-end con enfoque en control, seguridad y eficiencia operativa, adaptadas a la realidad de tu operación.',
    includes: [
      'Planificación y coordinación operativa',
      'Control de patios y almacenes',
      'Supervisión en campo (SST y operación)',
      'Gestión de inventario y movimientos',
      'Reportes diarios/semanales y KPIs',
      'Gestión documental y control de accesos',
    ],
    deliverables: [
      'Plan operativo y matriz de responsabilidades (RACI)',
      'Formatos y registros (checklists / bitácoras)',
      'Indicadores de control (tablero básico)',
      'Reporte de hallazgos y plan de mejora',
    ],
    highlights: [
      'Control y trazabilidad',
      'Reducción de riesgos',
      'Ejecución disciplinada',
    ],
  },
  {
    name: 'logistica2',
    icon: RiRouteLine,
    label: 'Trazabilidad',
    title: 'Trazabilidad y control operacional',
    description:
      'Optimizamos tu operación con procesos claros, trazabilidad y mejora continua para reducir variabilidad, riesgos y costos.',
    includes: [
      'Diseño de formatos y registros (checklists)',
      'Gestión de incidencias y hallazgos',
      'Cuadros de mando (KPI) por área',
      'Capacitación operativa al equipo',
      'Seguimiento y control de cumplimiento',
      'Estandarización de procesos (SOP)',
    ],
    deliverables: [
      'Mapa de proceso + puntos críticos de control',
      'Rutinas de seguimiento y auditoría',
      'Tablero de indicadores por área',
      'Reporte ejecutivo de cumplimiento',
    ],
    highlights: [
      'Visibilidad 360°',
      'Menos incidencias',
      'Mejora continua',
    ],
  },
  {
    name: 'logistica3',
    icon: RiLineChartLine,
    label: 'Optimización',
    title: 'Soporte operativo y optimización',
    description:
      'Acompañamiento operativo y estratégico para reducir costos, mitigar riesgos y mejorar el desempeño con resultados medibles.',
    includes: [
      'Supervisión y soporte en turnos críticos',
      'Optimización de recursos (según operación)',
      'Estándares de seguridad y orden',
      'Plan de mejora con entregables',
      'Reunión de avance + reporte ejecutivo',
      'Control de desviaciones y acciones correctivas',
    ],
    deliverables: [
      'Plan de mejora (acciones, responsables, fechas)',
      'Reporte de productividad y oportunidades',
      'Estandarización de rutinas operativas',
      'Informe de avance y cierre por etapa',
    ],
    highlights: [
      'Productividad',
      'Control operativo',
      'Resultados medibles',
    ],
  },
]

const Services = () => {
  const [activeTab, setActiveTab] = useState('logistica')

  const activeItem = useMemo(
    () => serviceData.find((s) => s.name === activeTab) ?? serviceData[0],
    [activeTab]
  )

  return (
    <section id="services" className="py-16 xl:py-24 overflow-hidden">
      <div className="mx-auto max-w-[1200px] px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <motion.div
          className="text-center mb-10 xl:mb-14"
          initial={{ opacity: 0, y: 14 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.35 }}
          transition={{ duration: 0.6, ease: 'easeOut' }}
        >
          <h2 className="h2 mb-3">Proporcionamos soluciones</h2>
          <p className="max-w-[720px] mx-auto text-muted-foreground leading-relaxed">
            Soluciones logísticas a medida: desde el diagnóstico hasta la implementación, con enfoque en control y eficiencia.
          </p>
        </motion.div>

        <Tabs
          value={activeTab}
          onValueChange={(value) => setActiveTab(value)}
          className="grid xl:grid-cols-[320px_1fr] gap-10 items-start"
        >
          {/* Tabs List */}
            <TabsList
              className="
                !flex !flex-col !items-stretch
                !h-auto !w-full
                !bg-transparent !p-0
                gap-6
              "
            >
            {serviceData.map((item, idx) => {
              const Icon = item.icon
              const isActive = activeTab === item.name

              return (
                <motion.div
                  key={item.name}
                  initial={{ opacity: 0, y: 10 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, amount: 0.25 }}
                  transition={{ duration: 0.45, ease: 'easeOut', delay: idx * 0.06 }}
                >
                  <TabsTrigger
                    value={item.name}
                    className={`
                      relative w-full h-28
                      bg-white shadow-lg rounded-none px-6 outline-none
                      flex items-center transition-all duration-200
                      hover:-translate-y-px hover:shadow-xl
                      ${isActive ? 'ring-2 ring-primary' : ''}
                    `}
                  >
                    {/* Icon box */}
                    <motion.div
                      className={`
                        absolute left-0 top-0 h-full w-28
                        flex items-center justify-center transition-colors duration-200
                        ${isActive ? 'bg-primary text-white' : 'bg-muted text-primary'}
                      `}
                      animate={{ width: 112 }}
                      transition={{ duration: 0.2 }}
                    >
                      <motion.div
                        animate={{ scale: isActive ? 1.06 : 1 }}
                        transition={{ type: 'spring', stiffness: 260, damping: 18 }}
                      >
                        <Icon
                          className={`${isActive ? 'text-white' : 'text-primary'}`}
                          style={{
                            width: isActive ? 54 : 36,
                            height: isActive ? 54 : 36,
                            transition: 'all 200ms ease',
                          }}
                        />
                      </motion.div>
                    </motion.div>

                    {/* Label */}
                    <div className="pl-36 pr-2 w-full text-left">
                      <div className="uppercase font-primary text-[14px] font-semibold tracking-[.9px] text-primary">
                        {item.label}
                      </div>
                      <div className="mt-1 text-[13px] text-muted-foreground line-clamp-2">
                        {item.title}
                      </div>
                    </div>
                  </TabsTrigger>
                </motion.div>
              )
            })}
          </TabsList>

          {/* Content wrapper */}
          <div className="bg-white shadow-lg p-6 md:p-8">
            {/* Mantengo TabsContent por compatibilidad */}
            {serviceData.map((item) => (
              <TabsContent key={item.name} value={item.name} className="m-0" />
            ))}

            <AnimatePresence mode="wait" initial={false}>
              <motion.div
                key={activeItem.name}
                initial={{ opacity: 0, y: 14 }}
                animate={{ opacity: 1, y: 0, transition: { duration: 0.32, ease: 'easeOut' } }}
                exit={{ opacity: 0, y: 10, transition: { duration: 0.2, ease: 'easeIn' } }}
              >
                {/* Top: Title + highlights chips */}
                <div className="flex flex-col gap-4">
                  <div>
                      <h3 className="text-xl sm:text-2xl font-extrabold tracking-tight text-primary">
                      {activeItem.title}
                    </h3>
                    <p className="mt-3 text-muted-foreground leading-relaxed max-w-[760px]">
                      {activeItem.description}
                    </p>
                  </div>

                  {/* Highlights */}
                  <div className="flex flex-wrap gap-2">
                    {activeItem.highlights.map((h) => (
                      <span
                        key={h}
                        className="rounded-full border border-border bg-muted/30 px-3 py-1 text-[12px] font-semibold text-primary"
                      >
                        {h}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Divider */}
                <div className="my-7 h-px w-full bg-border" />

                {/* Alcance + Entregables */}
                <div className="grid lg:grid-cols-2 gap-8">
                  {/* Alcance */}
                  <div>
                    <div className="text-sm font-extrabold tracking-wide uppercase text-primary mb-3 flex items-center gap-2">
                      <RiCheckLine />
                      Alcance del servicio
                    </div>

                    <ul className="grid gap-3">
                      {activeItem.includes.map((i) => (
                        <li key={i} className="flex items-start gap-3">
                          <span className="mt-2 h-2 w-2 rounded-full bg-accent shrink-0" />
                          <span className="text-sm text-foreground/90 leading-relaxed">{i}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* Entregables */}
                  <div className="rounded-2xl border border-border bg-muted/20 p-5">
                    <div className="text-sm font-extrabold tracking-wide uppercase text-primary mb-3 flex items-center gap-2">
                      <RiCheckLine />
                      Entregables
                    </div>

                    <ul className="grid gap-3">
                      {activeItem.deliverables.map((d) => (
                        <li key={d} className="flex items-start gap-3">
                          <span className="mt-1.5 grid h-5 w-5 place-items-center rounded-full bg-primary text-white text-[12px] font-extrabold">
                            ✓
                          </span>
                          <span className="text-sm text-foreground/90 leading-relaxed">{d}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>

                {/* CTA */}
                <div className="mt-9 flex flex-col sm:flex-row gap-3 sm:items-center sm:justify-between">
                  <p className="text-sm text-muted-foreground">
                    ¿Quieres que evaluemos tu operación y propongamos un plan de control y eficiencia?
                  </p>

                  <button
                    type="button"
                    onClick={() => {
                      const el = document.getElementById('contact')
                      if (el) el.scrollIntoView({ behavior: 'smooth' })
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
                      Solicitar diagnóstico
                    </span>

                    <span className="mr-2 grid h-9 w-9 place-items-center rounded-full bg-white/10 border border-white/15">
                      <RiArrowRightUpLine className="text-white text-lg group-hover:rotate-45 transition-transform duration-200" />
                    </span>
                  </button>
                </div>
              </motion.div>
            </AnimatePresence>
          </div>
        </Tabs>
      </div>
    </section>
  )
}

export default Services
