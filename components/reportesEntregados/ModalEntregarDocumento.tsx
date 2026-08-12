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

    },

    [

        open,

        documento,

    ]);

    if (

        !open ||

        !documento

    ) {

        return null;

    }

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

                    overflow-hidden

                "

            >
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
                    <div

                    className="

                        p-8

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

                        titulo="Planilla"

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
                                        {/* =======================================
                        Información específica
                    ======================================== */}

                    {

                        documento.categoria ===

                        "PASAPORTES" && (

                            <>

                                <Campo

                                    titulo="N° Pasaporte"

                                    valor={

                                        documento.numeroPasaporte ||

                                        "-"

                                    }

                                />

                                <Campo

                                    titulo="Fecha recepción"

                                    valor={

                                        documento.fechaValija ||

                                        "-"

                                    }

                                />

                                <Campo

                                    titulo="Fecha emisión"

                                    valor={

                                        documento.fechaEmision ||

                                        "-"

                                    }

                                />

                                <Campo

                                    titulo="Fecha vencimiento"

                                    valor={

                                        documento.fechaVencimiento ||

                                        "-"

                                    }

                                />

                            </>

                        )

                    }

                    {

                        documento.categoria ===

                        "VISA" && (

                            <>

                                <Campo

                                    titulo="Número Visa"

                                    valor={

                                        documento.numeroVisa ||

                                        "-"

                                    }

                                />

                                <Campo

                                    titulo="Tipo Visa"

                                    valor={

                                        documento.tipoVisa ||

                                        "-"

                                    }

                                />

                                <Campo

                                    titulo="Nacionalidad"

                                    valor={

                                        documento.nacionalidad ||

                                        "-"

                                    }

                                />

                                <Campo

                                    titulo="Vigencia"

                                    valor={

                                        documento.vigencia ||

                                        "-"

                                    }

                                />

                            </>

                        )

                    }

                    {

                        documento.categoria ===

                        "APOSTILLA" && (

                            <Campo

                                titulo="Estado Apostilla"

                                valor={

                                    documento.estadoApostilla ||

                                    "-"

                                }

                            />

                        )

                    }

                    {

                        documento.categoria ===

                        "FE_VIDA" && (

                            <>

                                <Campo

                                    titulo="Fecha emisión"

                                    valor={

                                        documento.fechaEmision ||

                                        "-"

                                    }

                                />

                                <Campo

                                    titulo="Correlativo"

                                    valor={

                                        documento.correlativo ||

                                        "-"

                                    }

                                />

                            </>

                        )

                    }

                    {

                        documento.categoria ===

                        "CARTA_SOLTERIA" && (

                            <>

                                <Campo

                                    titulo="Fecha emisión"

                                    valor={

                                        documento.fechaEmision ||

                                        "-"

                                    }

                                />

                                <Campo

                                    titulo="Correlativo"

                                    valor={

                                        documento.correlativo ||

                                        "-"

                                    }

                                />

                            </>

                        )

                    }

                    {

                        documento.categoria ===

                        "CERTIFICADO_USO" && (

                            <>

                                <Campo

                                    titulo="Tipo"

                                    valor={

                                        documento.tipoCertificado ||

                                        "-"

                                    }

                                />

                                <Campo

                                    titulo="Fecha registro"

                                    valor={

                                        documento.fechaRegistro ||

                                        "-"

                                    }

                                />

                                <Campo

                                    titulo="N° Certificado"

                                    valor={

                                        documento.numeroCertificado ||

                                        "-"

                                    }

                                />

                            </>

                        )

                    }

                    {

                        documento.categoria ===

                        "CONSTANCIA_REGISTRO" && (

                            <>

                                <Campo

                                    titulo="Número Registro"

                                    valor={

                                        documento.numeroRegistro ||

                                        "-"

                                    }

                                />

                                <Campo

                                    titulo="Fecha Registro"

                                    valor={

                                        documento.fechaRegistro ||

                                        "-"

                                    }

                                />

                            </>

                        )

                    }

                    {

                        documento.categoria ===

                        "CONSTANCIA_CONSULAR" && (

                            <>

                                <Campo

                                    titulo="Fecha"

                                    valor={

                                        documento.fechaConstancia ||

                                        "-"

                                    }

                                />

                                <Campo

                                    titulo="Correlativo"

                                    valor={

                                        documento.correlativo ||

                                        "-"

                                    }

                                />

                            </>

                        )

                    }

                    {

                        documento.categoria ===

                        "PODER" && (

                            <>

                                <Campo

                                    titulo="Tipo"

                                    valor={

                                        documento.tipoPoder ||

                                        "-"

                                    }

                                />

                                <Campo

                                    titulo="Apoderado"

                                    valor={

                                        documento.apoderado ||

                                        "-"

                                    }

                                />

                                <Campo

                                    titulo="Documento"

                                    valor={

                                        documento.documentoApoderado ||

                                        "-"

                                    }

                                />

                                <Campo

                                    titulo="Estado"

                                    valor={

                                        documento.estadoPoder ||

                                        "-"

                                    }

                                />

                            </>

                        )

                    }

                    {

                        documento.categoria ===

                        "AUTORIZACION_VIAJE" && (

                            <>

                                <Campo

                                    titulo="Menor"

                                    valor={

                                        documento.menor ||

                                        "-"

                                    }

                                />

                                <Campo

                                    titulo="Destino"

                                    valor={

                                        documento.destino ||

                                        "-"

                                    }

                                />

                                <Campo

                                    titulo="Fecha Ida"

                                    valor={

                                        documento.fechaIda ||

                                        "-"

                                    }

                                />

                                <Campo

                                    titulo="Fecha Retorno"

                                    valor={

                                        documento.fechaRetorno ||

                                        "-"

                                    }

                                />

                                <Campo

                                    titulo="Acompañante"

                                    valor={

                                        documento.acompanante ||

                                        "-"

                                    }

                                />

                                <Campo

                                    titulo="Modalidad"

                                    valor={

                                        documento.modalidad ||

                                        "-"

                                    }

                                />

                            </>

                        )

                    }

                </div>
                                {/* =======================================
                    Datos de la entrega
                ======================================== */}

                <div

                    className="

                        border-t

                        px-8

                        py-6

                        bg-slate-50

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

                        {/* ===========================
                            Fecha entrega
                        ============================ */}

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

                        {/* ===========================
                            Funcionario
                        ============================ */}

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

                    {/* ===========================
                        Observaciones
                    ============================ */}

                    <div

                        className="

                            mt-6

                        "

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

                {/* =======================================
                    Botones
                ======================================== */}

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