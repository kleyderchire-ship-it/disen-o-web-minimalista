const services = [
  {
    title: 'Estrategia y marca',
    description:
      'Definimos tu posicionamiento, precios y calendario de contenido para maximizar ingresos de forma sostenible.',
  },
  {
    title: 'Marketing y tráfico',
    description:
      'Crecimiento orgánico en redes sociales y campañas de captación que atraen suscriptores de calidad.',
  },
  {
    title: 'Gestión de chat',
    description:
      'Equipo profesional que atiende a tus fans en tu tono y con tus límites, las 24 horas.',
  },
  {
    title: 'Analítica y reportes',
    description:
      'Informes claros cada semana. Sabrás siempre qué funciona, qué no y hacia dónde vamos.',
  },
  {
    title: 'Privacidad y seguridad',
    description:
      'Protección de identidad, bloqueo geográfico y retirada de contenido filtrado (DMCA).',
  },
  {
    title: 'Acompañamiento',
    description:
      'Una manager dedicada contigo. Comunicación directa, transparencia y acuerdos claros.',
  },
]

export function Services() {
  return (
    <section id="servicios" className="border-t">
      <div className="mx-auto w-full max-w-6xl px-6 py-24">
        <div className="grid gap-12 md:grid-cols-[1fr_2fr]">
          <div>
            <p className="text-xs uppercase tracking-[0.25em] text-muted-foreground">
              Servicios
            </p>
            <h2 className="mt-4 font-serif text-4xl leading-tight md:text-5xl">
              Todo lo que necesitas, en un solo equipo.
            </h2>
          </div>
          <ol className="grid gap-px overflow-hidden rounded-lg border bg-border sm:grid-cols-2">
            {services.map((service, index) => (
              <li key={service.title} className="bg-background p-8">
                <span className="font-serif text-sm text-accent">
                  {String(index + 1).padStart(2, '0')}
                </span>
                <h3 className="mt-4 text-lg font-medium">{service.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                  {service.description}
                </p>
              </li>
            ))}
          </ol>
        </div>
      </div>
    </section>
  )
}
