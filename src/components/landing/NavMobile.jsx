'use client'

import { useState } from 'react'
import {
  Sheet,
  SheetTrigger,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  SheetClose,
} from '@/components/ui/sheet'

import { RiMenu3Fill, RiCloseLine } from 'react-icons/ri'
import { Link as ScrollLink } from 'react-scroll'
import Logo from './Logo'

const links = [
  { name: 'Inicio', path: 'home' },
  { name: 'Servicios', path: 'services' },
  { name: 'Misión', path: 'mision' },
  { name: 'Nosotros', path: 'about' },
  { name: 'Contacto', path: 'contact' },
]

const NavMobile = () => {
  const [isOpen, setIsOpen] = useState(false)

  return (
    <Sheet open={isOpen} onOpenChange={setIsOpen}>
      <SheetTrigger
        className="flex items-center justify-center text-3xl"
        onClick={() => setIsOpen(true)}
        aria-label="Abrir menú"
      >
        <RiMenu3Fill className="text-white" />
      </SheetTrigger>

      <SheetContent
        side="right"
        className="
          bg-primary text-white w-[320px] sm:w-[360px] border-l border-white/10 p-0
          [&_[data-radix-collection-item]]:hidden
          [&_button.absolute.right-4.top-4]:hidden"
      >
        <div className="flex h-full flex-col">
          <SheetHeader className="px-7 pt-8 pb-6 border-b border-white/10 relative">
            <SheetTitle className="flex justify-center">
              <Logo />
            </SheetTitle>
            <SheetDescription className="sr-only">Menú</SheetDescription>

            {/* Botón X visible */}
            <SheetClose asChild>
              <button
                className="absolute right-5 top-7 grid h-10 w-10 place-items-center rounded-md
                           hover:bg-white/10 transition-colors"
                aria-label="Cerrar menú"
              >
                <RiCloseLine className="text-2xl" />
              </button>
            </SheetClose>
          </SheetHeader>

          <div className="flex-1 flex items-center justify-center px-7">
            <ul className="w-full flex flex-col gap-6 text-center">
              {links.map((link) => (
                <li key={link.path}>
                  <SheetClose asChild>
                    <ScrollLink
                      to={link.path}
                      smooth
                      spy
                      offset={-90}
                      duration={500}
                      className="cursor-pointer block py-3 rounded-lg
                                 uppercase tracking-[1.4px] font-semibold text-[13px]
                                 text-white/90 hover:text-white hover:bg-white/10
                                 transition-colors"
                      activeClass="text-accent"
                    >
                      {link.name}
                    </ScrollLink>
                  </SheetClose>
                </li>
              ))}
            </ul>
          </div>

          <div className="px-7 pb-10 pt-6 border-t border-white/10">
            <p className="text-xs text-white/60 text-center">
              Global Plus • Logística Integral
            </p>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  )
}

export default NavMobile
