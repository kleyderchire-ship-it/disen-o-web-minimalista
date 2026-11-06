import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'MAISON MANAGEMENT | Agency OS',
  description: 'Panel privado de operaciones para MAISON MANAGEMENT.',
}

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="es"><body>{children}</body></html>
}
