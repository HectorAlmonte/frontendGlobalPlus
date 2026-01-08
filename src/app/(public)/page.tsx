'use client'

import { useState,useEffect } from "react"

import About from "@/components/landing/About"
import Contact from "@/components/landing/Contact"
import Faq from "@/components/landing/Faq"
import Footer from "@/components/landing/Footer"
import Header from "@/components/landing/Header"
import Hero from "@/components/landing/Hero"
import Services from "@/components/landing/Services"
import Stast from "@/components/landing/Stast"
import Testimonials from "@/components/landing/Testimonials"
import Topbar from "@/components/landing/Topbar"
import Work from "@/components/landing/Work"


import Link from "next/link"

export default function LandingPage() {

  const [headerActive, setHeaderActive] = useState(false)

  useEffect(() => {
    
    const handleScroll = () =>{
      setHeaderActive(window.scrollY > 200);
    }

    window.addEventListener('scroll', handleScroll)
    return () => {
     window.removeEventListener('scroll',handleScroll) 
    }
  }, [])
  

  return (
    <div className="light dark:light">
      <div className="relative z-10">
        <Header/>
      </div>
      <div className={`w-full transition-transform duration-500 fixed top-0 left-0 z-50 ${headerActive ? "translate-y-0" : "-translate-y-full"}`}>
        <Header/>
      </div>
      <Hero/>
      <About/>
      <Stast/>
      <Services/>
      <Work/>
      <Faq/>
      <Contact/>
      <Footer/>
    </div>
  )
}
