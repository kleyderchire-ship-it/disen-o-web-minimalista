import { ArrowUpRight } from 'lucide-react'

const EMAIL = 'hola@maison.agency'

export function Contact() {
  return (
    <section id="contacto" className="border-t">
      <div className="mx-auto w-full max-w-6xl px-6 py-24 md:py-32">
        <p className="text-xs uppercase tracking-[0.25em] text-muted-foreground">
          Contacto
        </p>
        <h2 className="mt-4 max-w-3xl text-balance font-serif text-5xl leading-[1.05] md:text-7xl">
          ¿Lista para el siguiente nivel?
        </h2>
        <p className="mt-6 max-w-lg leading-relaxed text-muted-foreground">
          Escríbenos con tu usuario y tus objetivos. Toda la información se
          trata de forma confidencial.
        </p>
        <a
          href={`mailto:${EMAIL}?subject=Aplicación%20Maison`}
          className="group mt-12 inline-flex items-center gap-3 border-b border-foreground pb-2 font-serif text-3xl transition-colors hover:text-accent hover:border-accent md:text-4xl"
        >
          {EMAIL}
          <ArrowUpRight
            className="size-6 transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5"
            aria-hidden="true"
          />
        </a>
      </div>
    </section>
  )
}
