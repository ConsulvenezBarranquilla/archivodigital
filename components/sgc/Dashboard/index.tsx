"use client";

import {

  Clock,

  FileText,

  FolderOpen,

  Link2,

  ClipboardList,

} from "lucide-react";
import { ReactNode } from "react";
import DashboardCard, {
  type DashboardCardColor,
} from "@/components/dashboard/DashboardCard";
import DashboardGrid from "@/components/dashboard/DashboardGrid";

import {

  EstadisticasSGC,

} from "@/types/GestionConsular";

interface DashboardProps {

  estadisticas: EstadisticasSGC;

}
interface DashboardItem {
  titulo: string;
  valor: number;
  color: DashboardCardColor;
  icono: ReactNode;
}
export default function Dashboard({

  estadisticas,

}: DashboardProps) {

  const cards: DashboardItem[] = [

  {

    titulo: "Actuaciones",

    valor: estadisticas.totalActuaciones,

    color: "blue",

    icono: <FileText size={22} />,

  },

  {

    titulo: "Pendientes",

    valor: estadisticas.pendientes,

    color: "yellow",

    icono: <Clock size={22} />,

  },

  {

    titulo: "Vinculadas",

    valor: estadisticas.vinculadas,

    color: "green",

    icono: <Link2 size={22} />,

  },
 {
    titulo: "Sin Planilla",
    valor: estadisticas.sinPlanilla,
    color: "red",
    icono: <ClipboardList size={22} />,
  },
  {

    titulo: "Planillas GC",

    valor: estadisticas.planillas,

    color: "purple",

    icono: <FolderOpen size={22} />,

  },

];

  return (

    <DashboardGrid>

      {cards.map((card) => (

  <DashboardCard

    key={card.titulo}

    titulo={card.titulo}

    valor={card.valor}

    color={card.color}

    icono={card.icono}

  />

))}

    </DashboardGrid>

  );

}