'use client'

import { useRef } from 'react'
import { useInView } from 'framer-motion'
import CountUp from 'react-countup'
import React from 'react'

const stastData = [
  {
    endCountNum: 100, 
    endCountText: '%',
    text:'Clientes Satisfechos'
  },
  {
    endCountNum: 800,
    endCountText: '+',
    text:'Operaciones Exitosas'
  },
  {
    endCountNum: 32,
    endCountText: 'k',
    text:'Clientes Felices'
  },
  {
    endCountNum: 5,
    endCountText: '+',
    text:'Años de Experiencia'
  }
]

const Stast = () => {

  const ref = useRef(null);
  const inView = useInView(ref)

  return (
    <div ref={ref} className='mt-16 xl:mt-32 bg-primary py-10 w-full'>
      <div className="container mx-auto h-full">
        <div className='text-white flex flex-col items-center justify-center xl:flex-row xl:justify-center xl:gap-x-20 h-full gap-12 text-center'>
          {stastData.map((item, index) => {
            return (
              <div className='w-full xl:w-auto' key={index}>
                <div className='text-5xl font-semibold'>
                  {inView && (
                    <CountUp 
                      start={0} 
                      end={item.endCountNum} 
                      delay={0.5} 
                      duration={3}
                    />
                  )}
                  <span>{item.endCountText}</span>
                </div>
                <p>{item.text}</p>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}

export default Stast
