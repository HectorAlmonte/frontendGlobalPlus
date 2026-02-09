'use client'

import React from 'react'
import Link from 'next/link'
import { RiFacebookFill, RiYoutubeFill, RiTwitterXFill, RiInstagramFill } from 'react-icons/ri'

interface SocialItem {
  icon: React.ReactNode;
  path: string;
  label: string;
}

const socials: SocialItem[] = [
  {
    icon: <RiFacebookFill />,
    path: '#',
    label: 'Facebook'
  },
  {
    icon: <RiYoutubeFill />,
    path: '#',
    label: 'YouTube'
  },
  {
    icon: <RiTwitterXFill />,
    path: '#',
    label: 'Twitter'
  },
  {
    icon: <RiInstagramFill />,
    path: '#',
    label: 'Instagram'
  }
]

interface SocialProps {
  containerStyles?: string;
  iconStyles?: string;
}

const Social: React.FC<SocialProps> = ({ containerStyles = "", iconStyles = "" }) => {
  return (
    <div className={containerStyles}>
      {socials.map((item, index) => {
        return (
          <Link 
            href={item.path} 
            key={index} 
            className={iconStyles}
            aria-label={item.label}
            target="_blank"
            rel="noopener noreferrer"
          >
            {item.icon}
          </Link>
        )
      })}
    </div>
  )
}

export default Social