"use client";

interface CampoProps {

  titulo: string;

  value: string;

  onChange?: (valor: string) => void;

  disabled?: boolean;

  type?:
    | "text"
    | "email"
    | "date"
    | "select";

  opciones?: string[];

}

export default function Campo({

  titulo,

  value,

  onChange,

  disabled = false,

  type = "text",

  opciones = [],

}: CampoProps) {

  const clases = `

    w-full

    rounded-lg

    border

    border-gray-300

    px-3

    py-2

    text-sm

    transition-colors

    focus:outline-none

    focus:ring-2

    focus:ring-blue-500

    focus:border-blue-500

    disabled:bg-gray-100

    disabled:text-gray-700

    disabled:cursor-not-allowed

  `;

  return (

    <div

      className="

        flex

        flex-col

        gap-1

      "

    >

      <label

        className="

          text-sm

          font-semibold

          text-gray-700

        "

      >

        {titulo}

      </label>

      {

        type === "select"

        ? (

          <select

            className={clases}

            value={value}

            disabled={disabled}

            onChange={(e) =>

              onChange?.(

                e.target.value

              )

            }

          >

            <option value="">

              Seleccione...

            </option>

            {

              opciones.map(

                (opcion) => (

                  <option

                    key={opcion}

                    value={opcion}

                  >

                    {opcion}

                  </option>

                )

              )

            }

          </select>

        )

        : (

          <input

            className={clases}

            type={type}

            value={value}

            disabled={disabled}

            onChange={(e) =>

              onChange?.(

                e.target.value

              )

            }

          />

        )

      }

    </div>

  );

}