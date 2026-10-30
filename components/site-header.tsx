const links = [
  { href: '#servicios', label: 'Servicios' },
  { href: '#proceso', label: 'Proceso' },
  { href: '#contacto', label: 'Contacto' },
]

export function SiteHeader() {
  return (
    <header className="mx-auto flex w-full max-w-6xl items-center justify-between px-6 py-6">
      <a href="#" className="font-serif text-2xl tracking-tight">
        Maison<span className="text-accent">.</span>
      </a>
      <nav aria-label="Principal" className="flex items-center gap-6 text-sm">
        {links.map((link) => (
          <a
            key={link.href}
            href={link.href}
            className="hidden text-muted-foreground transition-colors hover:text-foreground sm:inline"
          >
            {link.label}
          </a>
        ))}
        <a
          href="#contacto"
          className="rounded-full border border-foreground px-4 py-2 transition-colors hover:bg-foreground hover:text-background"
        >
          Aplicar
        </a>
      </nav>
    </header>
  )
}
