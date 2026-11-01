import {
  BarChart3,
  Compass,
  Headphones,
  Lock,
  Megaphone,
  UserRound,
  type LucideIcon,
} from 'lucide-react'

const services: { title: string; description: string; icon: LucideIcon }[] = [
  {
    title: 'Estrategia y marca',
    description:
      'Posicionamiento, estructura de precios y calendario editorial diseñados para maximizar ingresos de forma sostenible.',
    icon: Compass,
  },
  {
    title: 'Marketing y captación',
    description:
      'Crecimiento orgánico en redes sociales y campañas de tráfico que atraen suscriptores de calidad.',
    icon: Megaphone,
  },
  {
    title: 'Gestión de chat',
    description:
      'Equipo profesional que atiende a tus fans 24/7, respetando tu tono, tus límites y tus directrices.',
    icon: Headphones,
  },
  {
    title: 'Analítica y reportes',
    description:
      'Informes semanales con métricas clave, objetivos y recomendaciones accionables.',
    icon: BarChart3,
  },
  {
    title: 'Privacidad y protección',
    description:
      'Protección de identidad, bloqueo geográfico y retirada de contenido filtrado mediante DMCA.',
    icon: Lock,
  },
  {
    title: 'Account manager dedicada',
    description:
      'Una persona de referencia contigo: comunicación directa, transparencia y seguimiento continuo.',
    icon: UserRound,
  },
]

export function Services() {
  return (
    <section id="servicios" className="scroll-mt-16">
      <div className="mx-auto grid w-full max-w-6xl gap-12 px-6 py-28 lg:grid-cols-[1.3fr_1fr] lg:items-center">
        <div>
        <div className="max-w-2xl">
          <p className="font-mono text-xs uppercase tracking-wider text-accent">Servicios</p>
          <h2 className="mt-3 text-balance text-3xl font-semibold tracking-tight md:text-4xl">
            Un equipo completo trabajando para tu marca.
          </h2>
          <p className="mt-4 leading-relaxed text-muted-foreground">
            Cubrimos cada área del negocio para que puedas escalar sin perder
            el control ni la calidad de tu contenido.
          </p>
        </div>
        <ul className="mt-14 grid gap-x-10 gap-y-10 sm:grid-cols-2">
          {services.map((service) => (
            <li key={service.title}>
              <service.icon className="size-5 text-accent" aria-hidden="true" />
              <h3 className="mt-4 font-semibold">{service.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                {service.description}
              </p>
            </li>
          ))}
        </ul>
        </div>
        <div id="a-services" aria-hidden="true" className="order-first aspect-square w-full lg:order-none" />
      </div>
    </section>
  )
}
