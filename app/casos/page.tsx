import { redirect } from "next/navigation";
import CasosClient from "@/components/casos/CasosClient";
import { obtenerSesionEnLectura } from "@/lib/auth";
import { tienePermiso } from "@/lib/permisos";
import { MODULOS } from "@/lib/modulos";

export default async function CasosPage() {
  const sesion = await obtenerSesionEnLectura();
  if (!sesion) redirect("/ingreso");
  if (!tienePermiso(sesion.rol, MODULOS.CASOS)) redirect("/admin");
  return <CasosClient esAdmin={sesion.rol === "admin"} />;
}
