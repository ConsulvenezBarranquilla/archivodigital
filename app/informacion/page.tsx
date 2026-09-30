import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Sistema Caja Barranquilla",
  description:
    "Información sobre el Sistema Caja Barranquilla y sus funcionalidades.",
};

export default function InformacionPage() {
  return (
    <main className="min-h-screen bg-white text-gray-900">
      <div className="mx-auto max-w-4xl px-6 py-12 sm:px-8">

        <header className="border-b border-gray-200 pb-8">
          <p className="text-sm font-medium text-gray-600">
            Consulado General de la República Bolivariana de Venezuela en
            Barranquilla
          </p>

          <h1 className="mt-4 text-4xl font-bold tracking-tight">
            Sistema Caja Barranquilla
          </h1>

          <p className="mt-4 text-lg leading-8 text-gray-600">
            Plataforma tecnológica para apoyar la gestión administrativa,
            registro de actuaciones, generación de recibos y envío de
            documentos asociados a los servicios consulares.
          </p>
        </header>

        <div className="space-y-10 py-10">

          <section>
            <h2 className="text-2xl font-semibold">
              ¿Qué es el Sistema Caja Barranquilla?
            </h2>

            <p className="mt-4 leading-7 text-gray-700">
              El Sistema Caja Barranquilla es una plataforma tecnológica
              utilizada para apoyar determinados procesos administrativos y
              operativos relacionados con la atención consular.
            </p>

            <p className="mt-4 leading-7 text-gray-700">
              El sistema permite gestionar actuaciones, registrar operaciones
              administrativas y de caja, generar comprobantes y documentos,
              mantener registros de las operaciones realizadas y facilitar el
              envío electrónico de documentos a los usuarios cuando
              corresponda.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold">
              Funcionalidades
            </h2>

            <ul className="mt-4 list-disc space-y-3 pl-6 leading-7 text-gray-700">
              <li>
                Gestión de actuaciones y servicios consulares.
              </li>

              <li>
                Registro y control de operaciones de caja.
              </li>

              <li>
                Generación de recibos y documentos en formato PDF.
              </li>

              <li>
                Consulta y gestión de información relacionada con los
                trámites realizados.
              </li>

              <li>
                Generación de reportes administrativos.
              </li>

              <li>
                Envío electrónico de recibos y documentos mediante correo
                electrónico.
              </li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold">
              Uso de servicios de Google
            </h2>

            <p className="mt-4 leading-7 text-gray-700">
              El sistema utiliza determinados servicios tecnológicos de
              Google para apoyar funciones administrativas y de comunicación.
            </p>

            <p className="mt-4 leading-7 text-gray-700">
              Entre estos servicios pueden encontrarse Google Sheets y Gmail.
              La integración con Gmail se utiliza para permitir el envío de
              recibos y documentos desde la cuenta institucional autorizada.
            </p>

            <p className="mt-4 leading-7 text-gray-700">
              El sistema no utiliza la autorización de Gmail para leer o
              analizar de forma general el contenido personal del buzón.
              El acceso se utiliza para la funcionalidad específica autorizada
              por la cuenta institucional.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold">
              Protección de datos
            </h2>

            <p className="mt-4 leading-7 text-gray-700">
              El tratamiento de información personal realizado mediante el
              sistema se efectúa de acuerdo con las finalidades
              administrativas y consulares correspondientes y con las
              disposiciones aplicables en materia de protección de datos
              personales.
            </p>

            <p className="mt-4 leading-7 text-gray-700">
              Para conocer con mayor detalle las categorías de información
              tratada, las finalidades, las medidas de seguridad y los
              derechos de los titulares, consulte nuestra Política de
              Privacidad.
            </p>

            <p className="mt-5">
              <a
                href="/privacidad"
                className="font-semibold underline"
              >
                Consultar Política de Privacidad
              </a>
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold">
              Contacto
            </h2>

            <p className="mt-4 leading-7 text-gray-700">
              Para consultas relacionadas con el sistema y el tratamiento de
              datos personales:
            </p>

            <p className="mt-3">
              <a
                href="mailto:info.consulvenez@gmail.com"
                className="font-medium underline"
              >
                info.consulvenez@gmail.com
              </a>
            </p>
          </section>

        </div>

        <footer className="border-t border-gray-200 pt-6 text-sm text-gray-500">
          <p>
            Sistema Caja Barranquilla
          </p>

          <p className="mt-2">
            Consulado General de la República Bolivariana de Venezuela en
            Barranquilla
          </p>

          <p className="mt-2">
            <a
              href="/privacidad"
              className="underline"
            >
              Política de Privacidad
            </a>
          </p>
        </footer>

      </div>
    </main>
  );
}