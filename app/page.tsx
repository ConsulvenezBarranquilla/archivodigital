'use client'

import { useState } from 'react'
import Image from 'next/image'

export default function Home() {
  const [tipoDocumento, setTipoDocumento] = useState('')
  const [codigo, setCodigo] = useState('')
  const [resultado, setResultado] = useState<any>(null)
  const [cargando, setCargando] = useState(false)

  const placeholderPorTipo: Record<string, string> = {
    enseres:
      'Ingrese numero de Certificado p.e 000000-00000000',
    solteria:
      'Ingrese numero de correlativo p.e 00/0000',
    registro:
      'Ingrese numero de Registro p.e 000000',
    constancia:
      'Ingrese numero de correlativo p.e 000/0000',
    fevida:
      'Ingrese numero de correlativo p.e 000/0000',
    pasaporte:
      'Ingrese numero de cedula sin puntos o nombres completos de menores no cedulados',
    poder:
      'Ingrese los ultimos 4 digitos de la planilla de Gestión Consular p.e 0000',
    autorizacion:
      'Ingrese los ultimos 4 digitos de la planilla de Gestión Consular p.e 0000'
  }

  function cambiarTipoDocumento(tipo: string) {
    setTipoDocumento(tipo)
    setCodigo('')
    setResultado(null)
  }

  function limpiarConsulta() {
    setTipoDocumento('')
    setCodigo('')
    setResultado(null)
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
      const res = await fetch('/api/validar-documento', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          tipo: tipoDocumento,
          codigo: codigo.trim()
        })
      })

      const data = await res.json()

      if (!res.ok || !data.ok) {
        setResultado({
          error: data.error || 'Error consultando base de datos.'
        })
        return
      }

      if (!data.encontrado) {
        setResultado({
          error: 'Documento no encontrado.'
        })
        return
      }

      setResultado({
        encontrado: true,
        datos: data.datos,
        mensaje: data.mensaje,
        fechaHora: new Date().toLocaleString('es-CO', {
          year: 'numeric',
          month: '2-digit',
          day: '2-digit',
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit'
        })
      })
    } catch (error) {
      console.error(error)

      setResultado({
        error: 'Error consultando base de datos.'
      })
    } finally {
      setCargando(false)
    }
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
              onChange={(e) => cambiarTipoDocumento(e.target.value)}
              className="w-full border border-slate-300 rounded-2xl p-4 text-lg"
            >
              <option value="">
                Seleccione tipo de documento
              </option>

              <option value="enseres">
                Certificado de Uso
              </option>

              <option value="solteria">
                Carta de Soltería
              </option>

              <option value="registro">
                Registro Consular
              </option>

              <option value="constancia">
                Constancia Consular
              </option>

              <option value="fevida">
                Fe de Vida
              </option>

              <option value="pasaporte">
                Pasaporte
              </option>

              <option value="poder">
                Poder
              </option>

              <option value="autorizacion">
                Autorización de Viaje
              </option>
            </select>

            <input
              type="text"
              placeholder={
                placeholderPorTipo[tipoDocumento] ||
                'Ingrese número de documento'
              }
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

                  {/* MENSAJE */}
                  {resultado.mensaje && (
                    <div className="p-6 text-center text-slate-700 font-medium">
                      {resultado.mensaje}
                    </div>
                  )}

                  {/* DATOS */}
                  {resultado.datos && (
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

                            <div className="text-slate-700 whitespace-pre-line">
                              {String(valor)}
                            </div>
                          </div>
                        )
                      )}
                    </div>
                  )}

                  <div className="px-6 py-4 bg-white text-slate-600 text-sm">
                    Consulta realizada correctamente
                  </div>
                </>
              )}
            </div>
          )}

          {/* BOTÓN LIMPIAR */}
          {resultado && (
            <div className="mt-4 flex justify-center">
              <button
                onClick={limpiarConsulta}
                className="bg-slate-500 hover:bg-slate-600 text-white font-bold text-lg rounded-2xl px-8 py-3"
              >
                Limpiar
              </button>
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
