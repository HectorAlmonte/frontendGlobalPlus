'use client'

import { useMemo, useState } from 'react'
import { Tabs, TabsList, TabsContent, TabsTrigger } from '@/components/ui/tabs'
import Image from 'next/image'
import { PiWallFill } from 'react-icons/pi'
import { motion, AnimatePresence } from 'framer-motion'

const serviceData = [
  {
    name: 'logistica',
    icon: PiWallFill,
    title: 'Servicios de logística',
    description: 'Brindamos soluciones logísticas integrales con enfoque en control, seguridad y eficiencia operativa.',
    serviceList: ['Registros seguros', 'Procesos óptimos'],
    thumbs: [
      { url: '/images/services/img3.png' },
      { url: '/images/services/img2.png' },
    ],
  },
  {
    name: 'logistica2',
    icon: PiWallFill,
    title: 'Servicios de logística 2',
    description: 'Optimizamos la operación con procesos claros, trazabilidad y mejoras continuas adaptadas a tu negocio.',
    serviceList: ['Trazabilidad', 'Mejora continua'],
    thumbs: [
      { url: '/imgReferencia/services/thumb-3.jpg' },
      { url: '/imgReferencia/services/thumb-4.jpg' },
    ],
  },
  {
    name: 'logistica3',
    icon: PiWallFill,
    title: 'Servicios de logística 3',
    description: 'Acompañamiento operativo y estratégico para reducir costos, mitigar riesgos y mejorar el desempeño.',
    serviceList: ['Soporte operativo', 'Resultados medibles'],
    thumbs: [
      { url: '/imgReferencia/services/thumb-5.jpg' },
      { url: '/imgReferencia/services/thumb-6.jpg' },
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
          <TabsList className="flex flex-col gap-6 h-full w-full rounded-none p-0 bg-transparent">
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
                      relative w-full ${isActive ? 'h-[116px]' : 'h-[110px]'}
                      bg-white shadow-lg rounded-none px-6 outline-none
                      flex items-center transition-all duration-200
                      hover:-translate-y-[1px] hover:shadow-xl
                      ${isActive ? 'ring-2 ring-primary' : ''}
                    `}
                  >
                    {/* Icon box */}
                    <motion.div
                      className={`
                        absolute left-0 top-0 h-full w-28
                        flex items-center justify-center transition-colors duration-200
                        ${isActive ? 'bg-primary text-white' : 'bg-custom text-shadow-black'}
                      `}
                      animate={{ width: 112 }}
                      transition={{ duration: 0.2 }}
                    >
                      <motion.div
                        animate={{ scale: isActive ? 1.08 : 1 }}
                        transition={{ type: 'spring', stiffness: 260, damping: 18 }}
                      >
                        <Icon
                          className={`${isActive ? 'text-white' : 'text-shadow-black'}`}
                          style={{
                            width: isActive ? 56 : 36,
                            height: isActive ? 56 : 36,
                            transition: 'all 200ms ease',
                          }}
                        />
                      </motion.div>
                    </motion.div>

                    {/* Label */}
                    <div className="pl-[140px] pr-2 w-full text-left">
                      <div className="uppercase font-primary text-[15px] font-semibold tracking-[.8px]">
                        {item.name}
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
                animate={{
                  opacity: 1,
                  y: 0,
                  transition: { duration: 0.35, ease: 'easeOut', staggerChildren: 0.08 },
                }}
                exit={{ opacity: 0, y: 10, transition: { duration: 0.2, ease: 'easeIn' } }}
              >
                <div className="grid lg:grid-cols-[260px_1fr] gap-10 items-start">
                  {/* Images */}
                  <motion.div
                    className="grid grid-cols-2 lg:grid-cols-1 gap-4"
                    initial="hidden"
                    animate="show"
                    variants={{
                      hidden: {},
                      show: { transition: { staggerChildren: 0.08 } },
                    }}
                  >
                    {activeItem.thumbs.map((thumb, index) => (
                      <motion.div
                        key={thumb.url}
                        className="relative w-full aspect-square rounded overflow-hidden"
                        variants={{
                          hidden: { opacity: 0, y: 10 },
                          show: {
                            opacity: 1,
                            y: 0,
                            transition: { duration: 0.35, ease: 'easeOut' },
                          },
                        }}
                        whileHover={{ y: -2 }}
                        transition={{ duration: 0.2 }}
                      >
                        <Image
                          src={thumb.url}
                          fill
                          alt=""
                          className="object-cover"
                          sizes="(max-width: 1024px) 50vw, 260px"
                        />
                      </motion.div>
                    ))}
                  </motion.div>

                  {/* Text + list */}
                  <div>
                    <motion.h3
                      className="h3 mb-4"
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0, transition: { duration: 0.35, ease: 'easeOut' } }}
                    >
                      {activeItem.title}
                    </motion.h3>

                    <motion.p
                      className="mb-6 text-muted-foreground leading-relaxed"
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0, transition: { duration: 0.35, ease: 'easeOut', delay: 0.04 } }}
                    >
                      {activeItem.description}
                    </motion.p>

                    <motion.ul
                      className="flex flex-col gap-3"
                      initial="hidden"
                      animate="show"
                      variants={{
                        hidden: {},
                        show: { transition: { staggerChildren: 0.06, delayChildren: 0.06 } },
                      }}
                    >
                      {activeItem.serviceList.map((service) => (
                        <motion.li
                          key={service}
                          className="flex items-center gap-3"
                          variants={{
                            hidden: { opacity: 0, y: 8 },
                            show: { opacity: 1, y: 0, transition: { duration: 0.28, ease: 'easeOut' } },
                          }}
                        >
                          <div className="w-2 h-2 bg-accent rounded-full shrink-0" />
                          <div className="capitalize font-medium text-primary">
                            {service}
                          </div>
                        </motion.li>
                      ))}
                    </motion.ul>
                  </div>
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
