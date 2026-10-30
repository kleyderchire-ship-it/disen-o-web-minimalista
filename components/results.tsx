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
    <section id="resultados" className="border-t bg-foreground text-background">
      <div className="mx-auto w-full max-w-6xl px-6 py-24">
        <p className="font-mono text-xs uppercase tracking-wider text-background/60">
          Resultados
        </p>
        <h2 className="mt-3 max-w-2xl text-balance text-3xl font-semibold tracking-tight md:text-4xl">
          Cifras que respaldan nuestro trabajo.
        </h2>

        <dl className="mt-14 grid grid-cols-2 gap-px overflow-hidden rounded-xl border border-background/15 bg-background/15 lg:grid-cols-4">
          {stats.map((stat) => (
            <div key={stat.label} className="flex flex-col-reverse bg-foreground p-6 md:p-8">
              <dt className="mt-2 text-sm text-background/60">{stat.label}</dt>
              <dd className="text-4xl font-semibold tracking-tight md:text-5xl">{stat.value}</dd>
            </div>
          ))}
        </dl>

        <ul className="mt-12 grid gap-6 md:grid-cols-2">
          {testimonials.map((t) => (
            <li key={t.author}>
              <figure className="flex h-full flex-col justify-between rounded-xl border border-background/15 p-8">
                <blockquote className="text-pretty text-lg leading-relaxed">
                  {`“${t.quote}”`}
                </blockquote>
                <figcaption className="mt-8 text-sm">
                  <span className="font-medium">{t.author}</span>
                  <span className="text-background/60">{` · ${t.role}`}</span>
                </figcaption>
              </figure>
            </li>
          ))}
        </ul>
      </div>
    </section>
  )
}
