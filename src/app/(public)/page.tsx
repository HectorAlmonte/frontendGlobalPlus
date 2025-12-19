'use client'

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
  return (
    <div>
      <Topbar/>
      <Header/>
      <Hero/>
      <About/>
      <Stast/>
      <Services/>
      <Work/>
      <Testimonials/>
      <Faq/>
      <Contact/>
      <Footer/>
    </div>
  )
}
