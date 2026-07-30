"use client";

import { ReactNode } from "react";

export type DashboardCardColor =
  | "blue"
  | "green"
  | "orange"
  | "yellow"
  | "red"
  | "purple";

interface DashboardCardProps {

  titulo: string;

  valor: number | string;

  color?:
    | "blue"
    | "green"
    | "orange"
    | "yellow"
    | "red"
    | "purple";

  icono?: ReactNode;

  children?: ReactNode;

}

const colores: Record<
  DashboardCardColor,
  {
    borde: string;
    texto: string;
  }
> = {

  blue: {

    borde: "border-blue-700",

    texto: "text-blue-700",

  },
yellow: {

    borde: "border-yellow-500",

    texto: "text-yellow-600",

},
  green: {

    borde: "border-green-600",

    texto: "text-green-600",

  },

  orange: {

    borde: "border-orange-500",

    texto: "text-orange-500",

  },

  red: {

    borde: "border-red-600",

    texto: "text-red-600",

  },

  purple: {

    borde: "border-purple-600",

    texto: "text-purple-600",

  },

};

export default function DashboardCard({

  titulo,

  valor,

  color = "blue",

  icono,

  children,

}: DashboardCardProps) {

  const estilo =

    colores[color];

  return (

    <div

      className={`

        bg-slate-50

        rounded-2xl

        shadow-md

        border-l-4

        ${estilo.borde}

        p-6

        transition-all

        duration-200

        hover:shadow-lg

        hover:-translate-y-1

      `}

    >

      <div

    className="

        flex

        items-center

        justify-between

    "

>

    <h3

        className="

            text-sm

            font-medium

            tracking-wide

            text-gray-600

        "

    >

        {titulo}

    </h3>

    {

        icono && (

            <div

                className={`

                    ${estilo.texto}

                `}

            >

                {icono}

            </div>

        )

    }

</div>

      <div

        className={`

          mt-4

          text-4xl

          font-bold

          ${estilo.texto}

        `}

      >

        {valor}

      </div>

      {

        children && (

          <div

            className="

              mt-4

              text-sm

              text-gray-600

            "

          >

            {children}

          </div>

        )

      }

    </div>

  );

}