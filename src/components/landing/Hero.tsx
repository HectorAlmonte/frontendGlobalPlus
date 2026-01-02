'use client'

import Image from "next/image"
import ButtonHero from "@/components/landing/basicComponents/ButtonHero"
import { motion } from "framer-motion"

const Hero = () => {
  return (
    <section id="home" className="relative h-[70vh] min-h-[520px] overflow-hidden">
      {/* Background image with subtle zoom */}
      <motion.div
        className="absolute inset-0"
        initial={{ scale: 1.05 }}
        animate={{ scale: 1 }}
        transition={{ duration: 1.2, ease: "easeOut" }}
      >
        <Image
          src="/images/landing/fondo_hero.png"
          alt="Fondo"
          fill
          priority
          className="object-cover object-center blur-[3px]"
        />
      </motion.div>

      {/* Overlays */}
      <div className="absolute inset-0 bg-black/25" />
      <div className="absolute inset-0 bg-linear-to-r from-black/85 via-black/45 to-transparent" />

      {/* Content */}
      <div className="relative z-10 h-full flex items-center">
        <div className="mx-auto w-full max-w-[1320px] px-6 lg:px-10">
          <motion.div
            className="max-w-[640px] text-center sm:text-left"
            initial="hidden"
            animate="show"
            variants={{
              hidden: {},
              show: { transition: { staggerChildren: 0.12, delayChildren: 0.15 } },
            }}
          >
            <motion.h1
              className="font-extrabold leading-[1.05] tracking-tight drop-shadow-sm"
              variants={{
                hidden: { opacity: 0, y: 18 },
                show: { opacity: 1, y: 0, transition: { duration: 0.55, ease: "easeOut" } },
              }}
            >
              <span className="block text-[clamp(2.4rem,5.2vw,4.6rem)]">
                <span className="text-blue-500">Global</span>{" "}
                <span className="text-white">Plus</span>
              </span>

              <span className="mt-2 block text-[clamp(2rem,4.3vw,3.6rem)] text-white">
                Logística Integral
              </span>
            </motion.h1>

            <motion.p
              className="mt-5 text-white/90 text-[15px] sm:text-lg leading-relaxed max-w-[520px] mx-auto sm:mx-0"
              variants={{
                hidden: { opacity: 0, y: 18 },
                show: { opacity: 1, y: 0, transition: { duration: 0.55, ease: "easeOut" } },
              }}
            >
                Acompañamos a su empresa con soluciones logísticas confiables, eficientes y
                personalizadas, impulsando el crecimiento y la continuidad de sus operaciones.
            </motion.p>
            <motion.div
              className="mt-8 flex justify-center sm:justify-start"
              variants={{
                hidden: { opacity: 0, y: 18 },
                show: { opacity: 1, y: 0, transition: { duration: 0.55, ease: "easeOut" } },
              }}
              whileHover={{ y: -1 }}
              transition={{ duration: 0.2 }}
            >
              <ButtonHero text="Conócenos" />
            </motion.div>
          </motion.div>
        </div>
      </div>

      {/* bottom vignette */}
      <div className="pointer-events-none absolute inset-x-0 bottom-0 h-24 bg-linear-to-t from-black/35 to-transparent" />
    </section>
  )
}

export default Hero
