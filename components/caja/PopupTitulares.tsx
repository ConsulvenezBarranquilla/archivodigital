"use client";

import { useState, useEffect } from "react";

interface Props {

    abierto: boolean;

    ciudadano: {
        nombreCompleto: string;
    };

    cantidadPasaportesAdulto: number;

cantidadPasaportesNNA: number;

    cantidadApostillas: number;

    cantidadVisas: number;

    datosIniciales: {

    tipo: "PASAPORTE" | "APOSTILLA" | "VISA";

    titular: string;

    pasaporte?: string;

    mismaPersona?: boolean;

    esNNA?: boolean;

    tieneObservacion?: boolean;

    observacion?: string;

}[];

    onCancelar: () => void;

    onAceptar: (
    datos: {
        tipo: "PASAPORTE" | "APOSTILLA" | "VISA";
        titular: string;
        pasaporte?: string;
        mismaPersona?: boolean;
        esNNA?: boolean;
        tieneObservacion?: boolean;
        observacion?: string;
    }[]
) => void;

}

export default function PopupTitulares({

    abierto,

    ciudadano,

    cantidadPasaportesAdulto,

    cantidadPasaportesNNA,

    cantidadApostillas,

    cantidadVisas,

    datosIniciales,

    onCancelar,

    onAceptar,

}: Props) {

    const [datos, setDatos] = useState<
{
    tipo: "PASAPORTE" | "APOSTILLA" | "VISA";
    titular: string;
    pasaporte?: string;
    mismaPersona?: boolean;
    esNNA?: boolean;
    tieneObservacion?: boolean;
    observacion?: string;
}[]
>([]);

    useEffect(() => {

    if (!abierto) return;

    if (datosIniciales.length > 0) {

        setDatos(datosIniciales);

        return;

    }

    const nuevos: {
    tipo: "PASAPORTE" | "APOSTILLA" | "VISA";
    titular: string;
    pasaporte?: string;
    mismaPersona?: boolean;
    esNNA?: boolean;
    tieneObservacion?: boolean;
    observacion?: string;
}[] = [];

    for (let i = 0; i < cantidadPasaportesAdulto; i++) {

    nuevos.push({

        tipo: "PASAPORTE",

        esNNA: false,

        titular: "",

        tieneObservacion: false,

        observacion: "",

    });

}

for (let i = 0; i < cantidadPasaportesNNA; i++) {

    nuevos.push({

        tipo: "PASAPORTE",

        esNNA: true,

        titular: "",

        tieneObservacion: false,

        observacion: "",

    });

} 

    for (let i = 0; i < cantidadApostillas; i++) {

        nuevos.push({

            tipo: "APOSTILLA",

            titular: "",

        });

    }

    for (let i = 0; i < cantidadVisas; i++) {

        nuevos.push({

            tipo: "VISA",

            titular: "",

            pasaporte: "",

            mismaPersona: true,

        });

    }

    setDatos(nuevos);

}, [

    abierto,

    datosIniciales,

    cantidadPasaportesAdulto,

cantidadPasaportesNNA,

    cantidadApostillas,

    cantidadVisas,

]);

    if (!abierto) {

        return null;

    }

    function validar() {

    for (let i = 0; i < datos.length; i++) {

        const item = datos[i];

        // Solo Apostillas NNA y Pasaportes NNA requieren nombre
        if (

            (
                item.tipo === "APOSTILLA" ||

                (item.tipo === "PASAPORTE" && item.esNNA)

            )

            &&

            !item.titular.trim()

        ) {

            alert(

                `Debe indicar el nombre del titular de la actuación #${i + 1}.`

            );

            return;

        }

        // Solo Visa de otra persona requiere nombre y pasaporte
        if (

            item.tipo === "VISA" &&

            !item.mismaPersona

        ) {

            if (!item.titular.trim()) {

                alert(

                    `Debe indicar el titular de la Visa #${i + 1}.`

                );

                return;

            }

            if (!item.pasaporte?.trim()) {

                alert(

                    `Debe indicar el pasaporte del titular de la Visa #${i + 1}.`

                );

                return;

            }

        }

    }

    onAceptar(datos);

}
function primerNombreApellido(nombre: string) {

    const partes = nombre
        .trim()
        .split(/\s+/);

    if (partes.length <= 2) {

        return nombre;

    }

    return `${partes[0]} ${partes[2]}`;
}
    return (

    <div
    className="
        fixed
        inset-0
        bg-black/50
        flex
        items-center
        justify-center
        z-[200]
        p-6
    "
>

        <div
    className="
        bg-white
        rounded-3xl
        shadow-2xl
        w-full
        max-w-2xl
        max-h-[90vh]
        overflow-y-auto
        p-8
    "
>

            <h2 className="text-2xl font-bold text-blue-950 mb-6">

                Información adicional de su trámite

            </h2>

            <div className="space-y-6">

    {(() => {

        let contadorPasaporteAdulto = 0;
        let contadorPasaporteNNA = 0;
        let contadorApostilla = 0;
        let contadorVisa = 0;

        return datos.map((item, index) => {

            let titulo = "";

            if (item.tipo === "PASAPORTE") {

                if (item.esNNA) {

                    contadorPasaporteNNA++;

                    titulo =
                        `Pasaporte Niño #${contadorPasaporteNNA}`;

                } else {

                    contadorPasaporteAdulto++;

                    titulo =
                        `Pasaporte Titular (${primerNombreApellido(ciudadano.nombreCompleto)})`;

                }

            }

            else if (item.tipo === "APOSTILLA") {

                contadorApostilla++;

                titulo =
                    `Apostilla Niño #${contadorApostilla}`;

            }

            else {

                contadorVisa++;

                titulo =
                    `Visa #${contadorVisa}`;

            }

            return (

                <div
                    key={index}
                    className="border rounded-2xl p-5 bg-slate-50"
                >
                       
                        <h3 className="font-bold text-blue-900 mb-4">
    {titulo}
</h3>

                        {(item.tipo === "APOSTILLA" ||
                            (item.tipo === "PASAPORTE" && item.esNNA)) && (

                            <input
                                className="w-full border rounded-xl p-3"
                                placeholder="Nombre completo del titular"
                                value={item.titular}
                                onChange={(e) => {

                                    const copia = [...datos];

                                    copia[index].titular =
                                        e.target.value;

                                    setDatos(copia);

                                }}
                            />

                        )}

                        {item.tipo === "PASAPORTE" && (

                            <div className="mt-5">

                                <p className="font-medium mb-2">

                                    ¿Existe alguna observación para este pasaporte?

                                </p>

                                <label className="flex items-center gap-2">

                                    <input
                                        type="radio"
                                        checked={!item.tieneObservacion}
                                        onChange={() => {

                                            const copia = [...datos];

                                            copia[index].tieneObservacion = false;

                                            copia[index].observacion = "";

                                            setDatos(copia);

                                        }}
                                    />

                                    No

                                </label>

                                <label className="flex items-center gap-2 mt-2">

                                    <input
                                        type="radio"
                                        checked={!!item.tieneObservacion}
                                        onChange={() => {

                                            const copia = [...datos];

                                            copia[index].tieneObservacion = true;

                                            setDatos(copia);

                                        }}
                                    />

                                    Sí

                                </label>

                                {item.tieneObservacion && (

                                    <textarea

                                        className="w-full border rounded-xl p-3 mt-3"

                                        rows={3}

                                        placeholder="Escriba la observación (opcional)"

                                        value={item.observacion ?? ""}

                                        onChange={(e) => {

                                            const copia = [...datos];

                                            copia[index].observacion =
                                                e.target.value;

                                            setDatos(copia);

                                        }}

                                    />

                                )}

                            </div>

                        )}

                        {item.tipo === "VISA" && (

                            <>

                                <p className="font-medium mb-3">

                                    ¿El titular de esta visa es la misma persona que figura en el recibo?

                                </p>

                                <label className="flex items-center gap-2">

                                    <input
                                        type="radio"
                                        checked={item.mismaPersona}
                                        onChange={() => {

                                            const copia = [...datos];

                                            copia[index].mismaPersona = true;

                                            copia[index].titular = "";

                                            copia[index].pasaporte = "";

                                            setDatos(copia);

                                        }}
                                    />

                                    Sí

                                </label>

                                <label className="flex items-center gap-2 mt-2">

                                    <input
                                        type="radio"
                                        checked={!item.mismaPersona}
                                        onChange={() => {

                                            const copia = [...datos];

                                            copia[index].mismaPersona = false;

                                            setDatos(copia);

                                        }}
                                    />

                                    No

                                </label>

                                {!item.mismaPersona && (

                                    <div className="space-y-3 mt-4">

                                        <input
                                            className="w-full border rounded-xl p-3"
                                            placeholder="Nombre completo del titular"
                                            value={item.titular}
                                            onChange={(e) => {

                                                const copia = [...datos];

                                                copia[index].titular =
                                                    e.target.value;

                                                setDatos(copia);

                                            }}
                                        />

                                        <input
                                            className="w-full border rounded-xl p-3"
                                            placeholder="Pasaporte del titular"
                                            value={item.pasaporte}
                                            onChange={(e) => {

                                                const copia = [...datos];

                                                copia[index].pasaporte =
                                                    e.target.value;

                                                setDatos(copia);

                                            }}
                                        />

                                    </div>

                                )}

                            </>

                        )}

                    </div>

                 );

        });

    })()}

</div>

            <div className="flex justify-end gap-3 mt-8">

                <button

                    onClick={onCancelar}

                    className="px-6 py-3 rounded-xl border"

                >

                    Cancelar

                </button>

                <button

                    onClick={validar}

                    className="px-6 py-3 rounded-xl bg-blue-900 text-white"

                >

                    Continuar

                </button>

            </div>

        </div>

    </div>

);
}