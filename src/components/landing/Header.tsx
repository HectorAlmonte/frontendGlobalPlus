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
    router.push('/login')
  }

  return (
    <header className="bg-primary backdrop-blur sticky top-0 z-50">
      {/* borde sutil para separar del hero */}
      <div className="border-b border-white/10">
        <div className="mx-auto max-w-[1320px] px-6 lg:px-10">
          {/* más compacto */}
          <div className="flex h-[72px] items-center justify-between">
            {/* LOGO */}
            <Logo />

            {/* DERECHA: MENU + BOTON */}
            <div className="hidden xl:flex items-center gap-10">
              {/* MENU */}
              <nav aria-label="Navegación principal">
                <ul className="flex items-center gap-5 text-white/90">
                  {links.map((link) => (
                    <li
                      key={link.path}
                      className="text-[13px] uppercase font-primary font-semibold tracking-[1.2px]
                                 after:content-['/'] after:ml-5 after:mr-0 last:after:content-none after:text-white/25"
                    >
                      <ScrollLink
                        to={link.path}
                        smooth
                        spy
                        offset={-90}
                        className="cursor-pointer transition-colors hover:text-white"
                        activeClass="text-accent"
                      >
                        {link.name}
                      </ScrollLink>
                    </li>
                  ))}
                </ul>
              </nav>

              {/* BOTON SISTEMA: más “premium” y menos pesado */}
              <button
                type="button"
                onClick={handleClick}
                className="group h-[46px] min-w-[190px] pl-4 pr-2.5
                           flex items-center justify-between
                           bg-white text-primary
                           border border-white/30
                           shadow-sm
                           transition-all duration-200
                           hover:-translate-y-[1px] hover:shadow-md"
              >
                <span className="flex-1 text-center tracking-[1.2px] font-primary font-extrabold text-[13px] uppercase">
                  Sistema
                </span>

                <span className="ml-3 grid h-9 w-9 place-items-center bg-primary">
                  <RiArrowRightUpLine className="text-white text-lg group-hover:rotate-45 transition-transform duration-200" />
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
