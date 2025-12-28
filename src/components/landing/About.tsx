import React from "react";
import Pretitle from "@/components/landing/basicComponents/Pretitle";
import ButtonHero from "./basicComponents/ButtonHero";
import Image from "next/image";

const About = () => {
  return (
    <section id="about" className="py-16 sm:py-20 xl:py-28">
      <div className="container mx-auto max-w-6xl px-5 sm:px-8">
        <div className="flex flex-col gap-16 xl:flex-row xl:items-center xl:justify-between">

          {/* TEXT */}
          <div className="max-w-[520px] text-center xl:text-left">
            <Pretitle text="Sobre nosotros" center />

            <h2 className="h2 mt-4 mb-6">
              Enfocados en la Excelencia en Cada Proyecto
            </h2>

            <p className="mb-10 text-muted-foreground leading-relaxed">
              Nuestro compromiso inquebrantable con la excelencia impulsa cada
              proyecto que emprendemos. Desde el concepto hasta la finalización,
              elaboramos meticulosamente soluciones que representan calidad,
              precisión e innovación.
            </p>

            <ButtonHero text="Contáctanos" />
          </div>

          {/* IMAGE (MISMA IMAGEN, MEJOR TRATADA) */}
          <div className="w-full xl:w-[460px] flex justify-center xl:justify-end">
            <div className="relative w-full h-[420px] rounded-2xl bg-primary flex items-center justify-center shadow-lg">
              <Image
                src="/logo/logo-texto.png"
                alt="GlobalPlus Logística Integral"
                width={320}
                height={140}
                className="object-contain"
                priority
              />
            </div>
          </div>

        </div>
      </div>
    </section>
  );
};

export default About;
