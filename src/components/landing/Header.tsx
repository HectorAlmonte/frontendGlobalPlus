'use client'

import { Link as ScrollLink } from 'react-scroll'
import { RiArrowRightUpLine } from 'react-icons/ri'
import { useRouter } from 'next/navigation'
import Logo from '@/components/landing/Logo'
import NavMobile from '@/components/landing/NavMobile'

const links = [
  { name: 'Inicio', path: 'home' },
  { name: 'Nosotros', path: 'about' },
  { name: 'Servicios', path: 'services' },
  { name: 'Contacto', path: 'contact' },
]

const Header = () => {
  const router = useRouter()

  const handleClick = () => {
    router.push('/work-in-progress')
  }

  return (
    <header
      className="
        sticky top-0 z-50
        bg-primary/80 backdrop-blur-md
        supports-[backdrop-filter]:bg-primary/70
      "
    >
      {/* borde sutil + “hairline” */}
      <div className="border-b border-white/10">
        <div className="mx-auto max-w-[1320px] px-6 lg:px-10">
          <div className="flex h-[76px] items-center justify-between">
            {/* LOGO */}
            <div className="flex items-center gap-3">
              <Logo />
            </div>

            {/* DESKTOP */}
            <div className="hidden xl:flex items-center gap-10">
              {/* MENU */}
              <nav aria-label="Navegación principal">
                <ul className="flex items-center gap-7">
                  {links.map((link) => (
                    <li key={link.path} className="relative">
                      <ScrollLink
                        to={link.path}
                        smooth
                        spy
                        offset={-90}
                        className="
                          group cursor-pointer
                          text-[13px] uppercase font-primary font-semibold
                          tracking-[1.4px]
                          text-white/85 hover:text-white
                          transition-colors
                        "
                        activeClass="is-active"
                      >
                        <span className="relative inline-flex pb-1">
                          {link.name}

                          {/* underline animado */}
                          <span
                            className="
                              pointer-events-none
                              absolute left-0 -bottom-0.5 h-[2px] w-full
                              scale-x-0 group-hover:scale-x-100
                              origin-left transition-transform duration-200
                              bg-white/70
                            "
                          />
                        </span>
                      </ScrollLink>

                      {/* Estilo para link activo (react-scroll pone la clase en el <a>) */}
                      <style jsx global>{`
                        .is-active {
                          color: hsl(var(--accent)) !important;
                        }
                        .is-active span > span {
                          transform: scaleX(1) !important;
                          background: hsl(var(--accent)) !important;
                        }
                      `}</style>
                    </li>
                  ))}
                </ul>
              </nav>

              {/* CTA */}
              <button
                type="button"
                onClick={handleClick}
                className="
                  group relative
                  h-[46px] min-w-[190px]
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
                {/* brillo sutil */}
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
                    Sistema
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
            </div>

            {/* MOBILE */}
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
