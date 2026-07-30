"use client";

import React from "react";

interface DataTableToolbarProps {

  titulo?: string;

  busqueda: string;

  onBusquedaChange: (

    value: string

  ) => void;

  placeholder?: string;

  children?: React.ReactNode;

}

export default function DataTableToolbar({

  titulo,

  busqueda,

  onBusquedaChange,

  placeholder = "Buscar...",

  children,

}: DataTableToolbarProps) {

  return (

    <div

      className="

        flex

        flex-col

        lg:flex-row

        lg:items-center

        lg:justify-between

        gap-4

        mb-4

      "

    >

      <div>

        {titulo && (

          <h2

            className="

              text-xl

              font-semibold

            "

          >

            {titulo}

          </h2>

        )}

      </div>

      <div

        className="

          flex

          flex-1

          justify-end

          gap-3

          items-center

        "

      >

        <input

          type="text"

          value={busqueda}

          onChange={(e) =>

            onBusquedaChange(

              e.target.value

            )

          }

          placeholder={placeholder}

          className="

            border

            rounded-lg

            px-4

            py-2

            w-full

            max-w-md

            focus:outline-none

            focus:ring-2

            focus:ring-blue-500

          "

        />

        {children}

      </div>

    </div>

  );

}