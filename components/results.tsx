const stats = [
  { value: '+40', label: 'Creadoras gestionadas' },
  { value: '3,2x', label: 'Crecimiento medio de ingresos' },
  { value: '24/7', label: 'Cobertura de chat' },
  { value: '48 h', label: 'Tiempo de respuesta' },
]

const testimonials = [
  {
    quote:
      'En seis meses tripliqué mis ingresos y por fin tengo tiempo para crear. La comunicación es impecable y los reportes, muy claros.',
    author: 'Laura M.',
    role: 'Creadora, 2 años con Maison',
  },
  {
    quote:
      'Lo que más valoro es la discreción y la profesionalidad. Siento que tengo un equipo real detrás de mi marca.',
    author: 'Sofía R.',
    role: 'Creadora, 1 año con Maison',
  },
]

export function Results() {
  return (
    <section id="resultados" className="scroll-mt-16">
      <div className="mx-auto w-full max-w-6xl px-6 py-28">
        <p className="font-mono text-xs uppercase tracking-[0.3em] text-accent">Resultados</p>
        <h2 className="mt-3 max-w-2xl text-balance text-3xl font-semibold tracking-tight md:text-4xl">
          Cifras que respaldan nuestro trabajo.
        </h2>

        <dl className="mt-16 grid grid-cols-2 gap-x-8 gap-y-14 lg:grid-cols-4">
          {stats.map((stat, i) => (
            <div key={stat.label} className="flex flex-col-reverse items-center text-center">
              <dt className="mt-4 text-sm text-muted-foreground">{stat.label}</dt>
              <dd id={`a-stat-${i}`} className="flex h-24 w-full items-center justify-center md:h-28">
                <span className="sr-only">{stat.value}</span>
              </dd>
            </div>
          ))}
        </dl>

        <ul className="mt-24 grid gap-14 md:grid-cols-2">
          {testimonials.map((t) => (
            <li key={t.author}>
              <figure>
                <blockquote className="text-pretty text-xl leading-relaxed md:text-2xl">
                  {`“${t.quote}”`}
                </blockquote>
                <figcaption className="mt-6 text-sm">
                  <span className="font-medium">{t.author}</span>
                  <span className="text-muted-foreground">{` · ${t.role}`}</span>
                </figcaption>
              </figure>
            </li>
          ))}
        </ul>
      </div>
    </section>
  )
}
