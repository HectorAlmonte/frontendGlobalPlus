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

import { RiMenu3Fill } from 'react-icons/ri'
import { Link as ScrollLink } from 'react-scroll'
import Logo from './Logo'

const links = [
  { name: 'home', path: 'home' },
  { name: 'services', path: 'services' },
  { name: 'mision', path: 'mision' },
  { name: 'about', path: 'about' },
  { name: 'contact', path: 'contact' },
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
        className="bg-primary border-none text-white w-[320px] sm:w-[360px]"
      >
        {/* Layout: arriba logo, centro links */}
        <div className="flex flex-col h-full">
          <SheetHeader className="pt-8">
            <SheetTitle className="flex justify-center">
              <Logo />
            </SheetTitle>
            <SheetDescription className="sr-only">Menú</SheetDescription>
          </SheetHeader>

          {/* Links centrados */}
          <div className="flex-1 flex items-center justify-center">
            <ul className="w-full flex flex-col gap-8 text-center uppercase tracking-[1.2px]">
              {links.map((link) => (
                <li key={link.path}>
                  <SheetClose asChild>
                    <ScrollLink
                      to={link.path}
                      smooth
                      spy
                      offset={-90}
                      duration={500}
                      className="cursor-pointer text-base font-semibold transition-colors hover:text-accent"
                      activeClass="text-accent"
                    >
                      {link.name}
                    </ScrollLink>
                  </SheetClose>
                </li>
              ))}
            </ul>
          </div>

          {/* Espacio inferior (opcional) */}
          <div className="pb-10" />
        </div>
      </SheetContent>
    </Sheet>
  )
}

export default NavMobile
