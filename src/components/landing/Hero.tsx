import Image from "next/image";
import ButtonHero from "@/components/landing/basicComponents/ButtonHero";

const Hero = () => {
  return (
    <div className="relative h-[70vh] min-h-[520px] overflow-hidden">
      <Image
        src="/images/landing/image.png"
        alt="Fondo"
        fill
        priority
        className="object-cover object-center"
      />

      <section
        id="home"
        className="relative z-10 h-full flex items-center text-white"
      >
        {/* Gradiente */}
        <div className="absolute inset-0 bg-linear-to-r from-black/80 via-black/40 to-transparent z-0" />

        {/* Wrapper */}
        <div className="relative z-10 w-full px-5 sm:px-8 xl:px-24">
          {/* Contenido */}
          <div className="
            max-w-xl
            flex flex-col
            gap-6
            text-center
            items-center
            sm:text-left
            sm:items-start
          ">
            <h1 className="text-[clamp(2.5rem,6vw,5rem)] font-extrabold leading-tight">
              <span className="text-blue-500">Global</span> Plus Logística Integral
            </h1>

            <p className="text-white/90 text-base sm:text-lg leading-relaxed">
              Lorem ipsum, dolor sit amet consectetur adipisicing elit.
              Perferendis, magnam ipsa. Labore, nobis corporis aperiam eaque.
            </p>

            <ButtonHero text="Conócenos" />
          </div>
        </div>
      </section>
    </div>
  );
};

export default Hero;
