import Image from "next/image";
import ButtonHero from '@/components/landing/basicComponents/ButtonHero'

const Hero = () => {
  return (
    <div className="relative h-[70vh] overflow-hidden">
      <Image
        src="/images/landing/image.png"
        alt="Fondo"
        fill
        priority
        className="object-cover object-center"
      />

      <section
        id="home"
        className="relative z-10 h-full flex items-center justify-center text-white"
      >
        {/* Gradiente lateral */}
        <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-black/30 to-transparent z-0"></div>

        {/* Contenido */}
        <div className="z-10 text-center">
          <h1 className="text-[clamp(3rem,8vw,6rem)] font-extrabold leading-tight">
            <span className="text-blue-500">Global</span> Plus Logistica Integral
          </h1>
          <p>
            Lorem ipsum, dolor sit amet consectetur adipisicing elit. Perferendis, magnam ipsa. Labore, nobis corporis aperiam eaque dolorum nostrum, voluptas tenetur quas voluptatum repellendus veritatis non! Minus est provident fuga ipsum.
          </p>
          {/* <ButtonHero text={'conocenos'}/> */}
        </div>
      </section>
    </div>
  );
};

export default Hero;
