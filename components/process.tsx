const steps = [
  {
    title: 'Solicitud',
    description: 'Completa el formulario con tu perfil y objetivos. Respondemos en menos de 48 horas.',
  },
  {
    title: 'Auditoría y propuesta',
    description: 'Analizamos tu cuenta en una llamada privada y te presentamos un plan a medida.',
  },
  {
    title: 'Incorporación',
    description: 'Firmamos acuerdo y NDA, configuramos accesos y asignamos tu equipo dedicado.',
  },
  {
    title: 'Crecimiento',
    description: 'Ejecutamos el plan, medimos cada semana y optimizamos de forma continua.',
  },
]

export function Process() {
  return (
    <section id="proceso" className="scroll-mt-16">
      <div className="mx-auto w-full max-w-6xl px-6 py-28">
        <div className="max-w-2xl">
          <p className="font-mono text-xs uppercase tracking-wider text-accent">Proceso</p>
          <h2 className="mt-3 text-balance text-3xl font-semibold tracking-tight md:text-4xl">
            Un método claro, sin letra pequeña.
          </h2>
        </div>
        <ol className="mt-14 grid gap-8 md:grid-cols-2 lg:grid-cols-4">
          {steps.map((step, index) => (
            <li key={step.title}>
              <div id={`a-step-${index}`} aria-hidden="true" className="mb-6 h-44 w-full" />
              <span className="font-mono text-sm text-accent">
                {`Paso ${String(index + 1).padStart(2, '0')}`}
              </span>
              <h3 className="mt-3 font-semibold">{step.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                {step.description}
              </p>
            </li>
          ))}
        </ol>
      </div>
    </section>
  )
}
