import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title:
    'Consulta - Consulado General de la República Bolivariana de Venezuela en Barranquilla',
  description: 'Consulta oficial de documentos consulares',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="es">
      <body>{children}</body>
    </html>
  )
}
