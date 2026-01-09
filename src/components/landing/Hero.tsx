'use client'

import Image from "next/image"
import { motion } from "framer-motion"
import { Link as ScrollLink } from "react-scroll"
import {
  RiArrowRightUpLine,
  RiShieldCheckLine,
  RiTimeLine,
  RiMapPinLine,
} from "react-icons/ri"

const Hero = () => {
  return (
    <section
      id="home"
      className="
        relative overflow-hidden
        pt-24 pb-10
        sm:pt-0 sm:pb-0
        sm:h-[78vh] sm:min-h-[560px]
      "
    >
      {/* Background */}
      <motion.div
        className="absolute inset-0"
        initial={{ scale: 1.08 }}
        animate={{ scale: 1 }}
        transition={{ duration: 1.25, ease: "easeOut" }}
      >
        <Image
          src="/images/landing/fondo_hero.png"
          alt="Fondo"
          fill
          priority
          className="object-cover object-center"
        />
      </motion.div>

      {/* Overlays */}
      <div className="absolute inset-0 bg-black/35" />
      <div className="absolute inset-0 bg-gradient-to-r from-black/85 via-black/45 to-transparent" />
      <div className="pointer-events-none absolute inset-0 hero-radial-1" />


      {/* Content */}
      <div className="relative z-10">
        <div
          className="
            mx-auto w-full max-w-7xl
            px-5 sm:px-6 lg:px-10
            sm:flex sm:h-full sm:items-center
          "
        >
          <motion.div
            className="max-w-[760px] text-center sm:text-left"
            initial="hidden"
            animate="show"
            variants={{
              hidden: {},
              show: { transition: { staggerChildren: 0.12, delayChildren: 0.15 } },
            }}
          >
            {/* Badge
            <motion.div
              className="
                inline-flex items-center gap-2 rounded-full
                border border-white/15 bg-white/10
                px-4 py-2 text-[11px] sm:text-[12px]
                font-semibold tracking-[1.4px] uppercase text-white/90 backdrop-blur
              "
              variants={{
                hidden: { opacity: 0, y: 14 },
                show: { opacity: 1, y: 0, transition: { duration: 0.5, ease: "easeOut" } },
              }}
            >
              <span className="h-1.5 w-1.5 rounded-full bg-white/80" />
              Soluciones en logística integral
            </motion.div> */}

            {/* BRAND */}
            <motion.h1
              className="mt-5 sm:mt-6 font-extrabold leading-[1.03] tracking-tight text-white drop-shadow-sm"
              variants={{
                hidden: { opacity: 0, y: 18 },
                show: { opacity: 1, y: 0, transition: { duration: 0.55, ease: "easeOut" } },
              }}
            >
              {/* ↓ más controlado en mobile */}
              <span className="block text-[clamp(2.35rem,9.5vw,3.3rem)] sm:text-[clamp(2.8rem,6.2vw,5.2rem)]">
                <span className="text-blue-400">Global</span>{" "}
                <span className="text-white">Plus</span>
              </span>

              <span className="mt-2 block text-[clamp(1.35rem,5.8vw,2rem)] sm:text-[clamp(1.6rem,3.4vw,2.8rem)] text-white/95">
                Logística Integral
              </span>

              <span className="mt-2 sm:mt-3 block text-[12px] sm:text-[clamp(0.95rem,1.2vw,1.1rem)] font-semibold tracking-[1.6px] uppercase text-white/75">
                Precisión • Control • Continuidad Operativa
              </span>
            </motion.h1>

            {/* Copy */}
            <motion.p
              className="
                mt-4 sm:mt-5
                text-white/90 text-[14px] sm:text-lg leading-relaxed
                max-w-[560px] mx-auto sm:mx-0
              "
              variants={{
                hidden: { opacity: 0, y: 18 },
                show: { opacity: 1, y: 0, transition: { duration: 0.55, ease: "easeOut" } },
              }}
            >
              Acompañamos a tu empresa con soluciones confiables, eficientes y personalizadas,
              impulsando el crecimiento y la continuidad de tus operaciones.
            </motion.p>

            {/* CTAs */}
            <motion.div
              className="mt-7 sm:mt-8 flex flex-col sm:flex-row items-center justify-center sm:justify-start gap-3"
              variants={{
                hidden: { opacity: 0, y: 18 },
                show: { opacity: 1, y: 0, transition: { duration: 0.55, ease: "easeOut" } },
              }}
            >
              {/* CONÓCENOS */}
              <button
                type="button"
                onClick={() => {
                  const el = document.getElementById("about")
                  if (el) el.scrollIntoView({ behavior: "smooth" })
                }}
                className="
                  group relative
                  h-[46px] w-full sm:w-auto min-w-[210px]
                  inline-flex items-center justify-center
                  rounded-full
                  bg-white text-primary
                  border border-white/30
                  shadow-sm
                  transition-all duration-200
                  hover:-translate-y-px hover:shadow-md
                  active:translate-y-0
                  overflow-hidden
                "
              >
                <span
                  className="
                    pointer-events-none absolute inset-0
                    opacity-0 group-hover:opacity-100
                    transition-opacity duration-300
                    bg-gradient-to-r from-transparent via-black/5 to-transparent
                  "
                />
                <span className="relative flex items-center gap-3 px-5">
                  <span className="tracking-[1.2px] font-primary font-extrabold text-[13px] uppercase">
                    Conócenos
                  </span>
                  <span
                    className="
                      grid h-9 w-9 place-items-center
                      rounded-full bg-primary
                      transition-transform duration-200
                      group-hover:rotate-6
                    "
                  >
                    <RiArrowRightUpLine className="text-white text-lg group-hover:rotate-45 transition-transform duration-200" />
                  </span>
                </span>
              </button>

              {/* Ver servicios */}
              <ScrollLink
                to="services"
                smooth
                spy
                offset={-90}
                className="
                  group w-full sm:w-auto cursor-pointer
                  inline-flex items-center justify-center gap-2
                  h-[46px] px-6 rounded-full
                  border border-white/20 bg-white/5 text-white/90
                  backdrop-blur
                  transition-all duration-200
                  hover:bg-white/10 hover:border-white/30 hover:text-white
                "
              >
                Ver servicios
                <RiArrowRightUpLine className="text-lg transition-transform duration-200 group-hover:rotate-45" />
              </ScrollLink>
            </motion.div>

            {/* Trust row:
               - mobile: carrusel horizontal (más compacto)
               - sm+: grid normal */}
            <motion.div
              className="
                mt-7 sm:mt-10
                -mx-5 px-5
                flex gap-3 overflow-x-auto pb-1
                sm:mx-0 sm:px-0 sm:overflow-visible sm:grid sm:grid-cols-3
                hide-scrollbar
              "
              variants={{
                hidden: { opacity: 0, y: 18 },
                show: { opacity: 1, y: 0, transition: { duration: 0.55, ease: "easeOut" } },
              }}
            >
              {[
                { icon: RiTimeLine, title: "Respuesta rápida", desc: "Coordinación ágil y soporte" },
                { icon: RiShieldCheckLine, title: "Seguridad operativa", desc: "Procesos y control" },
                { icon: RiMapPinLine, title: "Cobertura logística", desc: "Planificación y ejecución" },
              ].map((item) => (
                <div
                  key={item.title}
                  className="
                    shrink-0 w-10/12 sm:w-auto
                    rounded-2xl border border-white/12 bg-white/7
                    px-4 py-4 backdrop-blur
                  "
                >
                  <div className="flex items-start gap-3">
                    <div className="grid h-10 w-10 place-items-center rounded-xl bg-white/10 border border-white/15">
                      <item.icon className="text-xl text-white/90" />
                    </div>
                    <div>
                      <div className="text-sm font-bold text-white">{item.title}</div>
                      <div className="mt-1 text-[13px] leading-snug text-white/80">{item.desc}</div>
                    </div>
                  </div>
                </div>
              ))}
            </motion.div>
          </motion.div>
        </div>
      </div>

      {/* bottom vignette */}
      <div className="pointer-events-none absolute inset-x-0 bottom-0 h-28 bg-linear-to-t from-black/45 to-transparent" />
    </section>
  )
}

export default Hero
