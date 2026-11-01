const links = [
  { href: '#servicios', label: 'Servicios' },
  { href: '#resultados', label: 'Resultados' },
  { href: '#proceso', label: 'Proceso' },
  { href: '#faq', label: 'Preguntas' },
]

export function SiteHeader() {
  return (
    <header className="fixed inset-x-0 top-0 z-50 bg-background/30 backdrop-blur-md">
      <div className="mx-auto flex h-16 w-full max-w-6xl items-center justify-between px-6">
        <a href="#" className="flex items-center gap-2 text-sm font-semibold tracking-tight">
          <span
            className="flex size-7 items-center justify-center rounded-md bg-foreground text-xs font-bold text-background"
            aria-hidden="true"
          >
            M
          </span>
          Maison Management
        </a>
        <nav aria-label="Principal" className="flex items-center gap-8 text-sm">
          <ul className="hidden items-center gap-8 md:flex">
            {links.map((link) => (
              <li key={link.href}>
                <a
                  href={link.href}
                  className="text-muted-foreground transition-colors hover:text-foreground"
                >
                  {link.label}
                </a>
              </li>
            ))}
          </ul>
          <a
            href="#contacto"
            className="rounded-md bg-foreground px-4 py-2 font-medium text-background transition-opacity hover:opacity-90"
          >
            Agendar llamada
          </a>
        </nav>
      </div>
    </header>
  )
}
