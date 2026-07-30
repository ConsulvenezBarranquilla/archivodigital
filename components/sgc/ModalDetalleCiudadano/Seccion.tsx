"use client";

import React from "react";

interface SeccionProps {

  titulo: string;

  children: React.ReactNode;

}

export default function Seccion({

  titulo,

  children,

}: SeccionProps) {

  return (

    <section

      className="

        rounded-xl

        border

        border-gray-200

        bg-white

        overflow-hidden

        shadow-sm

      "

    >

      <div

        className="

          bg-blue-50

          border-l-4

          border-blue-700

          px-4

          py-3

        "

      >

        <h3

          className="

            text-blue-800

            font-semibold

            uppercase

            tracking-wide

            text-sm

          "

        >

          {titulo}

        </h3>

      </div>

      <div

        className="

          p-5

          grid

          grid-cols-1

          md:grid-cols-2

          gap-4

        "

      >

        {children}

      </div>

    </section>

  );

}