"use client";

import {
  useEffect,
  useState,
} from "react";
import SistemaLayout from "@/components/layout/SistemaLayout";

import { MODULOS } from "@/lib/modulos";
import ConfiguracionGeneralCard from "./components/ConfiguracionGeneralCard";
import RespaldoCard from "./components/RespaldoCard";
export default function ConfiguracionPage() {

  const [
    guardarPdfDrive,
    setGuardarPdfDrive,
  ] = useState("NO");

  const [
    cargando,
    setCargando,
  ] = useState(true);

  useEffect(() => {

    cargarConfiguracion();

}, []);

  async function cargarConfiguracion() {

    try {

      const response =
        await fetch(
          "/api/configuracion"
        );

      const data =
        await response.json();

      if (data.ok) {

        setGuardarPdfDrive(
          data.configuracion
            ?.GUARDAR_PDF_DRIVE ||
            "NO"
        );

      }

    } catch {

      alert(
        "Error cargando configuración"
      );

    } finally {

      setCargando(
        false
      );

    }

  }

  async function generarBackup() {

  const response =
    await fetch(
      "/api/backup-excel"
    );

  const blob =
    await response.blob();

  const url =
    window.URL.createObjectURL(
      blob
    );

  const a =
    document.createElement("a");

  a.href = url;

  const disposition =
    response.headers.get(
      "Content-Disposition"
    );

  const nombreArchivo =
    disposition
      ?.match(/filename="?([^"]+)"?/)?.[1] ||
    "Backup_Sistema_Consular.xlsx";

  a.download =
    nombreArchivo;

  document.body.appendChild(a);

  a.click();

  a.remove();

  window.URL.revokeObjectURL(url);

}
  async function guardarConfiguracion() {

    try {

      const response =
        await fetch(
          "/api/configuracion",
          {
            method: "POST",
            headers: {
              "Content-Type":
                "application/json",
            },
            body: JSON.stringify({
              guardarPdfDrive,
            }),
          }
        );

      const data =
        await response.json();

      if (!data.ok) {

        alert(
          data.error ||
            "Error guardando"
        );

        return;

      }

      alert(
        "Configuración guardada correctamente"
      );

    } catch {

      alert(
        "Error guardando configuración"
      );

    }

  }

  if (cargando) {

    return (
      <div>
        Cargando...
      </div>
    );

  }

  return (

    <SistemaLayout
        titulo="Configuración"
        permiso={MODULOS.CONFIGURACION}
    >

      <ConfiguracionGeneralCard
    guardarPdfDrive={guardarPdfDrive}
    setGuardarPdfDrive={setGuardarPdfDrive}
    guardarConfiguracion={guardarConfiguracion}
/>
<RespaldoCard
    generarBackup={generarBackup}
/>
</SistemaLayout>    
  );
}