"use client"

import { useEffect, useState, useCallback } from "react"
import { Link as ScrollLink } from "react-scroll"
import { RiArrowRightUpLine } from "react-icons/ri"
import { useRouter } from "next/navigation"
import Logo from "@/components/landing/Logo"
import NavMobile from "@/components/landing/NavMobile"
import LandingButton from "./ui/LandingButton"
import { throttle } from "./utils/throttle"

interface NavLink {
  name: string;
  path: string;
}

const links: NavLink[] = [
  { name: "Inicio", path: "home" },
  { name: "Nosotros", path: "about" },
  { name: "Servicios", path: "services" },
  { name: "Contacto", path: "contact" },
]

const Header: React.FC = () => {
  const router = useRouter()
  const [scrolled, setScrolled] = useState(false)

  const handleScroll = useCallback(() => {
    setScrolled(window.scrollY > 20)
  }, [])

  useEffect(() => {
    const throttledScroll = throttle(handleScroll, 100)
    throttledScroll()
    window.addEventListener("scroll", throttledScroll, { passive: true })
    return () => window.removeEventListener("scroll", throttledScroll)
  }, [handleScroll])

  const handleClick = () => router.push("/login")

  return (
    <header
      className={[
        "landing-header sticky top-0 z-50 transition-colors duration-300",
        scrolled
          ? "bg-primary/90 backdrop-blur-md supports-backdrop-filter:bg-primary/85"
          : "bg-primary/95 backdrop-blur supports-backdrop-filter:bg-primary/90",
      ].join(" ")}
    >
      <div className="border-b border-white/10">
        <div className="mx-auto max-w-[1320px] px-6 lg:px-10">
          <div className="flex h-[76px] items-center justify-between">
            <div className="flex items-center gap-3">
              <Logo />
            </div>

            <div className="hidden xl:flex items-center gap-10">
              <nav aria-label="Navegación principal">
                <ul className="flex items-center gap-7">
                  {links.map((link) => (
                    <li key={link.path} className="relative">
                      <ScrollLink
                        to={link.path}
                        smooth
                        spy
                        offset={-90}
                        activeClass="is-active"
                        className="group cursor-pointer text-[13px] uppercase font-primary font-semibold tracking-[1.4px] text-white/85 hover:text-white transition-colors"
                      >
                        <span className="relative inline-flex pb-1">
                          {link.name}
                          <span className="pointer-events-none absolute left-0 -bottom-0.5 h-0.5 w-full origin-left scale-x-0 bg-white/70 transition-transform duration-200 group-hover:scale-x-100" />
                        </span>
                      </ScrollLink>
                    </li>
                  ))}
                </ul>
              </nav>

              <LandingButton
                variant="secondary"
                size="md"
                onClick={handleClick}
                className="min-w-[190px]"
                icon={
                  <span className="grid h-9 w-9 place-items-center rounded-full bg-primary transition-transform duration-200 group-hover:rotate-6">
                    <RiArrowRightUpLine className="text-white text-lg group-hover:rotate-45 transition-transform duration-200" />
                  </span>
                }
              >
                Sistema
              </LandingButton>
            </div>

            <div className="xl:hidden">
              <NavMobile />
            </div>
          </div>
        </div>
      </div>
    </header>
  )
}

export default Header
