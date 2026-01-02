'use client'

import React from "react"
import Pretitle from "@/components/landing/basicComponents/Pretitle"
import ButtonHero from "./basicComponents/ButtonHero"
import Image from "next/image"
import { motion } from "framer-motion"

const About = () => {
  return (
    <section id="about" className="py-16 sm:py-20 xl:py-28 overflow-hidden">
      <div className="container mx-auto max-w-6xl px-5 sm:px-8">
        <div className="flex flex-col gap-14 xl:flex-row xl:items-center xl:justify-between">

          {/* TEXT */}
          <motion.div
            className="max-w-[540px] text-center xl:text-left"
            initial={{ opacity: 0, y: 18 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.35 }}
            transition={{ duration: 0.6, ease: "easeOut" }}
          >
            <Pretitle text="Sobre nosotros" center />

            <motion.h2
              className="h2 mt-4 mb-6"
              initial={{ opacity: 0, y: 12 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.35 }}
              transition={{ duration: 0.55, ease: "easeOut", delay: 0.12 }}
            >
              Enfocados en la Excelencia en Cada Proyecto
            </motion.h2>

            <motion.p
              className="mb-10 text-muted-foreground leading-relaxed"
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

            <motion.div
              initial={{ opacity: 0, y: 12 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.35 }}
              transition={{ duration: 0.55, ease: "easeOut", delay: 0.28 }}
              whileHover={{ y: -1 }}
            >
              <ButtonHero text="Contáctanos" />
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
                rounded-3xl overflow-hidden shadow-lg
                bg-primary
              "
              initial={{ scale: 0.98 }}
              whileInView={{ scale: 1 }}
              viewport={{ once: true, amount: 0.35 }}
              transition={{ duration: 0.7, ease: "easeOut" }}
            >
              {/* Fondo con profundidad (se ve más pro que un azul plano) */}
              <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(255,255,255,0.20),transparent_55%)]" />
              <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom,rgba(0,0,0,0.25),transparent_55%)]" />
              <div className="absolute inset-0 ring-1 ring-white/10" />

              {/* Glow sutil */}
              <div className="absolute -right-24 -top-24 h-64 w-64 rounded-full bg-white/10 blur-3xl" />
              <div className="absolute -left-24 -bottom-24 h-64 w-64 rounded-full bg-white/10 blur-3xl" />

              {/* Imagen: llena el card con padding, sin deformarse */}
              <div className="relative h-full w-full p-8 sm:p-10 xl:p-12">
                <div className="relative h-full w-full">
                  <Image
                    src="/images/about/img2.png"
                    alt="GlobalPlus Logística Integral"
                    fill
                    className="object-contain drop-shadow-[0_18px_45px_rgba(0,0,0,0.35)]"
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
