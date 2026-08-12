"use client";

import { ReactNode, useEffect } from "react";

interface Props {

    open: boolean;

    title: string;

    subtitle?: string;

    children: ReactNode;

    onClose: () => void;

    onSave?: () => void;

    saveLabel?: string;

    saving?: boolean;

}

export default function DocumentoDrawer({

    open,

    title,

    subtitle,

    children,

    onClose,

    onSave,

    saveLabel = "Guardar",

    saving = false,

}: Props) {

    useEffect(() => {

        function handleEscape(e: KeyboardEvent) {

            if (e.key === "Escape") {

                onClose();

            }

        }

        if (open) {

            document.body.style.overflow = "hidden";

            window.addEventListener(

                "keydown",

                handleEscape

            );

        }

        return () => {

            document.body.style.overflow = "";

            window.removeEventListener(

                "keydown",

                handleEscape

            );

        };

    }, [open, onClose]);

    return (

        <>

            {/* Overlay */}

            <div

                onClick={onClose}

                className={`

                    fixed

                    inset-0

                    bg-black/40

                    transition-opacity

                    duration-300

                    z-40

                    ${

                        open

                            ? "opacity-100"

                            : "opacity-0 pointer-events-none"

                    }

                `}

            />

            {/* Drawer */}

            <aside

                className={`

                    fixed

                    top-0

                    right-0

                    h-screen

                    w-full

                    sm:w-[480px]

                    lg:w-[540px]

                    bg-white

                    shadow-2xl

                    z-50

                    flex

                    flex-col

                    transition-transform

                    duration-300

                    ${

                        open

                            ? "translate-x-0"

                            : "translate-x-full"

                    }

                `}

            >

                {/* Cabecera */}

                <div

                    className="

                        border-b

                        px-6

                        py-5

                    "

                >

                    <div

                        className="

                            flex

                            items-center

                            justify-between

                        "

                    >

                        <div>

                            <h2

                                className="

                                    text-xl

                                    font-bold

                                    text-blue-950

                                "

                            >

                                {title}

                            </h2>

                            {

                                subtitle && (

                                    <p

                                        className="

                                            mt-1

                                            text-sm

                                            text-slate-500

                                        "

                                    >

                                        {subtitle}

                                    </p>

                                )

                            }

                        </div>

                        <button

                            onClick={onClose}

                            className="

                                text-slate-400

                                hover:text-slate-700

                                text-2xl

                                leading-none

                            "

                        >

                            ✕

                        </button>

                    </div>

                </div>

                {/* Contenido */}

                <div

                    className="

                        flex-1

                        overflow-y-auto

                        p-6

                    "

                >

                    {children}

                </div>

                {/* Footer */}

                <div

                    className="

                        border-t

                        p-6

                        flex

                        justify-end

                        gap-3

                    "

                >

                    <button

                        onClick={onClose}

                        className="

                            px-5

                            py-2

                            rounded-xl

                            border

                            border-slate-300

                            hover:bg-slate-100

                        "

                    >

                        Cancelar

                    </button>

                    {

                        onSave && (

                            <button

                                onClick={onSave}

                                disabled={saving}

                                className="

                                    px-5

                                    py-2

                                    rounded-xl

                                    bg-blue-700

                                    text-white

                                    hover:bg-blue-800

                                    disabled:opacity-50

                                "

                            >

                                {

                                    saving

                                        ? "Guardando..."

                                        : saveLabel

                                }

                            </button>

                        )

                    }

                </div>

            </aside>

        </>

    );

}