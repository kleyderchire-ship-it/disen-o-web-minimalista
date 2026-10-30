import { ArrowRight } from 'lucide-react'

const stats = [
  { value: '+40', label: 'Creadoras gestionadas' },
  { value: '3.2x', label: 'Crecimiento medio' },
  { value: '24/7', label: 'Gestión de chat' },
]

export function Hero() {
  return (
    <section className="mx-auto w-full max-w-6xl px-6 pb-24 pt-16 md:pt-28">
      <p className="text-xs uppercase tracking-[0.25em] text-muted-foreground">
        Agencia boutique de gestión
      </p>
      <h1 className="mt-6 max-w-4xl text-balance font-serif text-5xl leading-[1.05] tracking-tight md:text-7xl lg:text-8xl">
        Tú creas. Nosotros hacemos{' '}
        <em className="text-accent">crecer</em> tu marca.
      </h1>
      <p className="mt-8 max-w-xl text-pretty text-lg leading-relaxed text-muted-foreground">
        Estrategia, marketing y gestión diaria para creadoras de contenido que
        quieren profesionalizar su negocio, con total discreción.
      </p>
      <div className="mt-10 flex flex-wrap items-center gap-6">
        <a
          href="#contacto"
          className="group inline-flex items-center gap-2 rounded-full bg-foreground px-6 py-3 text-sm text-background transition-opacity hover:opacity-90"
        >
          Trabaja con nosotros
          <ArrowRight
            className="size-4 transition-transform group-hover:translate-x-0.5"
            aria-hidden="true"
          />
        </a>
        <a
          href="#servicios"
          className="text-sm underline underline-offset-4 decoration-border hover:decoration-foreground"
        >
          Ver servicios
        </a>
      </div>

      <dl className="mt-24 grid grid-cols-1 gap-8 border-t pt-10 sm:grid-cols-3">
        {stats.map((stat) => (
          <div key={stat.label}>
            <dt className="text-sm text-muted-foreground">{stat.label}</dt>
            <dd className="mt-2 font-serif text-4xl">{stat.value}</dd>
          </div>
        ))}
      </dl>
    </section>
  )
}
