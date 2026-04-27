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

  function obtenerFechaHora() {
    const ahora = new Date()

    return ahora.toLocaleString('es-CO', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    })
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
          datos: objeto,
          fechaHora: obtenerFechaHora()
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
    <main className="min-h-screen bg-slate-200">
      <div className="max-w-5xl mx-auto px-4 py-4">

        <div className="bg-white rounded-3xl shadow-2xl p-6 md:p-10">

          {/* LOGO */}
          <div className="flex justify-center mb-5">
            <Image
              src="/logo.png"
              alt="Logo"
              width={110}
              height={110}
              priority
            />
          </div>

          {/* TITULO */}
          <h1 className="text-3xl md:text-5xl font-bold text-center text-blue-950 mb-3">
            Consulta de Documentos
          </h1>

          <p className="text-center text-slate-700 text-base md:text-2xl leading-relaxed mb-4">
            Consulado General de la República Bolivariana de Venezuela
            <br />
            en Barranquilla
          </p>

          {/* LINEA TRICOLOR */}
          <div className="flex justify-center mb-8">
            <div className="flex w-72 h-1 rounded-full overflow-hidden">
              <div className="w-1/3 bg-yellow-400"></div>
              <div className="w-1/3 bg-blue-700"></div>
              <div className="w-1/3 bg-red-600"></div>
            </div>
          </div>

          {/* FORMULARIO */}
          <div className="space-y-4">

            <select
              value={tipoDocumento}
              onChange={(e) => setTipoDocumento(e.target.value)}
              className="w-full border border-slate-300 rounded-2xl p-4 text-lg"
            >
              <option value="">Seleccione tipo de documento</option>
              <option value="viaje">Documento de Viaje</option>
              <option value="enseres">Certificado de Uso</option>
              <option value="solteria">Carta de Soltería</option>
              <option value="registro">Registro Consular</option>
              <option value="constancia">Constancia Consular</option>
              <option value="notarial">
                Actuación Notarial (Poder / Autorización de Viaje NNA)
              </option>
            </select>

            <input
              type="text"
              placeholder="Ingrese número de documento p. ej. XX/XXXX"
              value={codigo}
              onChange={(e) => setCodigo(e.target.value)}
              className="w-full border border-slate-300 rounded-2xl p-4 text-lg"
            />

            <button
              onClick={buscarDocumento}
              className="w-full bg-blue-950 hover:bg-blue-900 text-white font-bold text-xl rounded-2xl p-4"
            >
              {cargando ? 'Buscando...' : 'Buscar Documento'}
            </button>

            {/* PDF INSTRUCTIVO */}
            <div className="flex flex-col items-center pt-2">
              <a
                href="https://drive.google.com/uc?export=download&id=11SHGdn22fIc_GHvkqvtnMt2K6xYKshSX"
                target="_blank"
                rel="noopener noreferrer"
                className="flex flex-col items-center hover:opacity-80 transition"
              >
                <span className="text-3xl">📄</span>
                <span className="text-xs text-slate-600 mt-1 text-center">
                  Instructivo de Consulta de Documentos
                </span>
              </a>
            </div>

          </div>

          {/* RESULTADO */}
          {resultado && (
            <div className="mt-8 border border-green-200 bg-green-50 rounded-2xl overflow-hidden">

              {resultado.error ? (
                <div className="p-6 text-center text-red-600 font-semibold">
                  {resultado.error}
                </div>
              ) : (
                <>
                  <div className="p-5 border-b border-green-200">
                    <p className="text-center text-2xl font-bold text-green-700">
                      ✔ Documento Verificado
                    </p>

                    <p className="text-center text-sm text-slate-600 mt-2">
                      Fecha y hora de validación: {resultado.fechaHora}
                    </p>
                  </div>

                  <div className="p-6 space-y-4">
                    {Object.entries(resultado.datos).map(
                      ([clave, valor], i) => (
                        <div
                          key={i}
                          className="grid grid-cols-1 md:grid-cols-2 border-b border-slate-200 pb-3"
                        >
                          <div className="font-semibold text-blue-950 capitalize">
                            {clave}
                          </div>

                          <div className="text-slate-700">
                            {String(valor)}
                          </div>
                        </div>
                      )
                    )}
                  </div>

                  <div className="px-6 py-4 bg-white text-slate-600 text-sm">
                    Consulta realizada correctamente
                  </div>
                </>
              )}
            </div>
          )}
        </div>

        {/* FOOTER */}
        <div className="text-center text-blue-950 font-medium mt-8 text-sm md:text-base">
          Consulado General de la República Bolivariana de Venezuela en Barranquilla
        </div>

      </div>
    </main>
  )
}