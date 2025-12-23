'use client'

import {useState} from 'react'
import {Tabs,TabsList, TabsContent, TabsTrigger} from '@/components/ui/tabs'
import Image from 'next/image'
import ButtonHero from './basicComponents/ButtonHero'

import {
  PiWallFill,
  PiPaintRollerFill,
  PiWrenchFill,
  PiUserGearFill  
} from 'react-icons/pi'

const serviceData = [
  {
    name:'logistica',
    icon: <PiWallFill/>,
    title: 'Servicios de logistica',
    description:'Brindamos el mejor servicio de logistica deprescicion',
    serviceList:[
      'Registros seguros',
      'Procesos optimos',
    ],
    thumbs: [
      { url: '/public/imgReferencia/services/thum-1.jpg' },
      { url: '/public/imgReferencia/services/thum-2.jpg' }  
    ]
  },
  {
    name:'logistica2',
    icon: <PiWallFill/>,
    title: 'Servicios de logistica',
    description:'Brindamos el mejor servicio de logistica deprescicion',
    serviceList:[
      'Registros seguros',
      'Procesos optimos',
    ],
    thumbs: [
      { url: '/public/imgReferencia/services/thum-3.jpg' },
      { url: '/public/imgReferencia/services/thum-4.jpg' }  
    ]
  },
  {
    name:'logistica3',
    icon: <PiWallFill/>,
    title: 'Servicios de logistica',
    description:'Brindamos el mejor servicio de logistica deprescicion',
    serviceList:[
      'Registros seguros',
      'Procesos optimos',
    ],
    thumbs: [
      { url: '/public/imgReferencia/services/thum-5.jpg' },
      { url: '/public/imgReferencia/services/thum-6.jpg' }  
    ]
  },
]

const Services = () => {
  const [activeTab, setActiveTab] = useState('logistica')
  return (
    <section className='h-screen' id='services'>
      <div className="container mx-auto">
        <div>
          <h2 className='h2 mb-3'> Proporcionamos soluciones</h2>
          <p className='mb-11 max-w-[400px] mx-auto'>
            Offering tailored construction solucion, from plannig to competition, whit focus on quality and innovation
          </p>
        </div>

        {/* TBAS */}
      <Tabs defaultValue="logistica" onValueChange={(value) => setActiveTab(value)}>
        <TabsList className='grid w-full grid-cols-2 h-full'>
          {serviceData.map((item) =>{
            return (
            <TabsTrigger key={item.name} value={item.name} className='w-full rounded-none h-[100px] flex items-center relative shadow-custom p-0 outline-none'>
              <div className={`w-[100px] h-[100px] flex items-center justify-center absolute left-0 ${
                activeTab === item.name
                  ? "bg-primary text-white"
                  : "bg-accent text-primary"
              }`}></div>
              {item.name}
            </TabsTrigger>
            )
          })}
        </TabsList>
        <TabsContent value="account">

        </TabsContent>
        <TabsContent value="password">

        </TabsContent>
      </Tabs>
      </div>
    </section>
  )
}

export default Services