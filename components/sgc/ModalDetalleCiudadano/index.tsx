"use client";

import { useEffect, useState } from "react";

import Button from "@/components/ui/Button";

import Header from "./Header";
import Seccion from "./Seccion";
import Campo from "./Campo";

import {

  fechaInput,
  fechaDesdeInput,

} from "@/lib/fechas";

import {

  obtenerCatalogos,

} from "@/lib/services/Catalogos";

import {

  obtenerNombreCompleto,

} from "@/lib/personas";

import {
  CiudadanoSGC,
} from "@/types/GestionConsular";

import {
  obtenerDetalleCiudadanoSGC,
  actualizarCiudadanoSGC,
} from "@/lib/services/GestionConsular";

interface ModalDetalleCiudadanoProps {

  open: boolean;

  ciudadano: CiudadanoSGC | null;

  onClose: () => void;

  onActualizar?: () => Promise<void>;

}

export default function ModalDetalleCiudadano({

  open,

  ciudadano,

  onClose,

  onActualizar,

}: ModalDetalleCiudadanoProps) {

  const [

    editando,

    setEditando,

  ] = useState(false);

  const [

    guardando,

    setGuardando,

  ] = useState(false);

  const [

  catalogos,

  setCatalogos,

] = useState({

  nacionalidades: [] as string[],

  paises: [] as string[],

  estadosCivil: [] as string[],

  generos: [] as string[],

});

  const [

    formulario,

    setFormulario,

  ] = useState<CiudadanoSGC | null>(null);
  useEffect(() => {

  if (ciudadano) {

    setFormulario({

      ...ciudadano,

    });

    setEditando(false);

  }

}, [ciudadano]);

  useEffect(() => {

  async function cargarCatalogos() {

    const respuesta =

      await obtenerCatalogos();

    if (respuesta.ok) {

      setCatalogos(respuesta);

    }

  }

  cargarCatalogos();

}, []);

if (

  !open ||

  !formulario

) {

  return null;

}
  
  function actualizarCampo(

    campo: keyof CiudadanoSGC,

    valor: string

  ) {

    setFormulario(

      anterior => {

        if (!anterior) {

          return anterior;

        }

        return {

          ...anterior,

          [campo]: valor,

        };

      }

    );

  }

  async function guardar() {

  if (!formulario) {

    return;

  }

  try {

    setGuardando(true);

    const respuesta = await actualizarCiudadanoSGC(
      formulario
    );

    if (!respuesta.ok) {

      alert(
        respuesta.error ??
        respuesta.mensaje ??
        "No fue posible actualizar el ciudadano."
      );

      return;

    }

    const actualizado =
      await obtenerDetalleCiudadanoSGC(
        formulario.documento
      );

    if (actualizado.ok) {

      setFormulario(actualizado);

    }
await onActualizar?.();
    setEditando(false);

    alert(
      "Ciudadano actualizado correctamente."
    );

  }

  catch (error) {

    console.error(error);

    alert(
      "No fue posible actualizar el ciudadano."
    );

  }

  finally {

    setGuardando(false);

  }

}
console.log(
  "Fecha nacimiento:",
  formulario.fechaNacimiento
);
  return (

    <div

      className="

        fixed

        inset-0

        bg-black/40

        flex

        items-center

        justify-center

        z-50

        p-6

      "

    >

      <div

        className="

          bg-white

          rounded-xl

          shadow-2xl

          w-full

          max-w-7xl

          max-h-[95vh]

          overflow-y-auto

        "

      >

        <Header

  nombre={

    obtenerNombreCompleto(

      formulario

    )

  }

  documento={formulario.documento}

  fechaRegistro={formulario.fechaRegistro}

/>

        <div

          className="

            p-6

            space-y-6

          "

        >

          <Seccion

            titulo="Datos Personales"

          >

            <Campo

              titulo="Primer Nombre"

              value={formulario.primerNombre}

              disabled={!editando}

              onChange={(v)=>

                actualizarCampo(

                  "primerNombre",

                  v

                )

              }

            />

            <Campo

              titulo="Segundo Nombre"

              value={formulario.segundoNombre}

              disabled={!editando}

              onChange={(v)=>

                actualizarCampo(

                  "segundoNombre",

                  v

                )

              }

            />

            <Campo

              titulo="Primer Apellido"

              value={formulario.primerApellido}

              disabled={!editando}

              onChange={(v)=>

                actualizarCampo(

                  "primerApellido",

                  v

                )

              }

            />

            <Campo

              titulo="Segundo Apellido"

              value={formulario.segundoApellido}

              disabled={!editando}

              onChange={(v)=>

                actualizarCampo(

                  "segundoApellido",

                  v

                )

              }

            />

          </Seccion>
                    <Seccion

            titulo="Documentos"

          >

            <Campo

              titulo="Documento Principal"

              value={formulario.documento}

              disabled

            />

            <Campo

  titulo="Nacionalidad"

  type="select"

  opciones={catalogos.nacionalidades}

  value={formulario.nacionalidad}

  disabled={!editando}

  onChange={(v)=>

    actualizarCampo(

      "nacionalidad",

      v

    )

  }

/>

            <Campo

              titulo="Cédula"

              value={formulario.cedula}

              disabled

            />

            <Campo

              titulo="Pasaporte"

              value={formulario.pasaporte}

              disabled

            />

          </Seccion>

          <Seccion

            titulo="Nacimiento"

          >

            <Campo

  titulo="Fecha de Nacimiento"

  value={

    fechaInput(

      formulario.fechaNacimiento

    )

  }

  type="date"

  disabled={!editando}

  onChange={(v)=>

    actualizarCampo(

      "fechaNacimiento",

      fechaDesdeInput(v)

    )

  }

/>

            <Campo

              titulo="Ciudad de Nacimiento"

              value={formulario.ciudadNacimiento}

              disabled={!editando}

              onChange={(v)=>

                actualizarCampo(

                  "ciudadNacimiento",

                  v

                )

              }

            />

            <Campo

  titulo="País de Nacimiento"

  type="select"

  opciones={catalogos.paises}

  value={formulario.paisNacimiento}

  disabled={!editando}

  onChange={(v)=>

    actualizarCampo(

      "paisNacimiento",

      v

    )

  }

/>

          </Seccion>

          <Seccion

            titulo="Contacto"

          >

            <Campo

              titulo="Correo Electrónico"

              value={formulario.correo}

              type="email"

              disabled={!editando}

              onChange={(v)=>

                actualizarCampo(

                  "correo",

                  v

                )

              }

            />

            <Campo

              titulo="Teléfono"

              value={formulario.telefono}

              disabled={!editando}

              onChange={(v)=>

                actualizarCampo(

                  "telefono",

                  v

                )

              }

            />

          </Seccion>

          <Seccion

            titulo="Estado Civil"

          >

            <Campo

  titulo="Estado Civil"

  type="select"

  opciones={catalogos.estadosCivil}

  value={formulario.estadoCivil}

  disabled={!editando}

  onChange={(v)=>

    actualizarCampo(

      "estadoCivil",

      v

    )

  }

/>

            <Campo

  titulo="Género"

  type="select"

  opciones={catalogos.generos}

  value={formulario.genero}

  disabled={!editando}

  onChange={(v)=>

    actualizarCampo(

      "genero",

      v

    )

  }

/>

          </Seccion>
                  </div>

        <div

          className="

            border-t

            border-gray-200

            px-6

            py-4

            flex

            justify-end

            gap-3

            bg-gray-50

            rounded-b-xl

          "

        >

          {

            !editando ? (

              <>

                <Button

                  variant="secondary"

                  onClick={onClose}

                >

                  Cerrar

                </Button>

                <Button

                  variant="primary"

                  onClick={() =>

                    setEditando(true)

                  }

                >

                  Editar

                </Button>

              </>

            ) : (

              <>

                <Button

                  variant="secondary"

                  disabled={guardando}

                  onClick={() => {

                    if (ciudadano) {

    setFormulario({

        ...ciudadano,

    });

}

setEditando(false);
                    
                  }}

                >

                  Cancelar

                </Button>

                <Button

                  variant="primary"

                  disabled={guardando}

                  onClick={guardar}

                >

                  {

                    guardando

                      ? "Guardando..."

                      : "Guardar"

                  }

                </Button>

              </>

            )

          }

        </div>

      </div>

    </div>

  );

}