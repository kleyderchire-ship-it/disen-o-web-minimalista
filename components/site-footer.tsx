const links = [
  { href: '#servicios', label: 'Servicios' },
  { href: '#resultados', label: 'Resultados' },
  { href: '#proceso', label: 'Proceso' },
  { href: '#faq', label: 'Preguntas' },
  { href: '#contacto', label: 'Contacto' },
]

export function SiteFooter() {
  return (
    <footer>
      <div id="a-footer-word" aria-hidden="true" className="mx-auto h-[16vw] max-h-64 w-full max-w-6xl px-6" />
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-6 px-6 py-10 text-sm text-muted-foreground md:flex-row md:items-center md:justify-between">
        <p>
          <span className="font-semibold text-foreground">Maison Management</span>
          {` · © ${new Date().getFullYear()} Todos los derechos reservados.`}
        </p>
        <nav aria-label="Pie de página">
          <ul className="flex flex-wrap gap-x-6 gap-y-2">
            {links.map((link) => (
              <li key={link.href}>
                <a href={link.href} className="transition-colors hover:text-foreground">
                  {link.label}
                </a>
              </li>
            ))}
          </ul>
        </nav>
        <p className="text-xs">Solo para mayores de 18 años.</p>
      </div>
    </footer>
  )
}
