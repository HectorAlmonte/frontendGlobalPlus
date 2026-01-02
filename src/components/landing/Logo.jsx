import Image from 'next/image'
import React from 'react'
import { Link as ScrollLink } from 'react-scroll'

const Logo = () => {
  return (
    <ScrollLink
      to="home"
      smooth
      spy
      offset={-90}
      duration={500}
      className="cursor-pointer inline-flex items-center"
      aria-label="Ir al inicio"
    >
      <Image
        src="/logo/logo-texto.png"
        alt="Global Plus"
        width={140}
        height={36}
        priority
      />
    </ScrollLink>
  )
}

export default Logo
