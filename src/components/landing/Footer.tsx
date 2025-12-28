'use client'

import React from 'react'
import { motion } from 'framer-motion'
import { Link as ScrollLink } from 'react-scroll'
import {
  PiInstagramLogoFill,
  PiFacebookLogoFill,
  PiLinkedinLogoFill,
} from 'react-icons/pi'
import Image from 'next/image'


const Footer = () => {
  const year = new Date().getFullYear()

  const scrollProps = {
    smooth: true,
    spy: true,
    duration: 600,
    offset: -80, // ajusta si tu header es sticky
  }

  return (
    <footer className="bg-slate-950 text-white">
      <div className="container mx-auto px-5 sm:px-8 py-12 sm:py-14">
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

            <div className="mt-5 flex items-center gap-3">
              <a className="w-10 h-10 rounded-xl bg-white/10 hover:bg-white/20 transition flex items-center justify-center">
                <PiInstagramLogoFill className="text-xl" />
              </a>
              <a className="w-10 h-10 rounded-xl bg-white/10 hover:bg-white/20 transition flex items-center justify-center">
                <PiFacebookLogoFill className="text-xl" />
              </a>
              <a className="w-10 h-10 rounded-xl bg-white/10 hover:bg-white/20 transition flex items-center justify-center">
                <PiLinkedinLogoFill className="text-xl" />
              </a>
            </div>
          </div>

          {/* Links */}
          <div className="grid gap-10 sm:grid-cols-3 xl:col-span-3">
            {/* Secciones */}
            <div>
              <p className="text-sm font-semibold text-white/90">Secciones</p>
              <ul className="mt-4 space-y-3 text-white/70">
                {[
                  { name: 'Home', path: 'home' },
                  { name: 'Services', path: 'services' },
                  { name: 'Work', path: 'work' },
                  { name: 'FAQ', path: 'faq' },
                  { name: 'Contact', path: 'contact' },
                ].map((link, i) => (
                  <li key={i}>
                    <ScrollLink
                      to={link.path}
                      {...scrollProps}
                      className="cursor-pointer hover:text-white transition-colors"
                    >
                      {link.name}
                    </ScrollLink>
                  </li>
                ))}
              </ul>
            </div>

            {/* Servicios */}
            <div>
              <p className="text-sm font-semibold text-white/90">Servicios</p>
              <ul className="mt-4 space-y-3 text-white/70">
                <li>Logística</li>
                <li>Operaciones</li>
                <li>Soporte</li>
                <li>Consultoría</li>
              </ul>
            </div>

            {/* Contacto */}
            <div>
              <p className="text-sm font-semibold text-white/90">Contacto</p>
              <ul className="mt-4 space-y-3 text-white/70">
                <li>Lima, Perú</li>
                <li>+51 999 999 999</li>
                <li>contacto@tuempresa.com</li>
              </ul>
            </div>
          </div>
        </motion.div>

        {/* Bottom */}
        <div className="mt-12 pt-6 border-t border-white/10 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-white/60 text-sm">
            © {year} Global Plus. Todos los derechos reservados.
          </p>
        </div>
      </div>
    </footer>
  )
}

export default Footer
