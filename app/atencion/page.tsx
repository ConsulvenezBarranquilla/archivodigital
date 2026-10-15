import { redirect } from "next/navigation";
import SistemaLayout from "@/components/layout/SistemaLayout";
import TurnosWidget from "@/components/turnero/TurnosWidget";
import { obtenerSesionEnLectura } from "@/lib/auth";
import { tienePermiso } from "@/lib/permisos";
import { MODULOS } from "@/lib/modulos";

export default async function AtencionPage() {
  const sesion = await obtenerSesionEnLectura();
  if (!sesion) redirect("/ingreso");
  if (!tienePermiso(sesion.rol, MODULOS.ATENCION)) redirect("/admin");
  return <SistemaLayout titulo="Atención" permiso={MODULOS.ATENCION}>
    <main className="space-y-5 rounded-2xl bg-white p-5 shadow-sm md:p-8">
      <header><h1 className="text-2xl font-bold text-blue-950">Atención Consular</h1><p className="mt-1 text-slate-600">Cola compartida de actuaciones asignadas a los analistas, en orden de llegada.</p></header>
      <section className="rounded-xl border border-slate-200 bg-slate-50 p-5"><h2 className="font-bold text-blue-950">Atenciones por actuación</h2><p className="mt-1 text-sm text-slate-600">Cada actuación de un recibo se administra como una atención independiente. Puede llamarse o marcarse atendida sin llamada previa.</p><div className="mt-4"><TurnosWidget titulo="Atenciones pendientes" cola="analistas" /></div></section>
    </main>
  </SistemaLayout>;
}
