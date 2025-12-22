import Image from 'next/image'
import React from 'react'
import { Link } from 'react-scroll'

const Logo = () => {
  return (
    <Link href=''>
        <Image         
        src="/logo/logo-texto.png"
        alt="Global Plus"
        width={140}
        height={36}
        priority />
    </Link>
  )
}

export default Logo