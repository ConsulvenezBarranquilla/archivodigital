"use client";

import Image from "next/image";

interface HeaderProps {

    nombre: string;

    documento: string;

    fechaRegistro: string;

}

export default function Header({

    nombre,

    documento,

    fechaRegistro,

}: HeaderProps) {

    return (

        <div

            className="

                bg-blue-700

                text-white

                rounded-t-xl

                px-6

                py-5

                flex

                items-center

                justify-between

            "

        >

            <div

                className="

                    flex

                    items-center

                    gap-4

                "

            >

                <Image

                    src="/logo.png"

                    alt="Consulado"

                    width={60}

                    height={60}

                />

                <div>

                    <h2

                        className="

                            text-2xl

                            font-bold

                        "

                    >

                        Detalle del Ciudadano

                    </h2>

                    <div className="text-sm opacity-90">

                        Consulado General de la República Bolivariana de Venezuela

                    </div>

                    <div className="text-sm opacity-90">

                        Barranquilla

                    </div>

                </div>

            </div>

            <div className="text-right">

                <div

                    className="

                        text-xl

                        font-semibold

                    "

                >

                    {nombre}

                </div>

                <div>

                    Documento: {documento}

                </div>

                <div>

                    Registro: {fechaRegistro}

                </div>

            </div>

        </div>

    );

}