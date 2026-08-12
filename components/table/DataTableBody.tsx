"use client";

import React from "react";

import DataTableEmpty from "./DataTableEmpty";

import {

  TableColumn,

} from "./DataTable";

interface DataTableBodyProps<T extends object> {

  columns: TableColumn<T>[];

  data: T[];

  keyField?: keyof T;
getRowClassName?: (row: T) => string;
  getRowKey?: (
    row: T,
    index: number
  ) => string;

  selectable?: boolean;

  selectedKeys?: string[];

  onSelectionChange?: (
    keys: string[]
  ) => void;

  isRowSelectable?: (
    row: T,
    index: number
  ) => boolean;
 hideCheckbox?: (
    row: T,
    index: number
  ) => boolean;
}

export default function DataTableBody<T extends object>({

  columns,

  data,

  keyField,

  getRowKey,

  getRowClassName,

  selectable = false,

  selectedKeys = [],

  onSelectionChange,

  isRowSelectable = () => true,

   hideCheckbox = () => false,

}: DataTableBodyProps<T>) {

  function obtenerKey(

    row: T,

    index: number

  ) {

    if (getRowKey) {

      return getRowKey(

        row,

        index

      );

    }

    if (keyField) {

      return `${

        String(

          row[keyField]

        )

      }-${index}`;

    }

    return String(index);

  }

  function toggleSeleccion(

    key: string

  ) {

    if (!onSelectionChange) {

      return;

    }

    if (

      selectedKeys.includes(key)

    ) {

      onSelectionChange(

        selectedKeys.filter(

          (k) =>

            k !== key

        )

      );

    }

    else {

      onSelectionChange([

        ...selectedKeys,

        key,

      ]);

    }

  }
console.log({
  selectable,
  data: data.length,
  selectedKeys,
  onSelectionChange,
});
  return (

    <tbody>

      {

        data.length === 0 ? (

          <DataTableEmpty

            columnas={

              columns.length +

              (selectable ? 1 : 0)

            }

          />

        ) : (

          data.map(

            (

              row,

              index

            ) => {

              const key =

                obtenerKey(

                  row,

                  index

                );

              const seleccionado =

                selectedKeys.includes(

                  key

                );

                const habilitado =
  isRowSelectable(
    row,
    index
  );

              return (

                <tr

                  key={key}

                  className={`
  border-b
  transition-colors
  duration-150

  ${
    habilitado &&
    (row as any).tipoFila !== "TOTAL_MES"
      ? "hover:bg-slate-50"
      : !habilitado
      ? "opacity-50"
      : ""
  }

  ${
    seleccionado
      ? "bg-blue-50"
      : getRowClassName?.(row) ?? ""
  }
`}

                >

                  {selectable && (

  <td
    className="
      px-2
      py-3
      text-center
    "
  >

    {hideCheckbox(row, index) ? null : (

      <input
        type="checkbox"
        checked={seleccionado}
        disabled={!habilitado}
        onChange={() => {

          if (!habilitado) {

            return;

          }

          toggleSeleccion(key);

        }}
      />

    )}

  </td>

)}

      

                  {

                    columns.map(

                      (

                        column

                      ) => (

                        <td

                          key={

                            String(

                              column.field

                            )

                          }

                          className={`

                            px-4

                            py-3

                            text-sm

                            whitespace-nowrap

                            ${

                              column.align ===

                              "center"

                                ? "text-center"

                                : column.align ===

                                  "right"

                                ? "text-right"

                                : "text-left"

                            }

                          `}

                        >

                          {

                            column.render

                              ? column.render(

                                  row

                                )

                              : String(

                                  row[

                                    column.field

                                  ] ?? ""

                                )

                          }

                        </td>

                      )

                    )

                  }

                </tr>

              );

            }

          )

        )

      }

    </tbody>

  );

}