'use client'

import { Link as ScrollLink } from 'react-scroll'
import { RiArrowRightUpLine } from 'react-icons/ri'
import { useRouter } from 'next/navigation'
import Logo from '@/components/landing/Logo'
import NavMobile from '@/components/landing/NavMobile'

const links = [
  { name: 'home', path: 'home' },
  { name: 'services', path: 'services' },
  { name: 'mision', path: 'mision' },
  { name: 'about', path: 'about' },
  { name: 'contact', path: 'contact' },
]

const Header = () => {
  const router = useRouter()

  const handleClick = () => {
    router.push('/login')
  }

  return (
    <header className="bg-primary py-4 sticky top-0 z-50">
      {/* ancho corporativo */}
      <div className="mx-auto max-w-[1320px] px-6 lg:px-10">
        <div className="flex items-center justify-between">
          {/* LOGO */}
          <Logo />

          {/* DERECHA: MENU + BOTON */}
          <div className="hidden xl:flex items-center gap-8">
            {/* MENU */}
            <nav>
              <ul className="flex items-center gap-4 text-white">
                {links.map((link) => (
                  <li
                    key={link.path}
                    className="text-sm uppercase font-primary font-medium tracking-[1.05px]
                               after:content-['/'] after:mx-2 last:after:content-none after:text-accent/80"
                  >
                    <ScrollLink
                      to={link.path}
                      smooth
                      spy
                      offset={-90}
                      className="cursor-pointer transition-colors hover:text-accent"
                      activeClass="text-accent"
                    >
                      {link.name}
                    </ScrollLink>
                  </li>
                ))}
              </ul>
            </nav>

            {/* BOTON */}
            <button
              type="button"
              onClick={handleClick}
              className="h-[54px] min-w-[200px] pl-2.5 pr-6 flex items-center justify-between bg-white group shadow-sm"
            >
              <div className="flex-1 text-center tracking-[1.2px] font-primary font-bold text-primary text-sm uppercase">
                Sistema
              </div>
              <div className="w-11 h-11 bg-primary flex items-center justify-center">
                <RiArrowRightUpLine className="text-white text-xl group-hover:rotate-45 transition-all duration-200" />
              </div>
            </button>
          </div>

          {/* MOBILE */}
          <div className="xl:hidden">
            <NavMobile />
          </div>
        </div>
      </div>
    </header>
  )
}

export default Header
