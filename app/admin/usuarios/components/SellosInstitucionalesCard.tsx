"use client";

import {
  useEffect,
  useRef,
  useState,
} from "react";

interface SelloInstitucional {
  idSello: string;
  nombreSello: string;
  archivoSello: string;
  archivoSelloDriveId: string;
  activo: string;
  fechaCreacion: string;
}

interface Props {
  mostrar: boolean;
  onCerrar: () => void;
}

export default function SellosInstitucionalesCard({
  mostrar,
  onCerrar,
}: Props) {

  const [
    sellos,
    setSellos,
  ] = useState<SelloInstitucional[]>([]);

  const [
    cargando,
    setCargando,
  ] = useState(false);

  const [
    guardando,
    setGuardando,
  ] = useState(false);

  const [
    nombreSello,
    setNombreSello,
  ] = useState("");

  const [
    archivo,
    setArchivo,
  ] = useState<File | null>(null);

  const [
    vistaPrevia,
    setVistaPrevia,
  ] = useState<string | null>(null);

  const inputArchivo =
    useRef<HTMLInputElement>(null);

  /*------------------------------------------
  CARGAR SELLOS
  ------------------------------------------*/

  async function cargarSellos() {

    try {

      setCargando(true);

      const response =
        await fetch(
          "/api/sellos",
          {
            credentials:
              "include",
          }
        );

      const data =
        await response.json();

      if (
        !response.ok ||
        !data.ok
      ) {

        alert(
          data.error ||
          "No fue posible cargar los sellos."
        );

        return;
      }

      setSellos(
        data.sellos || []
      );

    } catch (error) {

      console.error(
        "Error cargando sellos:",
        error
      );

      alert(
        "No fue posible comunicarse con el servidor."
      );

    } finally {

      setCargando(false);
    }
  }

  /*------------------------------------------
  CARGAR AL ABRIR
  ------------------------------------------*/

  useEffect(() => {

    if (!mostrar) {
      return;
    }

    cargarSellos();

    setNombreSello("");
    setArchivo(null);
    setVistaPrevia(null);

    if (
      inputArchivo.current
    ) {
      inputArchivo.current.value =
        "";
    }

  }, [mostrar]);

  /*------------------------------------------
  SELECCIONAR ARCHIVO
  ------------------------------------------*/

  function seleccionarArchivo(
    file: File | null
  ) {

    setArchivo(file);

    if (vistaPrevia) {

      URL.revokeObjectURL(
        vistaPrevia
      );
    }

    if (!file) {

      setVistaPrevia(null);

      return;
    }

    if (
      !file.type.startsWith(
        "image/"
      )
    ) {

      setVistaPrevia(null);

      return;
    }

    const url =
      URL.createObjectURL(
        file
      );

    setVistaPrevia(url);
  }

  /*------------------------------------------
  CREAR SELLO
  ------------------------------------------*/

  async function crearNuevoSello() {

    if (
      !nombreSello.trim()
    ) {

      alert(
        "Debe indicar un nombre para el sello."
      );

      return;
    }

    if (!archivo) {

      alert(
        "Debe seleccionar la imagen del sello."
      );

      return;
    }

    try {

      setGuardando(true);

      const formData =
        new FormData();

      formData.append(
        "nombreSello",
        nombreSello.trim()
      );

      formData.append(
        "archivo",
        archivo
      );

      const response =
        await fetch(
          "/api/sellos",
          {
            method: "POST",
            credentials:
              "include",
            body:
              formData,
          }
        );

      const data =
        await response.json();

      if (
        !response.ok ||
        !data.ok
      ) {

        alert(
          data.error ||
          "No fue posible guardar el sello."
        );

        return;
      }

      alert(
        "Sello creado correctamente."
      );

      setNombreSello("");
      setArchivo(null);
      setVistaPrevia(null);

      if (
        inputArchivo.current
      ) {

        inputArchivo.current.value =
          "";
      }

      await cargarSellos();

    } catch (error) {

      console.error(
        "Error creando sello:",
        error
      );

      alert(
        "No fue posible comunicarse con el servidor."
      );

    } finally {

      setGuardando(false);
    }
  }

  /*------------------------------------------
  ACTIVAR / DESACTIVAR
  ------------------------------------------*/

  async function cambiarEstado(
    sello: SelloInstitucional
  ) {

    const nuevoEstado =
      sello.activo === "SI"
        ? "NO"
        : "SI";

    const accion =
      nuevoEstado === "SI"
        ? "activar"
        : "desactivar";

    const confirmar =
      window.confirm(
        `¿Desea ${accion} el sello "${sello.nombreSello}"?`
      );

    if (!confirmar) {
      return;
    }

    try {

      const response =
        await fetch(
          "/api/sellos",
          {
            method: "PUT",
            credentials:
              "include",
            headers: {
              "Content-Type":
                "application/json",
            },
            body:
              JSON.stringify({
                idSello:
                  sello.idSello,
                activo:
                  nuevoEstado,
              }),
          }
        );

      const data =
        await response.json();

      if (
        !response.ok ||
        !data.ok
      ) {

        alert(
          data.error ||
          "No fue posible actualizar el sello."
        );

        return;
      }

      await cargarSellos();

    } catch (error) {

      console.error(
        "Error cambiando estado:",
        error
      );

      alert(
        "No fue posible comunicarse con el servidor."
      );
    }
  }

  /*------------------------------------------
  ELIMINAR
  ------------------------------------------*/

  async function eliminar(
    sello: SelloInstitucional
  ) {

    const confirmar =
      window.confirm(
        `¿Está seguro de eliminar el sello "${sello.nombreSello}"?\n\nEsta acción eliminará también el archivo de Google Drive.`
      );

    if (!confirmar) {
      return;
    }

    try {

      const response =
        await fetch(
          "/api/sellos",
          {
            method: "DELETE",
            credentials:
              "include",
            headers: {
              "Content-Type":
                "application/json",
            },
            body:
              JSON.stringify({
                idSello:
                  sello.idSello,
              }),
          }
        );

      const data =
        await response.json();

      if (
        !response.ok ||
        !data.ok
      ) {

        alert(
          data.error ||
          "No fue posible eliminar el sello."
        );

        return;
      }

      alert(
        "Sello eliminado correctamente."
      );

      await cargarSellos();

    } catch (error) {

      console.error(
        "Error eliminando sello:",
        error
      );

      alert(
        "No fue posible comunicarse con el servidor."
      );
    }
  }

  if (!mostrar) {
    return null;
  }

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        background:
          "rgba(15, 23, 42, 0.55)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 1000,
        padding: "20px",
      }}
    >

      <div
        style={{
          background: "white",
          borderRadius: "14px",
          width: "100%",
          maxWidth: "850px",
          maxHeight: "90vh",
          overflowY: "auto",
          boxShadow:
            "0 20px 50px rgba(0,0,0,0.25)",
        }}
      >

        {/*------------------------------------
        ENCABEZADO
        ------------------------------------*/}

        <div
          style={{
            padding: "20px 24px",
            borderBottom:
              "1px solid #e2e8f0",
            display: "flex",
            justifyContent:
              "space-between",
            alignItems: "center",
          }}
        >

          <div>

            <h2
              style={{
                margin: 0,
                color: "#172554",
                fontSize: "22px",
                fontWeight: 700,
              }}
            >
              Sellos Institucionales
            </h2>

            <p
              style={{
                margin:
                  "5px 0 0",
                color: "#64748b",
                fontSize: "14px",
              }}
            >
              Administre los sellos utilizados
              en documentos consulares.
            </p>

          </div>

          <button
            type="button"
            onClick={onCerrar}
            style={{
              border: "none",
              background:
                "#e2e8f0",
              color: "#334155",
              width: "36px",
              height: "36px",
              borderRadius: "50%",
              fontSize: "20px",
              cursor: "pointer",
            }}
          >
            ×
          </button>

        </div>

        {/*------------------------------------
        NUEVO SELLO
        ------------------------------------*/}

        <div
          style={{
            margin: "20px 24px",
            padding: "20px",
            background:
              "#f8fafc",
            border:
              "1px solid #e2e8f0",
            borderRadius: "12px",
          }}
        >

          <h3
            style={{
              margin:
                "0 0 15px",
              color: "#172554",
              fontSize: "17px",
              fontWeight: 700,
            }}
          >
            Agregar nuevo sello
          </h3>

          <div
            style={{
              display: "grid",
              gridTemplateColumns:
                "1fr 1fr",
              gap: "15px",
            }}
          >

            <div>

              <label
                style={{
                  display: "block",
                  marginBottom: "6px",
                  fontSize: "14px",
                  fontWeight: 600,
                  color: "#334155",
                }}
              >
                Nombre del sello
              </label>

              <input
                type="text"
                value={
                  nombreSello
                }
                onChange={(e) =>
                  setNombreSello(
                    e.target.value
                  )
                }
                placeholder="Ej. Sello húmedo institucional"
                style={{
                  width: "100%",
                  padding:
                    "10px 12px",
                  border:
                    "1px solid #cbd5e1",
                  borderRadius: "8px",
                  outline: "none",
                }}
              />

            </div>

            <div>

              <label
                style={{
                  display: "block",
                  marginBottom: "6px",
                  fontSize: "14px",
                  fontWeight: 600,
                  color: "#334155",
                }}
              >
                Imagen del sello
              </label>

              <input
                ref={
                  inputArchivo
                }
                type="file"
                accept=".png,.jpg,.jpeg,.webp,image/png,image/jpeg,image/webp"
                onChange={(e) =>
                  seleccionarArchivo(
                    e.target.files?.[0] ||
                      null
                  )
                }
                style={{
                  width: "100%",
                  padding: "7px",
                  border:
                    "1px solid #cbd5e1",
                  borderRadius: "8px",
                  background:
                    "white",
                }}
              />

            </div>

          </div>

          {vistaPrevia && (

            <div
              style={{
                marginTop: "15px",
              }}
            >

              <div
                style={{
                  fontSize: "13px",
                  fontWeight: 600,
                  color: "#475569",
                  marginBottom:
                    "6px",
                }}
              >
                Vista previa
              </div>

              <div
                style={{
                  background:
                    "white",
                  border:
                    "1px solid #cbd5e1",
                  borderRadius: "8px",
                  padding: "15px",
                  display:
                    "inline-block",
                }}
              >

                <img
                  src={
                    vistaPrevia
                  }
                  alt="Vista previa del sello"
                  style={{
                    maxWidth:
                      "280px",
                    maxHeight:
                      "180px",
                    objectFit:
                      "contain",
                  }}
                />

              </div>

            </div>
          )}

          <div
            style={{
              marginTop: "15px",
              display: "flex",
              justifyContent:
                "flex-end",
            }}
          >

            <button
              type="button"
              onClick={
                crearNuevoSello
              }
              disabled={
                guardando
              }
              style={{
                padding:
                  "10px 18px",
                border: "none",
                borderRadius: "8px",
                background:
                  guardando
                    ? "#94a3b8"
                    : "#008c45",
                color: "white",
                fontWeight: 600,
                cursor:
                  guardando
                    ? "not-allowed"
                    : "pointer",
              }}
            >
              {guardando
                ? "Guardando..."
                : "＋ Guardar sello"}
            </button>

          </div>

        </div>

        {/*------------------------------------
        SELLOS EXISTENTES
        ------------------------------------*/}

        <div
          style={{
            padding:
              "0 24px 24px",
          }}
        >

          <h3
            style={{
              color: "#172554",
              fontSize: "17px",
              fontWeight: 700,
              margin:
                "10px 0 15px",
            }}
          >
            Sellos registrados
          </h3>

          {cargando ? (

            <div
              style={{
                padding: "30px",
                textAlign:
                  "center",
                color: "#64748b",
              }}
            >
              Cargando sellos...
            </div>

          ) : sellos.length === 0 ? (

            <div
              style={{
                padding: "25px",
                textAlign:
                  "center",
                background:
                  "#f8fafc",
                border:
                  "1px solid #e2e8f0",
                borderRadius: "10px",
                color: "#64748b",
              }}
            >
              No hay sellos registrados.
            </div>

          ) : (

            <div
              style={{
                display: "grid",
                gap: "12px",
              }}
            >

              {sellos.map(
                (sello) => (

                  <div
                    key={
                      sello.idSello
                    }
                    style={{
                      border:
                        "1px solid #e2e8f0",
                      borderRadius:
                        "10px",
                      padding:
                        "15px",
                      display: "flex",
                      alignItems:
                        "center",
                      justifyContent:
                        "space-between",
                      gap: "15px",
                    }}
                  >

                    <div
                      style={{
                        minWidth: 0,
                        flex: 1,
                      }}
                    >

                      <div
                        style={{
                          fontWeight:
                            700,
                          color:
                            "#172554",
                        }}
                      >
                        {
                          sello.nombreSello
                        }
                      </div>

                      <div
                        style={{
                          marginTop:
                            "4px",
                          fontSize:
                            "12px",
                          color:
                            "#64748b",
                        }}
                      >
                        ID:{" "}
                        {
                          sello.idSello
                        }
                      </div>

                      <div
                        style={{
                          marginTop:
                            "3px",
                          fontSize:
                            "12px",
                          color:
                            "#64748b",
                        }}
                      >
                        Archivo:{" "}
                        {
                          sello.archivoSello
                        }
                      </div>

                    </div>

                    <div
                      style={{
                        display:
                          "flex",
                        alignItems:
                          "center",
                        gap: "8px",
                        flexWrap:
                          "wrap",
                        justifyContent:
                          "flex-end",
                      }}
                    >

                      <span
                        style={{
                          padding:
                            "5px 9px",
                          borderRadius:
                            "999px",
                          fontSize:
                            "12px",
                          fontWeight: 700,
                          background:
                            sello.activo ===
                            "SI"
                              ? "#dcfce7"
                              : "#fee2e2",
                          color:
                            sello.activo ===
                            "SI"
                              ? "#166534"
                              : "#991b1b",
                        }}
                      >
                        {
                          sello.activo ===
                          "SI"
                            ? "ACTIVO"
                            : "INACTIVO"
                        }
                      </span>

                      <button
                        type="button"
                        onClick={() =>
                          cambiarEstado(
                            sello
                          )
                        }
                        style={{
                          padding:
                            "7px 11px",
                          border:
                            "1px solid #cbd5e1",
                          borderRadius:
                            "7px",
                          background:
                            "white",
                          color:
                            "#334155",
                          cursor:
                            "pointer",
                          fontSize:
                            "12px",
                          fontWeight:
                            600,
                        }}
                      >
                        {
                          sello.activo ===
                          "SI"
                            ? "Desactivar"
                            : "Activar"
                        }
                      </button>

                      <button
                        type="button"
                        onClick={() =>
                          eliminar(
                            sello
                          )
                        }
                        style={{
                          padding:
                            "7px 11px",
                          border:
                            "1px solid #fecaca",
                          borderRadius:
                            "7px",
                          background:
                            "#fef2f2",
                          color:
                            "#b91c1c",
                          cursor:
                            "pointer",
                          fontSize:
                            "12px",
                          fontWeight:
                            600,
                        }}
                      >
                        Eliminar
                      </button>

                    </div>

                  </div>
                )
              )}

            </div>
          )}

        </div>

      </div>

    </div>
  );
}