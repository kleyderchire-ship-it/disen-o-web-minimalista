import { ArrowRight, ShieldCheck } from 'lucide-react'

export function Hero() {
  return (
    <section className="flex min-h-svh flex-col justify-center px-6 pb-16 pt-28">
      <div className="mx-auto w-full max-w-6xl">
        <p className="flex items-center gap-2 font-mono text-xs uppercase tracking-[0.3em] text-muted-foreground">
          <span className="size-1.5 rounded-full bg-accent" aria-hidden="true" />
          Gestión integral para creadoras
        </p>

        <div id="a-hero-title" aria-hidden="true" className="my-10 h-[18vw] max-h-[38vh] w-full" />

        <div className="flex flex-col gap-10 md:flex-row md:items-end md:justify-between">
          <h1 className="max-w-xl text-balance text-3xl font-semibold leading-tight tracking-tight md:text-5xl">
            <span className="sr-only">Maison Management. </span>
            Convertimos tu contenido en un negocio rentable.
          </h1>
          <div className="max-w-sm">
            <p className="text-pretty leading-relaxed text-muted-foreground">
              Estrategia, marketing, chat y protección de marca con un equipo
              dedicado. Tú creas; nosotros lo hacemos crecer.
            </p>
            <div className="mt-6 flex flex-wrap items-center gap-6">
              <a
                href="#contacto"
                className="group inline-flex items-center gap-2 rounded-full bg-foreground px-6 py-3 text-sm font-medium text-background transition-opacity hover:opacity-90"
              >
                Evaluación gratuita
                <ArrowRight className="size-4 transition-transform group-hover:translate-x-0.5" aria-hidden="true" />
              </a>
              <a href="#servicios" className="text-sm font-medium underline-offset-4 hover:underline">
                Ver servicios
              </a>
            </div>
            <p className="mt-6 flex items-center gap-2 text-xs text-muted-foreground">
              <ShieldCheck className="size-4 text-accent" aria-hidden="true" />
              Contrato claro y NDA desde el primer día.
            </p>
          </div>
        </div>
      </div>
    </section>
  )
}
