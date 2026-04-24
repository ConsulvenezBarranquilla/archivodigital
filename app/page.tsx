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
    if (!tipoDocumento || !codigo) {
      setResultado({
        error: 'Seleccione tipo de documento e ingrese número.'
      })
      return
    }

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
          error: 'Documento no encontrado.'
        })
      }
    } catch (error) {
      setResultado({
        error: 'Error consultando base de datos.'
      })
    }

    setCargando(false)
  }

  return (
    <main className="min-h-screen bg-gradient-to-b from-slate-100 to-slate-200 flex items-center justify-center p-4 md:p-8">
      <div className="w-full max-w-3xl bg-white rounded-3xl shadow-2xl border border-slate-200 p-6 md:p-10">

        {/* LOGO */}
        <div className="flex justify-center mb-5">
          <Image
            src="/logo.png"
            alt="Consulado"
            width={110}
            height={110}
            priority
          />
        </div>

        {/* TITULO */}
        <div className="flex justify-center mb-8">
          <h1 className="text-lg md:text-2xl lg:text-3xl font-bold text-slate-800 text-center leading-snug max-w-4xl px-2">
            Validador de Documentos del <br />
            Consulado General de la República Bolivariana de Venezuela <br />
            en Barranquilla
          </h1>
        </div>

        {/* FORMULARIO */}
        <div className="space-y-4">

          <select
            value={tipoDocumento}
            onChange={(e) => setTipoDocumento(e.target.value)}
            className="w-full border border-slate-300 rounded-2xl p-4 text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-700"
          >
            <option value="">Seleccione tipo de documento</option>
            <option value="viaje">Documento de Viaje</option>
            <option value="enseres">Certificados de Enseres</option>
            <option value="solteria">Carta de Soltería</option>
            <option value="registro">Registro Consular</option>
            <option value="constancia">Constancia Consular</option>
            <option value="notarial">
              Actuación Notarial (Poderes / Autorizaciones)
            </option>
          </select>

          <input
            type="text"
            value={codigo}
            onChange={(e) => setCodigo(e.target.value)}
            placeholder="Ingrese número de documento p. ej. XX/XXXX"
            className="w-full border border-slate-300 rounded-2xl p-4 focus:outline-none focus:ring-2 focus:ring-blue-700"
          />

          <button
            onClick={buscarDocumento}
            className="w-full bg-blue-800 hover:bg-blue-900 text-white font-semibold rounded-2xl p-4 transition duration-200"
          >
            {cargando ? 'Buscando...' : 'Buscar Documento'}
          </button>
        </div>

        {/* RESULTADOS */}
        {resultado && (
          <div className="mt-8 rounded-2xl border border-slate-200 bg-slate-50 p-6">

            {resultado.error ? (
              <p className="text-center text-red-600 font-semibold">
                {resultado.error}
              </p>
            ) : (
              <>
                <p className="text-center text-green-700 font-bold text-xl mb-5">
                  Documento Verificado
                </p>

                <div className="space-y-3">
                  {Object.entries(resultado.datos).map(
                    ([clave, valor], i) => (
                      <div
                        key={i}
                        className="grid grid-cols-1 md:grid-cols-3 gap-2 border-b border-slate-200 pb-3"
                      >
                        <div className="font-semibold text-slate-700 capitalize">
                          {clave}
                        </div>

                        <div className="md:col-span-2 text-slate-600 break-words">
                          {String(valor)}
                        </div>
                      </div>
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