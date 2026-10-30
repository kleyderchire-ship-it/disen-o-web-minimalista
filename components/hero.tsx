import { ArrowRight, ShieldCheck, TrendingUp } from 'lucide-react'

const metrics = [
  { label: 'Ingresos mensuales', value: '€48.320', change: '+214%' },
  { label: 'Suscriptores activos', value: '6.912', change: '+167%' },
  { label: 'Tasa de retención', value: '82%', change: '+31%' },
]

const bars = [28, 36, 34, 48, 52, 61, 58, 72, 80, 88, 94, 100]

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
        aria-label="Ejemplo de panel de resultados de una cliente"
        className="rounded-xl border bg-card p-6 shadow-sm"
      >
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium">Panel de rendimiento</p>
            <p className="text-xs text-muted-foreground">Últimos 12 meses</p>
          </div>
          <span className="inline-flex items-center gap-1 rounded-md bg-muted px-2 py-1 font-mono text-xs">
            <TrendingUp className="size-3.5 text-accent" aria-hidden="true" />
            En crecimiento
          </span>
        </div>

        <div className="mt-8 flex h-40 items-end gap-2" aria-hidden="true">
          {bars.map((height, index) => (
            <div
              key={index}
              className={`flex-1 rounded-sm ${index === bars.length - 1 ? 'bg-accent' : 'bg-foreground/10'}`}
              style={{ height: `${height}%` }}
            />
          ))}
        </div>

        <dl className="mt-6 grid grid-cols-3 gap-4 border-t pt-6">
          {metrics.map((metric) => (
            <div key={metric.label}>
              <dt className="text-xs text-muted-foreground">{metric.label}</dt>
              <dd className="mt-1 text-lg font-semibold tracking-tight md:text-xl">
                {metric.value}
              </dd>
              <dd className="font-mono text-xs text-accent">{metric.change}</dd>
            </div>
          ))}
        </dl>
        <figcaption className="mt-4 text-xs text-muted-foreground">
          Datos ilustrativos basados en el promedio de nuestras cuentas.
        </figcaption>
      </figure>
    </section>
  )
}
