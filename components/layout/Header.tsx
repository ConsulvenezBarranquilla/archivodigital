"use client";

interface HeaderProps {

  titulo: string;

  nombre: string;

  onLogout: () => void;
  
}

export default function Header({

  titulo,

  nombre,

  onLogout,

}: HeaderProps) {

  return (

    <header>
<div className="flex justify-end">

    <button
        onClick={onLogout}
        className="
            bg-red-600
            hover:bg-red-700
            text-white
            font-semibold
            rounded-xl
            px-5
            py-2
            shadow-md
            transition
        "
    >
        Cerrar sesión
    </button>

</div>
      {/* Logo */}

      <div

        className="

          flex

          justify-center

          mb-5

        "

      >

        <img

          src="/logo.png"

          alt="Consulado"

          className="

            h-24

            w-auto

          "

        />

      </div>

      {/* Título */}

      <h1

        className="

          text-4xl

          font-bold

          text-center

          text-blue-950

        "

      >

        {titulo}

      </h1>

      {/* Bienvenida */}

      <p

        className="

          mt-4

          text-center

          text-lg

          text-gray-700

        "

      >

        Bienvenido

      </p>

      <p

        className="

          text-center

          text-xl

          font-semibold

          text-blue-950

        "

      >

        {nombre}

      </p>

      <p

        className="

          text-center

          text-sm

          text-gray-500

        "

      >
        
      </p>

      {/* Nombre institucional */}

      <p

        className="

          mt-4

          text-center

          text-gray-600

        "

      >

        Consulado General de la República Bolivariana de Venezuela

      </p>

      <p

        className="

          text-center

          font-semibold

          text-gray-700

        "

      >

        Barranquilla

      </p>

      {/* Barra tricolor */}

      <div

        className="

          flex

          justify-center

          mt-6

          mb-8

        "

      >

        <div

          className="

            flex

            w-72

            h-1.5

            rounded-full

            overflow-hidden

          "

        >

          <div className="flex-1 bg-yellow-400"/>

          <div className="flex-1 bg-blue-700"/>

          <div className="flex-1 bg-red-600"/>

        </div>

      </div>

    </header>

  );

}