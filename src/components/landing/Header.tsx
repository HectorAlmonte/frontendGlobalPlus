'use client'

import {Link as ScrollLink} from 'react-scroll';
import {RiArrowRightUpLine} from 'react-icons/ri'
import { useRouter } from 'next/navigation';
import Logo from '@/components/landing/Logo'
import NavMobile from '@/components/landing/NavMobile'

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

const Header = () => {
     
    const router = useRouter()

    const handleClick = () =>{
        router.push('/login')
    }

    return (
    <header className='bg-primary py-4 sticky top-0 z-50'>
        <div className="container mx-auto">
            <div className="flex items-center justify-between px-4">           
                {/* Logo */}
                <Logo/>

                {/* anv & btn */}
                <nav className='hidden xl:flex items-center gap-12'>

                    {/* IZQUIERDA (espacio balance) */}
                    <div className="w-[200px]" />

                    {/* CENTRO REAL */}
                    <ul className='flex flex-1 justify-center gap-12 text-white'>
                        {links.map((link, index) => {
                            return (
                                <li key={index} className="text-white text-sm uppercase font-primary font-madium tracking-[1.2px] after:content-['/'] after:mx-4 last:after:content-none after:text-accent">
                                    <ScrollLink 
                                    to={link.path}
                                    smooth
                                    spy
                                    className="cursor-pointer"
                                    activeClass="text-accent"
                                    >
                                        {link.name}
                                    </ScrollLink>
                                </li>
                            )
                        })}
                    </ul>

                    {/* DERECHA */}
                    <div className="w-[200px] flex justify-end pr-4">
                        <button className='w-[200px] h-[54px] py-[5px] pl-2.5 pr-6 flex items-center justify-between min-w-[200px] bg-white group' onClick={handleClick}>
                            <div className="flex-1 text-center tracking-[1.2px] font-primary font-bold text-primary text-sm uppercase">Sistema</div>
                            <div className="w-11 h-11 bg-primary flex items-center justify-center">
                                <RiArrowRightUpLine className='text-white text-xl group-hover:rotate-45 transition-all duration-200'/>
                            </div>
                        </button>
                    </div>
                </nav>
                
                {/* anv mobile */}
                <div className='xl:hidden '> <NavMobile/></div>
            </div>
        </div>
    </header>
)}

export default Header