"use client";

import React, {
  useEffect,
  useLayoutEffect,
  useRef,
} from "react";

import DataTableBody from "./DataTableBody";

export interface TableColumn<T extends object> {

    field: keyof T;

    title: string;

    width?: string;

    align?: "left" | "center" | "right";

    key?: string;

    whiteSpace?: "nowrap" | "normal" | "pre-line";

    render?: (
        row: T
    ) => React.ReactNode;

}

interface DataTableProps<T extends object> {

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

export default function DataTable<T extends object>({

  columns,

  data,

  keyField,

  getRowClassName,
  
  getRowKey,

  selectable = false,

  selectedKeys = [],

  onSelectionChange,

  isRowSelectable = () => true,
   hideCheckbox = () => false,

}: DataTableProps<T>) {

  const topScrollRef =
    useRef<HTMLDivElement>(null);

  const bottomScrollRef =
    useRef<HTMLDivElement>(null);

  const fakeWidthRef =
    useRef<HTMLDivElement>(null);

  const tableRef =
    useRef<HTMLTableElement>(null);

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

  function toggleSeleccionarTodo() {

    if (!onSelectionChange) {

      return;

    }
      // Debe existir al menos una actuación seleccionada
    // para saber de qué ciudadano se trata.
    if (selectedKeys.length === 0) {
        return;
    }

    if (

      data.length > 0 &&

      selectedKeys.length ===

      data.length

    ) {

      onSelectionChange([]);

      return;

    }

    const seleccionables = data.filter(
  (row, index) => isRowSelectable(row, index)
);

onSelectionChange(
  seleccionables.map((row) => {

    const index = data.indexOf(row);

    return obtenerKey(row, index);

  })
);

  }

  // ===============================
  // Sincronizar ancho del scroll
  // superior con la tabla
  // ===============================

  useLayoutEffect(() => {

    if (

      !tableRef.current ||

      !fakeWidthRef.current

    ) {

      return;

    }

    const actualizar = () => {

      fakeWidthRef.current!.style.width =

        `${tableRef.current!.scrollWidth}px`;

    };

    actualizar();

    const observer =

      new ResizeObserver(

        actualizar

      );

    observer.observe(

      tableRef.current

    );

    window.addEventListener(

      "resize",

      actualizar

    );

    return () => {

      observer.disconnect();

      window.removeEventListener(

        "resize",

        actualizar

      );

    };

  }, [

    columns,

    data,

  ]);

  // ===============================
  // Sincronizar ambos scrolls
  // ===============================

  useEffect(() => {

    const superior =
      topScrollRef.current;

    const inferior =
      bottomScrollRef.current;

    if (

      !superior ||

      !inferior

    ) {

      return;

    }

    let sincronizando =
      false;

    const moverSuperior =
      () => {

        if (

          sincronizando

        ) {

          return;

        }

        sincronizando = true;

        inferior.scrollLeft =

          superior.scrollLeft;

        sincronizando = false;

      };

    const moverInferior =
      () => {

        if (

          sincronizando

        ) {

          return;

        }

        sincronizando = true;

        superior.scrollLeft =

          inferior.scrollLeft;

        sincronizando = false;

      };

    superior.addEventListener(

      "scroll",

      moverSuperior

    );

    inferior.addEventListener(

      "scroll",

      moverInferior

    );

    return () => {

      superior.removeEventListener(

        "scroll",

        moverSuperior

      );

      inferior.removeEventListener(

        "scroll",

        moverInferior

      );

    };

  }, []);
console.table(
  columns.map((c) => ({
    key: c.key,
    field: c.field,
    width: c.width,
    whiteSpace: c.whiteSpace,
  }))
);
  return (

    <>

      {/* Scroll superior */}

      <div

        ref={topScrollRef}

        className="

          overflow-x-auto

          overflow-y-hidden

          mb-2

        "

      >

        <div

          ref={fakeWidthRef}

          className="h-px"

        />

      </div>

      {/* Contenedor principal */}

      <div

        ref={bottomScrollRef}

        className="

          overflow-auto

          rounded-2xl

          border

          border-gray-200

          bg-white

          shadow-md

          max-w-full

        "

      >

        <table

          ref={tableRef}

          className="

            border-collapse

            min-w-full

          "

        >
                    <thead

            className="

              sticky

              top-0

              z-20

              bg-blue-950
text-white

            "

          >

            <tr>

              {

                selectable && (

                  <th

                    className="

                      w-12

                      px-2

                      py-3

                      text-center

                      border-b

                      whitespace-nowrap

                    "

                  >

                    <input

                      type="checkbox"
                      disabled={selectedKeys.length === 0}

                      checked={

                        data.length > 0 &&

                        selectedKeys.length ===

                        data.length

                      }

                      onChange={

                        toggleSeleccionarTodo

                      }

                    />

                  </th>

                )

              }

              {

                columns.map(

                  (

                    column

                  ) => (

                    <th

                      key={column.key ?? String(column.field)}

                      style={{

                        width:

                          column.width,

                      }}

                      className={`
    px-4
    py-3
    border-b
    ${
        column.whiteSpace === "normal"
            ? "whitespace-normal"
            : column.whiteSpace === "pre-line"
            ? "whitespace-pre-line"
            : "whitespace-nowrap"
    }
    text-sm
    font-medium
    bg-blue-950
    text-white
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

                        column.title

                      }

                    </th>

                  )

                )

              }

            </tr>

          </thead>

          <DataTableBody

            columns={columns}

            data={data}

            keyField={keyField}

            isRowSelectable={isRowSelectable}

getRowClassName={getRowClassName}

            getRowKey={

              getRowKey

            }

            selectable={

              selectable

            }

            selectedKeys={

              selectedKeys

            }

            onSelectionChange={

              onSelectionChange

            }

             hideCheckbox={hideCheckbox}

          />

        </table>

      </div>

    </>

  );

}