'use client'

import { useState } from 'react'
import { Tabs, TabsList, TabsContent, TabsTrigger } from '@/components/ui/tabs'
import Image from 'next/image'
import { PiWallFill } from 'react-icons/pi'

const serviceData = [
  {
    name: 'logistica',
    icon: PiWallFill,
    title: 'Servicios de logística',
    description: 'Brindamos el mejor servicio de logística de precisión',
    serviceList: ['Registros seguros', 'Procesos óptimos'],
    thumbs: [
      { url: '/imgReferencia/services/thumb-1.jpg' },
      { url: '/imgReferencia/services/thumb-2.jpg' },
    ],
  },
  {
    name: 'logistica2',
    icon: PiWallFill,
    title: 'Servicios de logística 2',
    description: 'Brindamos el mejor servicio de logística de precisión',
    serviceList: ['Registros seguros', 'Procesos óptimos'],
    thumbs: [
      { url: '/imgReferencia/services/thumb-3.jpg' },
      { url: '/imgReferencia/services/thumb-4.jpg' },
    ],
  },
  {
    name: 'logistica3',
    icon: PiWallFill,
    title: 'Servicios de logística 3',
    description: 'Brindamos el mejor servicio de logística de precisión',
    serviceList: ['Registros seguros', 'Procesos óptimos'],
    thumbs: [
      { url: '/imgReferencia/services/thumb-5.jpg' },
      { url: '/imgReferencia/services/thumb-6.jpg' },
    ],
  },
]

const Services = () => {
  const [activeTab, setActiveTab] = useState('logistica')

  return (
    <section id="services" className="py-16 xl:py-24">
      {/* Contenedor corporativo centrado */}
      <div className="mx-auto max-w-[1200px] px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-10 xl:mb-14">
          <h2 className="h2 mb-3">Proporcionamos soluciones</h2>
          <p className="max-w-[720px] mx-auto text-muted-foreground leading-relaxed">
            Offering tailored construction solutions, from planning to completion, with focus on quality and innovation
          </p>
        </div>

        <Tabs
          defaultValue="logistica"
          onValueChange={(value) => setActiveTab(value)}
          className="grid xl:grid-cols-[320px_1fr] gap-10 items-start"
        >
          {/* Tabs List */}
          <TabsList className="flex flex-col gap-6 h-full w-full rounded-none p-0 bg-transparent">
            {serviceData.map((item) => {
              const Icon = item.icon
              const isActive = activeTab === item.name

              return (
                <TabsTrigger
                  key={item.name}
                  value={item.name}
                  className={`relative w-full h-24 bg-white shadow-lg rounded-none p-0 outline-none transition ${
                    isActive ? 'ring-2 ring-primary' : ''
                  }`}
                >
                  {/* Icon box */}
                  <div
                    className={`absolute left-0 top-0 h-full w-24 flex items-center justify-center transition-all ${
                      isActive ? 'bg-primary text-white' : 'bg-custom text-shadow-black'
                    }`}
                  >
                    {/* Ícono dinámico (como tú lo usabas) */}
                    <Icon
                      className={`transition-all duration-300 ${
                        isActive ? 'text-white' : 'text-shadow-black'
                      }`}
                      style={{
                        width: isActive ? 56 : 32,
                        height: isActive ? 56 : 32,
                      }}
                    />
                  </div>

                  {/* Label */}
                  <div className="pl-[120px] pr-6 w-full text-left">
                    <div className="uppercase font-primary text-base font-semibold tracking-[.6px]">
                      {item.name}
                    </div>
                  </div>
                </TabsTrigger>
              )
            })}
          </TabsList>

          {/* Tabs Content */}
          <div className="bg-white shadow-lg p-6 md:p-8">
            {serviceData.map((item) => (
              <TabsContent key={item.name} value={item.name} className="m-0">
                <div className="grid lg:grid-cols-[260px_1fr] gap-10 items-start">
                  {/* Images */}
                  <div className="grid grid-cols-2 lg:grid-cols-1 gap-4">
                    {item.thumbs.map((thumb, index) => (
                      <div
                        key={index}
                        className="relative w-full aspect-square rounded overflow-hidden"
                      >
                        <Image
                          src={thumb.url}
                          fill
                          alt=""
                          className="object-cover"
                          sizes="(max-width: 1024px) 50vw, 260px"
                        />
                      </div>
                    ))}
                  </div>

                  {/* Text + list */}
                  <div>
                    <h3 className="h3 mb-4">{item.title}</h3>
                    <p className="mb-6 text-muted-foreground leading-relaxed">
                      {item.description}
                    </p>

                    <ul className="flex flex-col gap-3">
                      {item.serviceList.map((service, index) => (
                        <li key={index} className="flex items-center gap-3">
                          <div className="w-2 h-2 bg-accent rounded-full shrink-0" />
                          <div className="capitalize font-medium text-primary">
                            {service}
                          </div>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </TabsContent>
            ))}
          </div>
        </Tabs>
      </div>
    </section>
  )
}

export default Services
