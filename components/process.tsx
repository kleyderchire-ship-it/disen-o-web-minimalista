const steps = [
  {
    title: 'Aplicación',
    description: 'Cuéntanos sobre ti y tus objetivos. Respondemos en 48 horas.',
  },
  {
    title: 'Llamada',
    description: 'Analizamos tu cuenta y te presentamos un plan a medida.',
  },
  {
    title: 'Lanzamiento',
    description: 'Ponemos el plan en marcha y empiezas a ver resultados.',
  },
]

export function Process() {
  return (
    <section id="proceso" className="border-t bg-foreground text-background">
      <div className="mx-auto w-full max-w-6xl px-6 py-24">
        <p className="text-xs uppercase tracking-[0.25em] opacity-60">Proceso</p>
        <h2 className="mt-4 max-w-2xl font-serif text-4xl leading-tight md:text-5xl">
          Simple, claro y <em>sin letra pequeña</em>.
        </h2>
        <ol className="mt-16 grid gap-12 md:grid-cols-3">
          {steps.map((step, index) => (
            <li key={step.title} className="border-t border-background/20 pt-6">
              <span className="font-serif text-5xl opacity-40">{index + 1}</span>
              <h3 className="mt-4 text-lg font-medium">{step.title}</h3>
              <p className="mt-2 text-sm leading-relaxed opacity-70">
                {step.description}
              </p>
            </li>
          ))}
        </ol>
      </div>
    </section>
  )
}
