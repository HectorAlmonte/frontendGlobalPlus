'use client'

import React, { useRef } from 'react'
import { useInView, motion } from 'framer-motion'
import CountUp from 'react-countup'
import { RiShieldCheckLine, RiTruckLine, RiUserSmileLine, RiTimerLine } from 'react-icons/ri'

const stastData = [
  { endCountNum: 100, endCountText: '%', text: 'Clientes Satisfechos', icon: RiUserSmileLine },
  { endCountNum: 800, endCountText: '+', text: 'Operaciones Exitosas', icon: RiTruckLine },
  { endCountNum: 32, endCountText: 'k', text: 'Clientes Felices', icon: RiShieldCheckLine },
  { endCountNum: 5, endCountText: '+', text: 'Años de Experiencia', icon: RiTimerLine },
]

const Stast = () => {
  const ref = useRef(null)
  const inView = useInView(ref, { once: true, amount: 0.35 })

  return (
    <section
      ref={ref}
      className="
        relative w-full overflow-hidden
        mt-16 xl:mt-28
        py-14 sm:py-16
        bg-primary
      "
    >
      {/* Fondo con profundidad (sutil) */}
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_30%,rgba(255,255,255,0.14),transparent_55%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_80%_70%,rgba(0,0,0,0.25),transparent_60%)]" />
        <div className="absolute inset-0 ring-1 ring-white/10" />
      </div>

      <div className="relative container mx-auto max-w-6xl px-5 sm:px-8">
        {/* Grid responsive (más limpio que flex en stats) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 sm:gap-6">
          {stastData.map((item, index) => {
            const Icon = item.icon
            return (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 14 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.35 }}
                transition={{ duration: 0.5, ease: 'easeOut', delay: index * 0.06 }}
                className="
                  rounded-2xl border border-white/12
                  bg-white/7 backdrop-blur
                  px-6 py-6
                  shadow-[0_10px_40px_rgba(0,0,0,0.18)]
                "
              >
                <div className="flex items-start gap-4">
                  <div className="grid h-11 w-11 place-items-center rounded-xl bg-white/10 border border-white/15">
                    <Icon className="text-2xl text-white/90" />
                  </div>

                  <div className="flex-1">
                    <div className="flex items-baseline gap-1 text-white">
                      <span className="text-[42px] leading-none font-extrabold tracking-tight">
                        {inView ? (
                          <CountUp
                            start={0}
                            end={item.endCountNum}
                            delay={0.15}
                            duration={2.6}
                          />
                        ) : (
                          0
                        )}
                      </span>
                      <span className="text-xl font-bold text-white/90">
                        {item.endCountText}
                      </span>
                    </div>

                    <p className="mt-2 text-[14px] sm:text-[15px] text-white/85">
                      {item.text}
                    </p>
                  </div>
                </div>
              </motion.div>
            )
          })}
        </div>
      </div>
    </section>
  )
}

export default Stast
