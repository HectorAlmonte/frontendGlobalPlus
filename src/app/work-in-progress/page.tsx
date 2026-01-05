import { Construction } from "lucide-react";

export default function WorkInProgressPage() {
  return (
    <section className="min-h-screen flex items-center justify-center bg-background px-4">
      <div className="text-center max-w-md">
        <div className="flex justify-center mb-6">
          <Construction className="w-16 h-16 text-primary" />
        </div>

        <h1 className="text-3xl font-bold mb-4">
          Work in Progress 🚧
        </h1>

        <p className="text-muted-foreground mb-8">
          El sistema se encuentra actualmente en desarrollo.
          Estamos trabajando para brindarte una mejor experiencia.
        </p>

        <a
          href="/"
          className="inline-block px-6 py-3 rounded-lg bg-primary text-primary-foreground font-medium hover:opacity-90 transition"
        >
          Volver al inicio
        </a>
      </div>
    </section>
  );
}
