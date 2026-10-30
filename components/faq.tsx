import { Plus } from 'lucide-react'

const faqs = [
  {
    q: '¿Qué requisitos necesito para trabajar con vosotras?',
    a: 'Ser mayor de edad, tener una cuenta activa o la intención de abrirla y compromiso con un calendario de contenido. Evaluamos cada perfil de forma individual.',
  },
  {
    q: '¿Cómo funciona el modelo de comisión?',
    a: 'Trabajamos con un porcentaje sobre los ingresos generados, sin cuotas fijas ni costes ocultos. Todo queda recogido por contrato antes de empezar.',
  },
  {
    q: '¿Mantengo el control de mi cuenta y mi contenido?',
    a: 'Siempre. Tú decides qué se publica, tus límites y tu tono. La cuenta y el contenido siguen siendo 100% tuyos.',
  },
  {
    q: '¿Cómo protegéis mi privacidad?',
    a: 'Firmamos un NDA, aplicamos bloqueo geográfico, monitorizamos filtraciones y gestionamos retiradas DMCA de forma proactiva.',
  },
  {
    q: '¿Puedo cancelar el contrato?',
    a: 'Sí. Nuestros acuerdos incluyen un periodo de preaviso claro y sin penalizaciones abusivas.',
  },
]

export function Faq() {
  return (
    <section id="faq" className="border-t bg-muted/40">
      <div className="mx-auto grid w-full max-w-6xl gap-12 px-6 py-24 lg:grid-cols-[1fr_2fr]">
        <div>
          <p className="font-mono text-xs uppercase tracking-wider text-accent">Preguntas frecuentes</p>
          <h2 className="mt-3 text-balance text-3xl font-semibold tracking-tight md:text-4xl">
            Resolvemos tus dudas.
          </h2>
        </div>
        <div className="divide-y rounded-xl border bg-card">
          {faqs.map((faq) => (
            <details key={faq.q} className="group p-6">
              <summary className="flex cursor-pointer list-none items-center justify-between gap-4 font-medium [&::-webkit-details-marker]:hidden">
                {faq.q}
                <Plus
                  className="size-4 shrink-0 text-muted-foreground transition-transform group-open:rotate-45"
                  aria-hidden="true"
                />
              </summary>
              <p className="mt-3 text-sm leading-relaxed text-muted-foreground">{faq.a}</p>
            </details>
          ))}
        </div>
      </div>
    </section>
  )
}
