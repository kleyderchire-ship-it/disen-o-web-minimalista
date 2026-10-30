export function SiteFooter() {
  return (
    <footer className="border-t">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-4 px-6 py-8 text-sm text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
        <p>
          {'© '}
          {new Date().getFullYear()} Maison. Todos los derechos reservados.
        </p>
        <p>Solo trabajamos con creadoras mayores de 18 años.</p>
      </div>
    </footer>
  )
}
