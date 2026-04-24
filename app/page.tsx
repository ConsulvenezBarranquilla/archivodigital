'use client'
import { useState } from 'react'
import Image from 'next/image'

export default function Home() {
  const [codigo, setCodigo] = useState('')
  const [resultado, setResultado] = useState(null)
  const [loading, setLoading] = useState(false)

  async function buscar() {
    setLoading(true)
    setResultado(null)

    const url =
      'https://docs.google.com/spreadsheets/d/e/2PACX-1vRkkTarkCdW1Iy0MN1PfG3ZetMrPAlgGH5aIH7tYYcLYqlVjwB0ePNp33yIrZ5WWX4x9cIyZc6HGK4e/pub?output=csv'

    const res = await fetch(url)
    const texto = await res.text()

    const filas = texto.split('\n').slice(1)

    let encontrado = null

    filas.forEach((fila) => {
      const cols = fila.split(',')

      if (
        cols[0]?.trim().toUpperCase() ===
        codigo.trim().toUpperCase()
      ) {
        encontrado = {
          codigo: cols[0],
          pasajero: cols[1],
          fecha: cols[2],
          aerolinea: cols[3],
          vuelo: cols[4]
        }
      }
    })

    if (encontrado) {
      setResultado(encontrado)
    } else {
      setResultado({
        error: 'Documento no encontrado'
      })
    }

    setLoading(false)
  }

  return (
    <main className="min-h-screen bg-gray-100 flex items-center justify-center p-6">
      <div className="bg-white shadow-xl rounded-2xl w-full max-w-xl p-8">

        <div className="flex flex-col items-center mb-6">
          <Image
            src="/logo.png"
            width={80}
            height={80}
            alt="Logo"
          />

          <h1 className="text-3xl font-bold mt-3">
            Validador de Documentos
          </h1>

          <p className="text-gray-500 text-sm">
            Consulta Documentos de Viaje
          </p>
        </div>

        <div className="flex gap-2">
          <input
            value={codigo}
            onChange={(e) =>
              setCodigo(e.target.value)
            }
            placeholder="Ingrese Numero Documento p. ej. xx/xxxx"
            className="border rounded-xl p-3 w-full"
          />

          <button
            onClick={buscar}
            className="bg-black text-white px-5 rounded-xl"
          >
            Buscar
          </button>
        </div>

        {loading && (
          <p className="mt-4 text-sm text-gray-500">
            Buscando...
          </p>
        )}

        <div className="mt-6">
          {resultado?.error && (
            <div className="bg-red-100 text-red-700 p-4 rounded-xl">
              {resultado.error}
            </div>
          )}

          {resultado && !resultado.error && (
            <div className="bg-green-50 p-5 rounded-xl border">
              <h2 className="font-bold text-lg mb-2">
                Documento válido
              </h2>

              <p>
                <strong>Nombre del pasajero:</strong>{' '}
                {resultado.pasajero}
              </p>

              <p>
                <strong>Fecha de viaje:</strong>{' '}
                {resultado.fecha}
              </p>

              <p>
                <strong>Aerolínea:</strong>{' '}
                {resultado.aerolinea}
              </p>

              <p>
                <strong>Número vuelo:</strong>{' '}
                {resultado.vuelo}
              </p>
            </div>
          )}
        </div>

      </div>
    </main>
  )
}