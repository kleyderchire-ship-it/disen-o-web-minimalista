import { ArrowRight, ShieldCheck, TrendingUp } from 'lucide-react'
import { HeroSceneLoader } from './hero-scene-loader'

const metrics = [
  { label: 'Ingresos mensuales', value: '€48.320', change: '+214%' },
  { label: 'Suscriptores activos', value: '6.912', change: '+167%' },
  { label: 'Tasa de retención', value: '82%', change: '+31%' },
]

export function Hero() {
  return (
    <section className="mx-auto grid w-full max-w-6xl items-center gap-16 px-6 pb-24 pt-16 md:pt-24 lg:grid-cols-2">
      <div>
        <p className="inline-flex items-center gap-2 rounded-full border px-3 py-1 font-mono text-xs uppercase tracking-wider text-muted-foreground">
          <span className="size-1.5 rounded-full bg-accent" aria-hidden="true" />
          Gestión integral para creadoras
        </p>
        <h1 className="mt-6 text-balance text-4xl font-semibold leading-[1.1] tracking-tight md:text-6xl">
          Convertimos tu contenido en un negocio rentable y sostenible.
        </h1>
        <p className="mt-6 max-w-lg text-pretty text-lg leading-relaxed text-muted-foreground">
          Estrategia, marketing, gestión de chat y protección de marca con un
          equipo dedicado. Tú te centras en crear; nosotros, en hacerlo crecer.
        </p>
        <div className="mt-10 flex flex-wrap items-center gap-4">
          <a
            href="#contacto"
            className="group inline-flex items-center gap-2 rounded-md bg-foreground px-5 py-3 text-sm font-medium text-background transition-opacity hover:opacity-90"
          >
            Solicitar evaluación gratuita
            <ArrowRight
              className="size-4 transition-transform group-hover:translate-x-0.5"
              aria-hidden="true"
            />
          </a>
          <a
            href="#servicios"
            className="inline-flex items-center rounded-md border px-5 py-3 text-sm font-medium transition-colors hover:bg-muted"
          >
            Ver servicios
          </a>
        </div>
        <p className="mt-8 flex items-center gap-2 text-sm text-muted-foreground">
          <ShieldCheck className="size-4 text-accent" aria-hidden="true" />
          Contratos claros y acuerdo de confidencialidad (NDA) desde el primer día.
        </p>
      </div>

      <figure
        aria-label="Composición 3D interactiva con métricas de crecimiento"
        className="relative h-[460px] w-full md:h-[560px]"
      >
        <div className="absolute inset-0">
          <HeroSceneLoader />
        </div>

        <div className="absolute left-0 top-6 rounded-xl border bg-card/80 px-4 py-3 shadow-sm backdrop-blur-md">
          <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <TrendingUp className="size-3.5 text-accent" aria-hidden="true" />
            Crecimiento medio
          </p>
          <p className="mt-1 text-2xl font-semibold tracking-tight">+214%</p>
        </div>

        <dl className="absolute inset-x-0 bottom-0 grid grid-cols-3 gap-4 rounded-xl border bg-card/80 p-4 shadow-sm backdrop-blur-md">
          {metrics.map((metric) => (
            <div key={metric.label}>
              <dt className="text-xs text-muted-foreground">{metric.label}</dt>
              <dd className="mt-1 text-base font-semibold tracking-tight md:text-lg">
                {metric.value}
              </dd>
              <dd className="font-mono text-xs text-accent">{metric.change}</dd>
            </div>
          ))}
        </dl>
      </figure>
    </section>
  )
}
