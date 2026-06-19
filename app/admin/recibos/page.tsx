"use client";

import { useState } from "react";

export default function RecibosAdminPage() {

  const [
    correlativo,
    setCorrelativo,
  ] = useState("");

  const [
    recibo,
    setRecibo,
  ] = useState<any>(null);

  const [
    mensaje,
    setMensaje,
  ] = useState("");

  async function buscarRecibo() {

    setMensaje(
      "Buscando..."
    );

    setRecibo(null);

    const response =
      await fetch(
        `/api/buscar-recibo?correlativo=${correlativo}`
      );

    const data =
      await response.json();

    if (!data.ok) {

      setMensaje(
        data.mensaje
      );

      return;

    }

    setRecibo(data);

    setMensaje("");

  }
async function anularRecibo() {

  if (!recibo) return;

  const confirmar =
    confirm(
      `¿Anular recibo ${recibo.correlativo}?`
    );

  if (!confirmar) return;

  const response =
    await fetch(
      "/api/anular-recibo",
      {
        method: "POST",
        headers: {
          "Content-Type":
            "application/json",
        },
        body: JSON.stringify({
          correlativo:
            recibo.correlativo,
        }),
      }
    );

  const data =
    await response.json();

  if (!data.ok) {

    alert(
      data.error ||
      data.mensaje
    );

    return;

  }

  alert(
    "Recibo anulado correctamente"
  );

  buscarRecibo();

}
  return (
    <main
      style={{
        padding: "20px",
        maxWidth: "900px",
        margin: "0 auto",
      }}
    >

      <h1>
        Administración de Recibos
      </h1>

      <input
        type="text"
        placeholder="0001/2026"
        value={correlativo}
        onChange={(e) =>
          setCorrelativo(
            e.target.value
          )
        }
        style={{
          padding: "10px",
          width: "200px",
        }}
      />

      <button
        onClick={buscarRecibo}
        style={{
          marginLeft: "10px",
          padding: "10px 20px",
        }}
      >
        Buscar
      </button>

      <p>{mensaje}</p>

      {recibo && (

        <div
          style={{
            marginTop: "20px",
            border:
              "1px solid #ccc",
            padding: "20px",
            borderRadius: "8px",
          }}
        >

          <h2>
            Recibo
            {" "}
            {recibo.correlativo}
          </h2>

          <p>
            <strong>
              Fecha:
            </strong>
            {" "}
            {recibo.fecha}
          </p>

          <p>
            <strong>
              Documento:
            </strong>
            {" "}
            {recibo.documento}
          </p>

          <p>
            <strong>
              Nombre:
            </strong>
            {" "}
            {recibo.nombre}
          </p>

          <p>
            <strong>
              Correo:
            </strong>
            {" "}
            {recibo.correo}
          </p>

          <p>
            <strong>
              Actuaciones:
            </strong>
            {" "}
            {recibo.actuaciones}
          </p>

          <p>
            <strong>
              Total USD:
            </strong>
            {" "}
            {recibo.totalUSD}
          </p>

          <p>
            <strong>
              Usuario:
            </strong>
            {" "}
            {recibo.usuario}
          </p>

          <p>
            <strong>
              Estado:
            </strong>
            {" "}
            {recibo.estado}
          </p>

          <hr />

          <button
            style={{
              padding:
                "10px 20px",
              marginRight:
                "10px",
            }}
          >
            Reimprimir Recibo
          </button>

          <button
  onClick={anularRecibo}
  style={{
    padding:
      "10px 20px",
    background:
      "#c62828",
    color:
      "white",
    border:
      "none",
    cursor:
      "pointer",
  }}
>
  Anular Recibo
</button>

        </div>

      )}

    </main>
  );

}