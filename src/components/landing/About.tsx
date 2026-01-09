'use client'

import React from "react"
import Pretitle from "@/components/landing/basicComponents/Pretitle"
import Image from "next/image"
import { motion } from "framer-motion"
import { RiArrowRightUpLine } from "react-icons/ri"
import { useRouter } from "next/navigation"

const About = () => {
  const router = useRouter()

  const handleContact = () => {
    // Si tu botón abre contacto directo a sección:
    const el = document.getElementById("contact")
    if (el) el.scrollIntoView({ behavior: "smooth" })
    // o si prefieres ruta:
    // router.push('/contact')
  }

  return (
    <section
      id="about"
      className="
        relative overflow-hidden
        py-16 sm:py-20 xl:py-28
      "
    >
      {/* Fondo sutil para separar del hero (muy leve) */}
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute inset-0 about-bg-1" />
        <div className="absolute inset-0 about-bg-2" />
      </div>

      <div className="relative container mx-auto max-w-6xl px-5 sm:px-8">
        <div className="flex flex-col gap-14 xl:flex-row xl:items-center xl:justify-between">
          {/* TEXT */}
          <motion.div
            className="max-w-[560px] text-center xl:text-left"
            initial={{ opacity: 0, y: 18 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.35 }}
            transition={{ duration: 0.6, ease: "easeOut" }}
          >
            <Pretitle text="Sobre nosotros" center />

            <motion.h2
              className="mt-4 mb-5 text-[clamp(1.9rem,3.2vw,2.6rem)] font-extrabold leading-tight tracking-tight"
              initial={{ opacity: 0, y: 12 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.35 }}
              transition={{ duration: 0.55, ease: "easeOut", delay: 0.12 }}
            >
              Enfocados en la Excelencia en Cada Proyecto
            </motion.h2>

            <motion.p
              className="mb-9 text-muted-foreground leading-relaxed text-[15px] sm:text-[17px]"
              initial={{ opacity: 0, y: 12 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.35 }}
              transition={{ duration: 0.55, ease: "easeOut", delay: 0.2 }}
            >
              Nuestro compromiso inquebrantable con la excelencia impulsa cada
              proyecto que emprendemos. Desde el concepto hasta la finalización,
              elaboramos meticulosamente soluciones que representan calidad,
              precisión e innovación.
            </motion.p>

            {/* CTA consistente con header/hero */}
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.35 }}
              transition={{ duration: 0.55, ease: "easeOut", delay: 0.28 }}
              whileHover={{ y: -1 }}
              className="flex justify-center xl:justify-start"
            >
              <button
                type="button"
                onClick={handleContact}
                className="
                  group relative
                  h-[46px] min-w-[210px]
                  inline-flex items-center justify-center
                  rounded-full
                  bg-primary text-white
                  border border-primary/30
                  shadow-sm
                  transition-all duration-200
                  hover:-translate-y-px hover:shadow-md
                  active:translate-y-0
                  overflow-hidden
                "
              >
                {/* brillo sutil */}
                <span
                  className="
                    pointer-events-none absolute inset-0
                    opacity-0 group-hover:opacity-100
                    transition-opacity duration-300
                    bg-gradient-to-r from-transparent via-white/10 to-transparent
                  "
                />

                <span className="relative flex items-center gap-3 px-5">
                  <span className="tracking-[1.2px] font-primary font-extrabold text-[13px] uppercase">
                    Contáctanos
                  </span>

                  <span
                    className="
                      grid h-9 w-9 place-items-center
                      rounded-full bg-white/10
                      border border-white/20
                      transition-transform duration-200
                      group-hover:rotate-6
                    "
                  >
                    <RiArrowRightUpLine className="text-white text-lg group-hover:rotate-45 transition-transform duration-200" />
                  </span>
                </span>
              </button>
            </motion.div>
          </motion.div>

          {/* IMAGE */}
          <motion.div
            className="w-full xl:w-[520px] flex justify-center xl:justify-end"
            initial={{ opacity: 0, x: 24 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, amount: 0.35 }}
            transition={{ duration: 0.7, ease: "easeOut" }}
          >
            <motion.div
              className="
                relative w-full
                h-[320px] sm:h-[380px] xl:h-[420px]
                rounded-3xl overflow-hidden
                shadow-2xl
                bg-primary
              "
              initial={{ scale: 0.98 }}
              whileInView={{ scale: 1 }}
              whileHover={{ scale: 1.01 }}
              viewport={{ once: true, amount: 0.35 }}
              transition={{ duration: 0.7, ease: "easeOut" }}
            >
              {/* Profundidad */}
              <div className="absolute inset-0 about-depth-top" />
              <div className="absolute inset-0 about-depth-bottom" /> 
              <div className="absolute inset-0 ring-1 ring-white/12" />

              {/* Glow */}
              <div className="absolute -right-24 -top-24 h-64 w-64 rounded-full bg-white/10 blur-3xl" />
              <div className="absolute -left-24 -bottom-24 h-64 w-64 rounded-full bg-white/10 blur-3xl" />

              {/* Imagen */}
              <div className="relative h-full w-full p-8 sm:p-10 xl:p-12">
                <div className="relative h-full w-full">
                  <Image
                    src="/images/about/img2.png"
                    alt="GlobalPlus Logística Integral"
                    fill
                    className="object-contain drop-shadow-2xl"
                    priority
                  />
                </div>
              </div>
            </motion.div>
          </motion.div>
        </div>
      </div>
    </section>
  )
}

export default About
