import { ArrowRight, Check, Mail } from 'lucide-react'

const EMAIL = 'hola@maison.agency'

const points = [
  'Evaluación gratuita de tu cuenta',
  'Propuesta personalizada sin compromiso',
  'Confidencialidad garantizada',
]

export function Contact() {
  return (
    <section id="contacto" className="border-t">
      <div className="mx-auto w-full max-w-6xl px-6 py-24">
        <div className="grid gap-10 rounded-2xl border bg-card p-8 md:p-12 lg:grid-cols-2 lg:items-center">
          <div>
            <p className="font-mono text-xs uppercase tracking-wider text-accent">Contacto</p>
            <h2 className="mt-3 text-balance text-3xl font-semibold tracking-tight md:text-4xl">
              Hablemos sobre el futuro de tu marca.
            </h2>
            <p className="mt-4 max-w-md leading-relaxed text-muted-foreground">
              Envíanos tu usuario y tus objetivos. Un miembro del equipo te
              contactará en menos de 48 horas.
            </p>
          </div>
          <div>
            <ul className="space-y-3">
              {points.map((point) => (
                <li key={point} className="flex items-center gap-3 text-sm">
                  <span className="flex size-5 items-center justify-center rounded-full bg-accent text-accent-foreground">
                    <Check className="size-3" aria-hidden="true" />
                  </span>
                  {point}
                </li>
              ))}
            </ul>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <a
                href={`mailto:${EMAIL}?subject=Solicitud%20de%20evaluaci%C3%B3n`}
                className="group inline-flex items-center justify-center gap-2 rounded-md bg-foreground px-5 py-3 text-sm font-medium text-background transition-opacity hover:opacity-90"
              >
                Solicitar evaluación
                <ArrowRight
                  className="size-4 transition-transform group-hover:translate-x-0.5"
                  aria-hidden="true"
                />
              </a>
              <a
                href={`mailto:${EMAIL}`}
                className="inline-flex items-center justify-center gap-2 rounded-md border px-5 py-3 text-sm font-medium transition-colors hover:bg-muted"
              >
                <Mail className="size-4" aria-hidden="true" />
                {EMAIL}
              </a>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
