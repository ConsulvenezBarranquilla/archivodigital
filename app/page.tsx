'use client'

import { useState } from 'react'

export default function Home() {
  const [tipoDocumento, setTipoDocumento] = useState('')
  const [codigo, setCodigo] = useState('')
  const [resultado, setResultado] = useState<any>(null)
  const [cargando, setCargando] = useState(false)

  const hojas: any = {
    viaje:
      'https://docs.google.com/spreadsheets/d/e/2PACX-1vRkkTarkCdW1Iy0MN1PfG3ZetMrPAlgGH5aIH7tYYcLYqlVjwB0ePNp33yIrZ5WWX4x9cIyZc6HGK4e/pub?output=csv',

    enseres:
      'https://docs.google.com/spreadsheets/d/e/2PACX-1vTSK5nMNWj_CoeVR7-HmNKlsjlckfs1Y6JR1eAbEzJEXn8B9CXmZZqrbbp9nu6BgmTZe-xPJ6gN2nNA/pub?output=csv',

    solteria:
      'https://docs.google.com/spreadsheets/d/e/2PACX-1vTaH26wNEDdp8aPxopHOjGzP26jjq-smL2MeaDfQFiZ-LOiQpnH-UEPl5iuk5y4Ut7kKaza1jS7jLuv/pub?output=csv',

    registro:
      'https://docs.google.com/spreadsheets/d/e/2PACX-1vToHq90AEjPQXsOs3sxTmT3DK7ZtRKJh6uNv0L1ungd-lFAj4TS5l_Z3oRxT5usExlDQXmrdYpLp1fm/pub?output=csv',

    constancia:
      'https://docs.google.com/spreadsheets/d/e/2PACX-1vQ8uKGMH_Nfwkkl3uRQQegzLs5xygoIctgFjsu004akpinfBdfo9Thczw6lCPttcwcYz9wyUE-mdlEM/pub?output=csv',

    notarial:
      'https://docs.google.com/spreadsheets/d/e/2PACX-1vTvUgpdQIdHzI09BDg5m0sBgKZKckGxtqx2N__sKvDmMxIRzANZ_fS7SFj3hsK6keulj4-3UMD_GUYK/pub?output=csv'
  }

  async function buscarDocumento() {
    if (!tipoDocumento || !codigo) return

    setCargando(true)
    setResultado(null)

    try {
      const res = await fetch(hojas[tipoDocumento])
      const texto = await res.text()

      const filas = texto.split('\n').map((fila) => fila.split(','))

      const encontrado = filas.find(
        (fila) =>
          fila[0]?.trim().toLowerCase() === codigo.trim().toLowerCase()
      )

      if (encontrado) {
        setResultado({
          encontrado: true,
          datos: encontrado
        })
      } else {
        setResultado({
          error: 'Documento no encontrado'
        })
      }
    } catch (error) {
      setResultado({
        error: 'Error consultando base de datos'
      })
    }

    setCargando(false)
  }

  return (
    <main className="min-h-screen bg-gray-100 flex items-center justify-center p-6">
      <div className="bg-white rounded-2xl shadow-xl p-8 w-full max-w-xl">
        <h1 className="text-3xl font-bold text-center mb-6">
          ArchivoDigital
        </h1>

        <select
          value={tipoDocumento}
          onChange={(e) => setTipoDocumento(e.target.value)}
          className="w-full border p-3 rounded-xl mb-4"
        >
          <option value="">Seleccione tipo de documento</option>
          <option value="viaje">Documento de Viaje</option>
          <option value="enseres">Certificados de Enseres</option>
          <option value="solteria">Carta de Soltería</option>
          <option value="registro">Registro Consular</option>
          <option value="constancia">Constancia Consular</option>
          <option value="notarial">Actuación Notarial</option>
        </select>

        <input
          type="text"
          placeholder="Ingrese número de documento"
          value={codigo}
          onChange={(e) => setCodigo(e.target.value)}
          className="w-full border p-3 rounded-xl mb-4"
        />

        <button
          onClick={buscarDocumento}
          className="w-full bg-blue-600 text-white p-3 rounded-xl"
        >
          {cargando ? 'Buscando...' : 'Buscar Documento'}
        </button>

        {resultado && (
          <div className="mt-6 p-4 border rounded-xl">
            {resultado.error ? (
              <p className="text-red-600">{resultado.error}</p>
            ) : (
              <div>
                <p className="font-semibold text-green-700 mb-2">
                  Documento encontrado
                </p>
                {resultado.datos.map((item: string, i: number) => (
                  <p key={i}>{item}</p>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </main>
  )
}