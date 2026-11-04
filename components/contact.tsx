import { ArrowRight, Check, Mail } from 'lucide-react'

const EMAIL = 'Kleyderchire@gmail.com'

const points = [
  'Evaluación gratuita de tu cuenta',
  'Propuesta personalizada sin compromiso',
  'Confidencialidad garantizada',
]

export function Contact() {
  return (
    <section id="contacto" className="scroll-mt-16">
      <div className="mx-auto flex min-h-svh w-full max-w-6xl flex-col items-center justify-center px-6 py-28 text-center">
        <div id="a-finale" aria-hidden="true" className="h-[42vh] w-full max-w-md" />
        <p className="mt-10 font-mono text-xs uppercase tracking-[0.3em] text-accent">Contacto</p>
        <h2 className="mt-3 max-w-2xl text-balance text-4xl font-semibold tracking-tight md:text-6xl">
          Hablemos del futuro de tu marca.
        </h2>
        <p className="mt-5 max-w-md leading-relaxed text-muted-foreground">
          Envíanos tu usuario y tus objetivos. Te contactamos en menos de 48 horas.
        </p>
        <ul className="mt-8 flex flex-wrap justify-center gap-x-8 gap-y-3">
          {points.map((point) => (
            <li key={point} className="flex items-center gap-2 text-sm">
              <Check className="size-4 text-accent" aria-hidden="true" />
              {point}
            </li>
          ))}
        </ul>
        <div className="mt-10 flex flex-col items-center gap-6 sm:flex-row">
          <a
            href={`mailto:${EMAIL}?subject=Solicitud%20de%20evaluaci%C3%B3n`}
            className="group inline-flex items-center gap-2 rounded-full bg-foreground px-7 py-3.5 text-sm font-medium text-background transition-opacity hover:opacity-90"
          >
            Solicitar evaluación
            <ArrowRight className="size-4 transition-transform group-hover:translate-x-0.5" aria-hidden="true" />
          </a>
          <a
            href={`mailto:${EMAIL}`}
            className="inline-flex items-center gap-2 text-sm font-medium underline-offset-4 hover:underline"
          >
            <Mail className="size-4" aria-hidden="true" />
            {EMAIL}
          </a>
        </div>
      </div>
    </section>
  )
}
