"use client";

import { useEffect, useState } from "react";
import { useTheme } from "next-themes";

import About from "@/components/landing/About";
import Contact from "@/components/landing/Contact";
import Faq from "@/components/landing/Faq";
import Footer from "@/components/landing/Footer";
import Header from "@/components/landing/Header";
import Hero from "@/components/landing/Hero";
import Services from "@/components/landing/Services";
import Stast from "@/components/landing/Stast";
import Work from "@/components/landing/Work";

export default function LandingPage() {
  const [headerActive, setHeaderActive] = useState(false);

  const { theme, resolvedTheme, setTheme } = useTheme();

  useEffect(() => {
    const handleScroll = () => setHeaderActive(window.scrollY > 200);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // ✅ Forzar light en landing, y restaurar el tema anterior al salir
  useEffect(() => {
    // resolvedTheme te da el real ("light" o "dark") aunque theme sea "system"
    const prev = theme ?? resolvedTheme ?? "system";

    setTheme("light");

    return () => {
      // vuelve al tema anterior al salir de la landing
      setTheme(prev);
    };
    // OJO: no metas `resolvedTheme` en deps para evitar efectos raros
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [setTheme]);

  return (
    <div>
      <div className="relative z-10">
        <Header />
      </div>

      <div
        className={`w-full transition-transform duration-500 fixed top-0 left-0 z-50 ${
          headerActive ? "translate-y-0" : "-translate-y-full"
        }`}
      >
        <Header />
      </div>

      <Hero />
      <About />
      <Stast />
      <Services />
      <Work />
      <Faq />
      <Contact />
      <Footer />
    </div>
  );
}
