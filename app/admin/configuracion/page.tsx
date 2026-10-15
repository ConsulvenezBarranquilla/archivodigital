"use client";

import {
  useEffect,
  useState,
} from "react";
import SistemaLayout from "@/components/layout/SistemaLayout";

import { MODULOS } from "@/lib/modulos";
import ConfiguracionGeneralCard from "./components/ConfiguracionGeneralCard";
import RespaldoCard from "./components/RespaldoCard";
import TurneroDevicesCard from "./components/TurneroDevicesCard";
export default function ConfiguracionPage() {

  const [
    guardarPdfDrive,
    setGuardarPdfDrive,
  ] = useState("NO");

  const [
    cargando,
    setCargando,
  ] = useState(true);
  const [guardandoRespaldo, setGuardandoRespaldo] = useState(false);
  const [mensajeRespaldo, setMensajeRespaldo] = useState("");

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
    try {
      setGuardandoRespaldo(true);
      setMensajeRespaldo("");
      const response = await fetch("/api/backup-excel", {
        method: "POST",
        credentials: "include",
      });
      if (!response.ok) {
        const data = await response.json().catch(() => null);
        throw new Error(data?.error || "No fue posible guardar el respaldo.");
      }
      const archivoZip = await response.blob();
      const url = window.URL.createObjectURL(archivoZip);
      const enlace = document.createElement("a");
      const disposition = response.headers.get("Content-Disposition");
      enlace.href = url;
      enlace.download = disposition?.match(/filename="?([^\"]+)"?/)?.[1]
        || "Backup_Sistema_Consular.zip";
      document.body.appendChild(enlace);
      enlace.click();
      enlace.remove();
      window.setTimeout(() => window.URL.revokeObjectURL(url), 1000);
      setMensajeRespaldo("Los dos libros se guardaron en Google Drive y se descargó una copia local en esta computadora.");
    } catch (error) {
      setMensajeRespaldo(
        error instanceof Error ? error.message : "No fue posible guardar el respaldo."
      );
    } finally {
      setGuardandoRespaldo(false);
    }
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
    guardando={guardandoRespaldo}
    mensaje={mensajeRespaldo}
/>
<TurneroDevicesCard />
</SistemaLayout>    
  );
}
