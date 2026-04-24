'use client'

import { useState } from 'react'
import Image from 'next/image'

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

      const filas = texto
        .trim()
        .split('\n')
        .map((fila) => fila.split(','))

      const encabezados = filas[0]

      const encontrado = filas.find(
        (fila, index) =>
          index > 0 &&
          fila[0]?.trim().toLowerCase() === codigo.trim().toLowerCase()
      )

      if (encontrado) {
        const objeto: any = {}

        encabezados.forEach((titulo, i) => {
          objeto[titulo.trim()] = encontrado[i]?.trim()
        })

        setResultado({
          encontrado: true,
          datos: objeto
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
    <main className="min-h-screen bg-slate-100 flex items-center justify-center p-6">
      <div className="bg-white shadow-2xl rounded-3xl p-8 w-full max-w-2xl">

        {/* LOGO */}
        <div className="flex justify-center mb-4">
          <Image
            src="/logo.png"
            alt="ArchivoDigital"
            width={110}
            height={110}
            priority
          />
        </div>

        {/* TITULO */}
        <h1 className="text-4xl font-bold text-center text-slate-800 mb-2">
          Validador de Documentos Consulado General de la República Bolivariana de Venezuela en Barranquilla
        </h1>

        <p className="text-center text-slate-500 mb-8">
          Verificación digital de documentos
        </p>

        {/* SELECT */}
        <select
          value={tipoDocumento}
          onChange={(e) => setTipoDocumento(e.target.value)}
          className="w-full border border-slate-300 p-4 rounded-2xl mb-4 text-slate-700"
        >
          <option value="">Seleccione tipo de documento</option>
          <option value="viaje">Documento de Viaje</option>
          <option value="enseres">Certificados de Enseres</option>
          <option value="solteria">Carta de Soltería</option>
          <option value="registro">Registro Consular</option>
          <option value="constancia">Constancia Consular</option>
          <option value="notarial">Actuación Notarial</option>
        </select>

        {/* INPUT */}
        <input
          type="text"
          placeholder="Ingrese número de documento p. ej. XX/XXXX"
          value={codigo}
          onChange={(e) => setCodigo(e.target.value)}
          className="w-full border border-slate-300 p-4 rounded-2xl mb-4"
        />

        {/* BOTON */}
        <button
          onClick={buscarDocumento}
          className="w-full bg-blue-700 hover:bg-blue-800 text-white font-semibold p-4 rounded-2xl transition"
        >
          {cargando ? 'Buscando...' : 'Buscar Documento'}
        </button>

        {/* RESULTADO */}
        {resultado && (
          <div className="mt-8 border border-slate-200 rounded-2xl p-6 bg-slate-50">
            {resultado.error ? (
              <p className="text-red-600 font-medium text-center">
                {resultado.error}
              </p>
            ) : (
              <>
                <p className="text-green-700 font-bold text-lg mb-4 text-center">
                  Documento Verificado
                </p>

                <div className="space-y-2">
                  {Object.entries(resultado.datos).map(
                    ([clave, valor], i) => (
                      <p
                        key={i}
                        className="border-b border-slate-200 pb-2"
                      >
                        <span className="font-semibold text-slate-700 capitalize">
                          {clave}:
                        </span>{' '}
                        <span className="text-slate-600">
                          {String(valor)}
                        </span>
                      </p>
                    )
                  )}
                </div>
              </>
            )}
          </div>
        )}
      </div>
    </main>
  )
}