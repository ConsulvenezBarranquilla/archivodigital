import { ROLES } from "@/lib/roles";

interface EditarUsuarioCardProps {

    usuarioEditar: any;

    nombreEditar: string;
    setNombreEditar: (v: string) => void;

    rolEditar: string;
    setRolEditar: (v: string) => void;

    guardarEdicion: () => void;

    cancelar: () => void;

}

export default function EditarUsuarioCard({

    usuarioEditar,

    nombreEditar,
    setNombreEditar,

    rolEditar,
    setRolEditar,

    guardarEdicion,

    cancelar,

}: EditarUsuarioCardProps) {

    return (

        <div className="bg-slate-50 rounded-2xl shadow-md p-6 mb-8">

            <h2 className="text-2xl font-bold text-blue-950 mb-6">
                ✏️ Editar Usuario
            </h2>

            <p className="mb-4">

                Usuario:

                <strong>
                    {" "}
                    {usuarioEditar.usuario}
                </strong>

            </p>

            <input
                value={nombreEditar}
                onChange={(e)=>
                    setNombreEditar(e.target.value)
                }
                className="w-full border border-slate-300 rounded-xl p-3"
            />

            <br/>
            <br/>

            <select
                value={rolEditar}
                onChange={(e)=>
                    setRolEditar(e.target.value)
                }
                className="w-full border border-slate-300 rounded-xl p-3"
            >

                {ROLES.map((rol)=>(

                    <option
                        key={rol.value}
                        value={rol.value}
                    >
                        {rol.label}
                    </option>

                ))}

            </select>

            <div className="flex gap-3 mt-6">

                <button
                    onClick={guardarEdicion}
                    className="bg-green-700 text-white px-5 py-3 rounded-xl hover:bg-green-800"
                >
                    💾 Guardar
                </button>

                <button
                    onClick={cancelar}
                    className="bg-slate-500 text-white px-5 py-3 rounded-xl hover:bg-slate-600"
                >
                    Cancelar
                </button>

            </div>

        </div>

    );

}