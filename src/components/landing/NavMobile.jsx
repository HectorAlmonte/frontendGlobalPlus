"use client"

import { useState } from "react"
import {
  Sheet,
  SheetTrigger,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  SheetClose,
} from "@/components/ui/sheet"
import { RiMenu3Fill, RiCloseLine, RiArrowRightUpLine } from "react-icons/ri"
import { Link as ScrollLink } from "react-scroll"
import { useRouter } from "next/navigation"
import Logo from "./Logo"

const links = [
  { name: "Inicio", path: "home" },
  { name: "Nosotros", path: "about" },
  { name: "Servicios", path: "services" },
  { name: "Contacto", path: "contact" },
]

const NavMobile = () => {
  const [isOpen, setIsOpen] = useState(false)
  const router = useRouter()

  const goSystem = () => {
    setIsOpen(false)
    router.push("/work-in-progress")
  }

  return (
    <Sheet open={isOpen} onOpenChange={setIsOpen}>
      <SheetTrigger
        className="grid h-11 w-11 place-items-center rounded-xl border border-white/15 bg-white/10 backdrop-blur text-2xl text-white hover:bg-white/15 transition-colors"
        onClick={() => setIsOpen(true)}
        aria-label="Abrir menú"
      >
        <RiMenu3Fill />
      </SheetTrigger>

      <SheetContent
        side="right"
        className="w-[320px] sm:w-[360px] p-0 text-white border-l border-white/10 bg-slate-950 [&_[data-radix-collection-item]]:hidden [&_button.absolute.right-4.top-4]:hidden"
      >
        <div className="relative h-full">
          {/* Fondo premium */}
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_20%_10%,rgba(59,130,246,0.22),transparent_42%)]" />
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_80%_80%,rgba(255,255,255,0.06),transparent_45%)]" />

          <div className="relative flex h-full flex-col">
            <SheetHeader className="relative px-6 pt-7 pb-6 border-b border-white/10">
              <SheetTitle className="flex justify-center">
                <Logo />
              </SheetTitle>
              <SheetDescription className="sr-only">Menú</SheetDescription>

              <SheetClose asChild>
                <button
                  className="absolute right-4 top-5 grid h-10 w-10 place-items-center rounded-xl border border-white/10 bg-white/10 hover:bg-white/15 transition-colors"
                  aria-label="Cerrar menú"
                >
                  <RiCloseLine className="text-2xl" />
                </button>
              </SheetClose>
            </SheetHeader>

            <div className="flex-1 px-6 py-8">
              <div className="rounded-2xl border border-white/10 bg-white/5 backdrop-blur p-4">
                <p className="text-xs font-semibold tracking-[1.6px] uppercase text-white/70 text-center">
                  Navegación
                </p>

                <ul className="mt-4 flex flex-col gap-2">
                  {links.map((link) => (
                    <li key={link.path}>
                      <SheetClose asChild>
                        <ScrollLink
                          to={link.path}
                          smooth
                          spy
                          offset={-90}
                          duration={500}
                          className="cursor-pointer w-full inline-flex items-center justify-between rounded-xl px-4 py-3 text-[13px] uppercase font-primary font-semibold tracking-[1.4px] text-white/85 hover:text-white hover:bg-white/10 transition-colors"
                          onClick={() => setIsOpen(false)}
                        >
                          <span>{link.name}</span>
                          <span className="h-1.5 w-1.5 rounded-full bg-white/20" />
                        </ScrollLink>
                      </SheetClose>
                    </li>
                  ))}
                </ul>

                {/* CTA Sistema */}
                <div className="mt-5">
                  <button
                    type="button"
                    onClick={goSystem}
                    className="group w-full h-[46px] inline-flex items-center justify-between rounded-full bg-white text-primary border border-white/30 shadow-sm transition-all duration-200 hover:-translate-y-px hover:shadow-md"
                  >
                    <span className="flex-1 text-center tracking-[1.2px] font-primary font-extrabold text-[13px] uppercase">
                      Sistema
                    </span>
                    <span className="mr-2 grid h-9 w-9 place-items-center rounded-full bg-primary">
                      <RiArrowRightUpLine className="text-white text-lg transition-transform duration-200 group-hover:rotate-45" />
                    </span>
                  </button>

                  <p className="mt-3 text-[12px] text-white/55 text-center leading-relaxed">
                    Accede al panel de operaciones y control.
                  </p>
                </div>
              </div>
            </div>

            <div className="px-6 pb-8 pt-6 border-t border-white/10">
              <p className="text-xs text-white/55 text-center">Global Plus • Logística Integral</p>
            </div>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  )
}

export default NavMobile
