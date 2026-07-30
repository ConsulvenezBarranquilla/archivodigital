"use client";

import { useEffect, useRef, useState } from "react";

export interface DataTableAction {

  label: string;

  icon?: React.ReactNode;

  onClick: () => void;

  danger?: boolean;

  disabled?: boolean;

}

interface DataTableActionsProps {

  actions: DataTableAction[];

}

export default function DataTableActions({

  actions,

}: DataTableActionsProps) {

  const [abierto, setAbierto] = useState(false);

  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {

    function cerrar(e: MouseEvent) {

      if (
        menuRef.current &&
        !menuRef.current.contains(e.target as Node)
      ) {
        setAbierto(false);
      }

    }

    document.addEventListener("mousedown", cerrar);

    return () =>
      document.removeEventListener("mousedown", cerrar);

  }, []);

  return (

    <div
      ref={menuRef}
      className="relative inline-block text-left"
    >

      <button
        type="button"
        onClick={() => setAbierto(!abierto)}
        className="
          h-8
          w-8
          rounded-md
          hover:bg-slate-100
          text-slate-600
          transition
          text-lg
          font-bold
        "
      >
        ⋮
      </button>

      {

        abierto && (

          <div
            className="
              absolute
              right-0
              mt-1
              w-56
              rounded-lg
              border
              border-gray-200
              bg-white
              shadow-xl
              z-50
              overflow-hidden
            "
          >

            {

              actions.map((action, index) => (

                <button

                  key={index}

                  type="button"

                  disabled={action.disabled}

                  onClick={() => {

                    setAbierto(false);

                    if (!action.disabled) {

                      action.onClick();

                    }

                  }}

                  className={`
                    flex
                    w-full
                    items-center
                    gap-3
                    px-4
                    py-2.5
                    text-sm
                    text-left
                    transition

                    ${
                      action.disabled
                        ? "cursor-not-allowed text-gray-400"
                        : action.danger
                        ? "text-red-600 hover:bg-red-50"
                        : "text-gray-700 hover:bg-slate-100"
                    }
                  `}
                >

                  <span className="w-5 text-center">

                    {action.icon}

                  </span>

                  <span>

                    {action.label}

                  </span>

                </button>

              ))

            }

          </div>

        )

      }

    </div>

  );

}