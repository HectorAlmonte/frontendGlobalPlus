'use client'

import {useState} from 'react'
import 
{
Sheet,
SheetTrigger,
SheetContent,
SheetDescription,
SheetHeader,
SheetTitle

} 
from '@/components/ui/sheet'

import {RiMenu3Fill} from 'react-icons/ri'
import Logo from './Logo'

import {Link as ScrollLink } from 'react-scroll'

const links = [
    {
        name: 'home',
        path: 'home'
    },
    {
        name: 'services',
        path: 'services'
    },
    {
        name: 'mision',
        path: 'mision'
    },
    {
        name: 'about',
        path: 'about'
    },
    {
        name: 'contact',
        path: 'contact'
    }
];

const NavMobile = () => {
    const [isOpen, setIsOpen] = useState(false)
  return (
    <Sheet open={isOpen} onOpenChange={setIsOpen}>
        <SheetTrigger 
        className='test white flex items-center justify-center text-3xl' 
        onClick={() => setIsOpen(true)}
        >
            <RiMenu3Fill className='text-white'/>
        </SheetTrigger>
        <SheetContent className='bg-primary border-none text-white'>
            <div className="flex flex-col pt-10 pb-8 items-center justify-start h-full gap-8">
                <SheetHeader>
                    <SheetTitle>
                        <Logo/>
                    </SheetTitle>
                    <SheetDescription className='sr-only'>
                        menu
                    </SheetDescription>
                </SheetHeader>
                <ul className='w-full flex flex-col gap-10 justify-center text-center uppercase'>
                    {links.map((link, index) => {
                        return (
                            <li key={index}>
                                <ScrollLink
                                    to={link.path}
                                    smooth
                                    spy
                                    duration={500}
                                    classname='cursor-pointer'
                                    activeClass='text-accent'
                                    onClick={()=> setIsOpen(false)}
                                >
                                    {link.name}        
                                </ScrollLink>
                            </li>
                        )
                    })}
                </ul>
            </div>
        </SheetContent>
    </Sheet>
  )
}

export default NavMobile