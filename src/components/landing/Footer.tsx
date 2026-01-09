'use client'

import React from 'react'
import { motion } from 'framer-motion'
import { Link as ScrollLink } from 'react-scroll'
import Image from 'next/image'
import { RiArrowUpLine, RiShieldCheckLine, RiCheckDoubleLine, RiFileList3Line } from 'react-icons/ri'

type ScrollLinkCommonProps = {
  smooth: boolean
  spy: boolean
  duration: number
  offset: number
}

const Footer = () => {
  const year = new Date().getFullYear()

  const scrollProps: ScrollLinkCommonProps = {
    smooth: true,
    spy: true,
    duration: 600,
    offset: -80,
  }

  const sections = [
    { name: 'Inicio', path: 'home' },
    { name: 'Nosotros', path: 'about' },
    { name: 'Servicios', path: 'services' },
    { name: 'Contacto', path: 'contact' },
  ]

  return (
    <footer className="relative text-white">
      {/* fondo premium */}
      <div className="absolute inset-0 bg-slate-950" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_10%,rgba(59,130,246,0.18),transparent_40%)]" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_80%_80%,rgba(255,255,255,0.06),transparent_45%)]" />
      <div className="absolute inset-x-0 top-0 h-px bg-white/10" />

      <div className="relative">
        <div className="container mx-auto px-5 sm:px-8 py-12 sm:py-14 max-w-6xl">
          <motion.div
            initial={{ opacity: 0, y: 14 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.2 }}
            transition={{ duration: 0.55, ease: 'easeOut' }}
            className="grid gap-10 xl:grid-cols-4"
          >
            {/* Brand */}
            <div>
              <div className="relative w-[220px] h-16">
                <Image
                  src="/logo/logo-texto.png"
                  alt="Global Plus"
                  fill
                  className="object-contain"
                  priority
                />
              </div>

              <p className="mt-3 text-white/70 leading-relaxed">
                Soluciones confiables para operaciones y servicios con enfoque en
                calidad, seguridad y cumplimiento.
              </p>

              {/* sellos (confianza) */}
              <div className="mt-6 grid gap-3">
                {[
                  { icon: RiCheckDoubleLine, text: 'Calidad y control' },
                  { icon: RiShieldCheckLine, text: 'Seguridad operativa' },
                  { icon: RiFileList3Line, text: 'Cumplimiento y reportes' },
                ].map((b) => (
                  <div key={b.text} className="flex items-center gap-3 text-white/75">
                    <span className="grid h-9 w-9 place-items-center rounded-xl bg-white/10 border border-white/10">
                      <b.icon className="text-lg text-white/90" />
                    </span>
                    <span className="text-sm font-semibold">{b.text}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Links */}
            <div className="grid gap-10 sm:grid-cols-3 xl:col-span-3">
              {/* Secciones */}
              <div>
                <p className="text-sm font-extrabold tracking-wide text-white/90 uppercase">
                  Secciones
                </p>

                <ul className="mt-4 space-y-3 text-white/70">
                  {sections.map((link) => (
                    <li key={link.path}>
                      <ScrollLink
                        to={link.path}
                        smooth={scrollProps.smooth}
                        spy={scrollProps.spy}
                        duration={scrollProps.duration}
                        offset={scrollProps.offset}
                        className="cursor-pointer inline-flex items-center gap-2 hover:text-white transition-colors"
                      >
                        <span className="h-1.5 w-1.5 rounded-full bg-white/20" />
                        {link.name}
                      </ScrollLink>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Servicios */}
              <div>
                <p className="text-sm font-extrabold tracking-wide text-white/90 uppercase">
                  Servicios
                </p>

                <ul className="mt-4 space-y-3 text-white/70">
                  <li className="hover:text-white transition-colors">Logística integral</li>
                  <li className="hover:text-white transition-colors">Trazabilidad y control</li>
                  <li className="hover:text-white transition-colors">Soporte y optimización</li>
                  <li className="hover:text-white transition-colors">Consultoría operativa</li>
                </ul>
              </div>

              {/* Contacto */}
              <div>
                <p className="text-sm font-extrabold tracking-wide text-white/90 uppercase">
                  Contacto
                </p>

                <ul className="mt-4 space-y-3 text-white/70">
                  <li>Perú</li>
                  <li className="font-semibold text-white/80">+51 915 149 329</li>
                  <li className="break-all">ventas@globalpluscorporation.com</li>
                </ul>

                {/* volver arriba */}
                <div className="mt-6">
                  <ScrollLink
                    to="home"
                    smooth={scrollProps.smooth}
                    spy={scrollProps.spy}
                    duration={scrollProps.duration}
                    offset={scrollProps.offset}
                    className="
                      group cursor-pointer
                      inline-flex items-center gap-2
                      rounded-full
                      bg-white/10 border border-white/15
                      px-4 py-2
                      text-sm font-semibold text-white/90
                      hover:bg-white/15 transition-all
                    "
                  >
                    Volver arriba
                    <RiArrowUpLine className="text-lg transition-transform duration-200 group-hover:-translate-y-[2px]" />
                  </ScrollLink>
                </div>
              </div>
            </div>
          </motion.div>

          {/* Bottom */}
          <div className="mt-12 pt-6 border-t border-white/10 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-white/60 text-sm">
              © {year} Global Plus. Todos los derechos reservados.
            </p>

            <p className="text-white/50 text-sm">
              Operación • Control • Continuidad
            </p>
          </div>
        </div>
      </div>
    </footer>
  )
}

export default Footer
