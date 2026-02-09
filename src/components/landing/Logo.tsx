import Image from 'next/image'
import React from 'react'
import { Link as ScrollLink } from 'react-scroll'

interface LogoProps {
  className?: string;
}

const Logo: React.FC<LogoProps> = ({ className = "" }) => {
  return (
    <ScrollLink
      to="home"
      smooth
      spy
      offset={-90}
      duration={500}
      className={`cursor-pointer inline-flex items-center ${className}`}
      aria-label="Ir al inicio"
    >
      <Image
        src="/logo/logo.png"
        alt="Global Plus"
        width={140}
        height={36}
        priority
      />
    </ScrollLink>
  )
}

export default Logo
