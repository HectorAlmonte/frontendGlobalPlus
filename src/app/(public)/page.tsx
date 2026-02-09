"use client";

import { useEffect, useState, useCallback } from "react";
import { useTheme } from "next-themes";
import dynamic from "next/dynamic";

import Header from "@/components/landing/Header";
import Hero from "@/components/landing/Hero";
import About from "@/components/landing/About";
import { throttle } from "@/components/landing/utils/throttle";

// Lazy loading para componentes below-fold
const LazyStats = dynamic(() => import("@/components/landing/Stats"), {
  loading: () => <div className="h-96 bg-muted animate-pulse" />,
  ssr: false
});

const LazyServices = dynamic(() => import("@/components/landing/Services"), {
  loading: () => <div className="h-96 bg-muted animate-pulse" />,
  ssr: false
});

const LazyWork = dynamic(() => import("@/components/landing/Work"), {
  loading: () => <div className="h-96 bg-muted animate-pulse" />,
  ssr: false
});

const LazyFaq = dynamic(() => import("@/components/landing/Faq"), {
  loading: () => <div className="h-96 bg-muted animate-pulse" />,
  ssr: false
});

const LazyContact = dynamic(() => import("@/components/landing/Contact"), {
  loading: () => <div className="h-96 bg-muted animate-pulse" />,
  ssr: false
});

const LazyFooter = dynamic(() => import("@/components/landing/Footer"), {
  loading: () => <div className="h-96 bg-muted animate-pulse" />,
  ssr: false
});

export default function LandingPage() {
  const [headerActive, setHeaderActive] = useState(false);
  const { theme, resolvedTheme, setTheme } = useTheme();

  const handleScroll = useCallback(() => {
    setHeaderActive(window.scrollY > 200);
  }, []);

  useEffect(() => {
    const throttledScroll = throttle(handleScroll, 100);
    window.addEventListener("scroll", throttledScroll, { passive: true });
    return () => window.removeEventListener("scroll", throttledScroll);
  }, [handleScroll]);

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

      <main>
        <Hero />
        <About />
        <LazyStats />
        <LazyServices />
        <LazyWork />
        <LazyFaq />
        <LazyContact />
        <LazyFooter />
      </main>
    </div>
  );
}
