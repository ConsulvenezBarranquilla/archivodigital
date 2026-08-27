"use client";

import {
    useEffect,
    useState,
} from "react";

import {
    ReporteEntregado,
} from "@/types/ReporteEntregado";

interface Props {

    open: boolean;

    documento: ReporteEntregado | null;

    usuario: string;

    onClose: () => void;

    onGuardar: (

        documento: ReporteEntregado,

        fechaEntrega: string,

        observaciones: string

    ) => Promise<void>;

}

export default function ModalEntregarDocumento({

    open,

    documento,

    usuario,

    onClose,

    onGuardar,

}: Props) {

    const [

        fechaEntrega,

        setFechaEntrega,

    ] = useState("");

    const [

        observaciones,

        setObservaciones,

    ] = useState("");

    const [

        guardando,

        setGuardando,

    ] = useState(false);


    // ======================================
    // Inicialización
    // ======================================

    useEffect(() => {

        if (

            !open ||

            !documento

        ) {

            return;

        }

        setFechaEntrega(

            new Date()

                .toISOString()

                .substring(

                    0,

                    10

                )

        );

        setObservaciones("");

    }, [

        open,

        documento,

    ]);


    // ======================================
    // Validación
    // ======================================

    if (

        !open ||

        !documento

    ) {

        return null;

    }


    // ======================================
    // Render
    // ======================================

    return (

        <div

            className="

                fixed

                inset-0

                z-50

                bg-black/40

                flex

                items-center

                justify-center

                p-6

            "

        >

            <div

                className="

                    bg-white

                    rounded-2xl

                    shadow-2xl

                    w-full

                    max-w-3xl

                    max-h-[90vh]

                    overflow-hidden

                    flex

                    flex-col

                "

            >

                {/* ===================================
                    CABECERA
                ==================================== */}

                <div

                    className="

                        px-8

                        py-6

                        border-b

                    "

                >

                    <h2

                        className="

                            text-2xl

                            font-bold

                            text-blue-950

                        "

                    >

                        Entregar documento

                    </h2>

                    <p

                        className="

                            mt-2

                            text-slate-500

                        "

                    >

                        Confirme la entrega del documento al ciudadano.

                    </p>

                </div>


                {/* ===================================
                    CONTENIDO
                ==================================== */}

                <div

                    className="

                        flex-1

                        overflow-y-auto

                        p-8

                    "

                >

                    <div

                        className="

                            grid

                            grid-cols-2

                            gap-6

                        "

                    >

                        <Campo

                            titulo="Ciudadano"

                            valor={

                                documento.solicitante

                            }

                        />

                        <Campo

                            titulo="Documento"

                            valor={

                                documento.documento

                            }

                        />

                        <Campo

                            titulo="Recibo"

                            valor={

                                documento.recibo

                            }

                        />

                        <Campo

                            titulo="Planilla GC"

                            valor={

                                documento.planillaGC

                            }

                        />

                        <Campo

                            titulo="Categoría"

                            valor={

                                documento.categoria

                            }

                        />

                        <Campo

                            titulo="Estado"

                            valor={

                                documento.estado

                            }

                        />


                        {/* ===================================
                            PASAPORTES
                        ==================================== */}

                        {

                            documento.categoria ===

                            "PASAPORTES" && (

                                <>

                                    <Campo

                                        titulo="N° Pasaporte"

                                        valor={

                                            documento.numeroPasaporte

                                        }

                                    />

                                    <Campo

                                        titulo="Fecha Valija"

                                        valor={

                                            documento.fechaValija

                                        }

                                    />

                                    <Campo

                                        titulo="Fecha Emisión"

                                        valor={

                                            documento.fechaEmision

                                        }

                                    />

                                    <Campo

                                        titulo="Fecha Vencimiento"

                                        valor={

                                            documento.fechaVencimiento

                                        }

                                    />

                                </>

                            )

                        }


                        {/* ===================================
                            VISA
                        ==================================== */}

                        {

                            documento.categoria ===

                            "VISA" && (

                                <>

                                    <Campo

                                        titulo="N° Etiqueta"

                                        valor={

                                            documento.numeroVisa

                                        }

                                    />

                                    <Campo

                                        titulo="Tipo Visa"

                                        valor={

                                            documento.tipoVisa

                                        }

                                    />

                                    <Campo

                                        titulo="Nacionalidad"

                                        valor={

                                            documento.nacionalidad

                                        }

                                    />

                                    <Campo

                                        titulo="Fecha Vencimiento"

                                        valor={

                                            documento.fechaVencimiento

                                        }

                                    />

                                </>

                            )

                        }


                        {/* ===================================
                            APOSTILLA
                        ==================================== */}

                        {

                            documento.categoria ===

                            "APOSTILLA" && (

                                <Campo

                                    titulo="Estado Apostilla"

                                    valor={

                                        documento.estadoApostilla

                                    }

                                />

                            )

                        }


                        {/* ===================================
                            FE DE VIDA
                        ==================================== */}

                        {

                            documento.categoria ===

                            "FE_VIDA" && (

                                <>

                                    <Campo

                                        titulo="Fecha Emisión"

                                        valor={

                                            documento.fechaEmisionDocumento

                                        }

                                    />

                                    <Campo

                                        titulo="Correlativo"

                                        valor={

                                            documento.correlativoDocumento

                                        }

                                    />

                                </>

                            )

                        }


                        {/* ===================================
                            CARTA DE SOLTERÍA
                        ==================================== */}

                        {

                            documento.categoria ===

                            "CARTA_SOLTERIA" && (

                                <>

                                    <Campo

                                        titulo="Fecha Emisión"

                                        valor={

                                            documento.fechaCarta

                                        }

                                    />

                                    <Campo

                                        titulo="Correlativo"

                                        valor={

                                            documento.correlativoCarta

                                        }

                                    />

                                </>

                            )

                        }


                        {/* ===================================
                            CERTIFICADO DE USO
                        ==================================== */}

                        {

                            documento.categoria ===

                            "CERTIFICADO_USO" && (

                                <>

                                    <Campo

                                        titulo="Tipo"

                                        valor={

                                            documento.tipoCertificado

                                        }

                                    />

                                    <Campo

                                        titulo="Fecha Registro"

                                        valor={

                                            documento.fechaRegistro

                                        }

                                    />

                                    <Campo

                                        titulo="N° Certificado"

                                        valor={

                                            documento.numeroCertificado

                                        }

                                    />

                                </>

                            )

                        }


                        {/* ===================================
                            CONSTANCIA REGISTRO
                        ==================================== */}

                        {

                            documento.categoria ===

                            "CONSTANCIA_REGISTRO" && (

                                <>

                                    <Campo

                                        titulo="N° Registro"

                                        valor={

                                            documento.numeroRegistro

                                        }

                                    />

                                    <Campo
    titulo="Fecha Registro"
    valor={
        documento.fechaRegistroConsular
    }
/>

                                </>

                            )

                        }


                        {/* ===================================
                            CONSTANCIA CONSULAR
                        ==================================== */}

                        {

                            documento.categoria ===

                            "CONSTANCIA_CONSULAR" && (

                                <Campo

                                    titulo="Fecha Constancia"

                                    valor={

                                        documento.fechaConstancia

                                    }

                                />

                            )

                        }


                        {/* ===================================
                            PODER
                        ==================================== */}

                        {

                            documento.categoria ===

                            "PODER" && (

                                <>

                                    <Campo

                                        titulo="Tipo Poder"

                                        valor={

                                            documento.tipoPoder

                                        }

                                    />

                                    <Campo
    titulo="Apoderado"
    valor={
        documento.apoderadosPoder?.[0]?.nombre
    }
/>

<Campo
    titulo="Documento Apoderado"
    valor={
        documento.apoderadosPoder?.[0]?.documento
    }
/>

                                    <Campo

                                        titulo="Estado"

                                        valor={

                                            documento.estadoPoder

                                        }

                                    />

                                </>

                            )

                        }


                        {/* ===================================
                            AUTORIZACIÓN DE VIAJE
                        ==================================== */}

                        {

                            documento.categoria ===

                            "AUTORIZACION_VIAJE" && (

                                <>

                                    <Campo

                                        titulo="Menor"

                                        valor={

                                            documento.menor

                                        }

                                    />

                                    <Campo

                                        titulo="Destino"

                                        valor={

                                            documento.destino

                                        }

                                    />

                                    <Campo

                                        titulo="Fecha Ida"

                                        valor={

                                            documento.fechaIda

                                        }

                                    />

                                    <Campo

                                        titulo="Fecha Retorno"

                                        valor={

                                            documento.fechaRetorno

                                        }

                                    />

                                    <Campo

                                        titulo="Acompañante"

                                        valor={

                                            documento.acompanante

                                        }

                                    />

                                    <Campo

                                        titulo="Modalidad"

                                        valor={

                                            documento.modalidad

                                        }

                                    />

                                </>

                            )

                        }

                    </div>


                    {/* ===================================
                        DATOS DE ENTREGA
                    ==================================== */}

                    <div

                        className="

                            border-t

                            mt-8

                            pt-6

                        "

                    >

                        <h3

                            className="

                                text-lg

                                font-semibold

                                text-blue-950

                                mb-5

                            "

                        >

                            Confirmación de entrega

                        </h3>


                        <div

                            className="

                                grid

                                grid-cols-2

                                gap-6

                            "

                        >

                            {/* Fecha */}

                            <div>

                                <label

                                    className="

                                        block

                                        text-sm

                                        font-semibold

                                        mb-2

                                    "

                                >

                                    Fecha de entrega

                                </label>

                                <input

                                    type="date"

                                    value={

                                        fechaEntrega

                                    }

                                    onChange={

                                        e =>

                                            setFechaEntrega(

                                                e.target.value

                                            )

                                    }

                                    className="

                                        w-full

                                        border

                                        rounded-xl

                                        px-3

                                        py-2

                                    "

                                />

                            </div>


                            {/* Usuario */}

                            <div>

                                <label

                                    className="

                                        block

                                        text-sm

                                        font-semibold

                                        mb-2

                                    "

                                >

                                    Funcionario que entrega

                                </label>

                                <input

                                    type="text"

                                    readOnly

                                    value={

                                        usuario

                                    }

                                    className="

                                        w-full

                                        border

                                        rounded-xl

                                        px-3

                                        py-2

                                        bg-slate-100

                                    "

                                />

                            </div>

                        </div>


                        {/* Observaciones */}

                        <div

                            className="mt-6"

                        >

                            <label

                                className="

                                    block

                                    text-sm

                                    font-semibold

                                    mb-2

                                "

                            >

                                Observaciones de la entrega

                            </label>

                            <textarea

                                rows={4}

                                value={

                                    observaciones

                                }

                                onChange={

                                    e =>

                                        setObservaciones(

                                            e.target.value

                                        )

                                }

                                className="

                                    w-full

                                    border

                                    rounded-xl

                                    px-3

                                    py-2

                                    resize-none

                                "

                                placeholder="Opcional"

                            />

                        </div>

                    </div>

                </div>


                {/* ===================================
                    BOTONES
                ==================================== */}

                <div

                    className="

                        border-t

                        px-8

                        py-5

                        flex

                        justify-end

                        gap-3

                    "

                >

                    <button

                        type="button"

                        onClick={

                            onClose

                        }

                        disabled={

                            guardando

                        }

                        className="

                            px-5

                            py-2

                            rounded-xl

                            border

                            border-slate-300

                            hover:bg-slate-100

                            disabled:opacity-50

                        "

                    >

                        Cancelar

                    </button>


                    <button

                        type="button"

                        disabled={

                            guardando

                        }

                        onClick={

                            async () => {

                                if (

                                    !fechaEntrega

                                ) {

                                    alert(

                                        "Debe indicar la fecha de entrega."

                                    );

                                    return;

                                }

                                try {

                                    setGuardando(

                                        true

                                    );

                                    await onGuardar(

                                        documento,

                                        fechaEntrega,

                                        observaciones

                                    );

                                    onClose();

                                }

                                catch (

                                    error

                                ) {

                                    console.error(

                                        error

                                    );

                                    alert(

                                        "No fue posible registrar la entrega."

                                    );

                                }

                                finally {

                                    setGuardando(

                                        false

                                    );

                                }

                            }

                        }

                        className="

                            bg-emerald-600

                            hover:bg-emerald-700

                            text-white

                            rounded-xl

                            px-6

                            py-2

                            font-semibold

                            disabled:opacity-50

                        "

                    >

                        {

                            guardando

                                ? "Guardando..."

                                : "Confirmar Entrega"

                        }

                    </button>

                </div>

            </div>

        </div>

    );

}


// =======================================
// Campo informativo
// =======================================

interface CampoProps {

    titulo: string;

    valor?: string;

}

function Campo({

    titulo,

    valor,

}: CampoProps) {

    return (

        <div>

            <label

                className="

                    block

                    text-sm

                    font-semibold

                    text-slate-500

                    mb-1

                "

            >

                {titulo}

            </label>

            <div

                className="

                    min-h-[42px]

                    rounded-xl

                    border

                    bg-slate-50

                    px-3

                    py-2

                    text-slate-800

                    flex

                    items-center

                "

            >

                {

                    valor &&

                    valor.trim() !== ""

                        ? valor

                        : "-"

                }

            </div>

        </div>

    );

}