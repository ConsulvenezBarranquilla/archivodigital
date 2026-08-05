"use client";

import { useEffect, useState } from "react";

interface ModalReporteExcelProps {

    open: boolean;

    onClose: () => void;

    onGenerar: (

        fechaInicial: string,

        fechaFinal: string

    ) => void;

}

export default function ModalReporteExcel({

    open,

    onClose,

    onGenerar,

}: ModalReporteExcelProps) {

    const [

        fechaInicial,

        setFechaInicial

    ] = useState("");

    const [

        fechaFinal,

        setFechaFinal

    ] = useState("");

const [

    generando,

    setGenerando

] = useState(false);

    useEffect(() => {

        if (!open) {

            return;

        }

        seleccionarMesActual();

    }, [open]);

    function hoyISO() {

        return new Date()

            .toISOString()

            .substring(0, 10);

    }

    function seleccionarHoy() {

        const hoy = hoyISO();

        setFechaInicial(hoy);

        setFechaFinal(hoy);

    }

    function seleccionarMesActual() {

        const hoy = new Date();

        const anio = hoy.getFullYear();

        const mes = hoy.getMonth();

        const primerDia = new Date(anio, mes, 1);

        const ultimoDia = new Date(anio, mes + 1, 0);

        setFechaInicial(

            primerDia.toISOString().substring(0, 10)

        );

        setFechaFinal(

            ultimoDia.toISOString().substring(0, 10)

        );

    }

    function seleccionarAnioActual() {

        const anio = new Date().getFullYear();

        setFechaInicial(`${anio}-01-01`);

        setFechaFinal(`${anio}-12-31`);

    }

    async function generar() {

    if (!fechaInicial) {

        alert("Debe seleccionar la fecha inicial.");

        return;

    }

    if (!fechaFinal) {

        alert("Debe seleccionar la fecha final.");

        return;

    }

    if (fechaInicial > fechaFinal) {

        alert(
            "La fecha inicial no puede ser posterior a la fecha final."
        );

        return;

    }

    setGenerando(true);

    try {

        await onGenerar(

            fechaInicial,

            fechaFinal

        );

    }

    finally {

        setGenerando(false);

    }

}

    if (!open) {

        return null;

    }

    return (

        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">

            <div className="bg-white rounded-2xl shadow-xl w-full max-w-xl p-6">

                <h2 className="text-2xl font-bold text-blue-950 mb-6">

                    Generar Reporte Excel

                </h2>

                <div className="space-y-5">

                    <div className="grid grid-cols-2 gap-4">

                        <div>

                            <label className="block mb-1 font-medium">

                                Fecha Inicial

                            </label>

                            <input

                                type="date"

                                value={fechaInicial}

                                onChange={(e) =>

                                    setFechaInicial(

                                        e.target.value

                                    )

                                }

                                className="w-full border rounded-lg px-3 py-2"

                            />

                        </div>

                        <div>

                            <label className="block mb-1 font-medium">

                                Fecha Final

                            </label>

                            <input

                                type="date"

                                value={fechaFinal}

                                onChange={(e) =>

                                    setFechaFinal(

                                        e.target.value

                                    )

                                }

                                className="w-full border rounded-lg px-3 py-2"

                            />

                        </div>

                    </div>

                    <div>

                        <label className="block mb-3 font-medium">

                            Accesos rápidos

                        </label>

                        <div className="flex gap-3">

                            <button

                                onClick={seleccionarHoy}

                                className="px-4 py-2 rounded-lg border hover:bg-slate-100"

                            >

                                Hoy

                            </button>

                            <button

                                onClick={seleccionarMesActual}

                                className="px-4 py-2 rounded-lg border hover:bg-slate-100"

                            >

                                Mes Actual

                            </button>

                            <button

                                onClick={seleccionarAnioActual}

                                className="px-4 py-2 rounded-lg border hover:bg-slate-100"

                            >

                                Año Actual

                            </button>

                        </div>

                    </div>

                </div>

                <div className="flex justify-end gap-3 mt-8">

                    <button

                        onClick={onClose}

                        className="px-5 py-2 rounded-lg border"

                    >

                        Cancelar

                    </button>

                    <button

    onClick={generar}

    disabled={generando}

    className={`
        px-5
        py-2
        rounded-lg
        text-white
        transition
        ${
            generando
                ? "bg-gray-400 cursor-not-allowed"
                : "bg-emerald-700 hover:bg-emerald-800"
        }
    `}

>

    {

        generando

            ? "Generando..."

            : "Generar Excel"

    }

</button>

                </div>

            </div>

        </div>

    );

}