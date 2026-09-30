import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Política de Privacidad | Sistema Caja Barranquilla",
  description:
    "Política de privacidad y tratamiento de datos personales del Sistema Caja Barranquilla.",
};

export default function PoliticaPrivacidadPage() {
  return (
    <main className="min-h-screen bg-white text-gray-900">
      <div className="mx-auto max-w-4xl px-6 py-12 sm:px-8">
        {/* Encabezado */}
        <header className="mb-10 border-b border-gray-200 pb-8">
          <p className="mb-3 text-sm font-medium text-gray-600">
            Sistema Caja Barranquilla
          </p>

          <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
            Política de Privacidad y Tratamiento de Datos Personales
          </h1>

          <p className="mt-4 text-sm text-gray-600">
            Fecha de entrada en vigencia: 30 de septiembre de 2026
          </p>
        </header>

        <div className="space-y-10 text-[16px] leading-7">
          {/* 1 */}
          <section>
            <h2 className="mb-3 text-2xl font-semibold">
              1. Identificación del responsable
            </h2>

            <p>
              El presente documento establece las condiciones aplicables al
              tratamiento de datos personales realizado mediante el Sistema
              Caja Barranquilla, plataforma tecnológica utilizada para apoyar
              los procesos administrativos, de caja, registro, generación y
              envío de documentos y recibos asociados a los servicios
              consulares.
            </p>

            <div className="mt-4 rounded-lg border border-gray-200 bg-gray-50 p-5">
              <p>
                <strong>Responsable:</strong> Consulado General de la República
                Bolivariana de Venezuela en Barranquilla
              </p>

              <p>
                <strong>Aplicación:</strong> Sistema Caja Barranquilla
              </p>

              <p>
                <strong>Sitio web:</strong>{" "}
                <a
                  href="https://consultaconsulvenezbarranquilla.app"
                  className="underline"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  consultaconsulvenezbarranquilla.app
                </a>
              </p>

              <p>
                <strong>Correo de contacto:</strong>{" "}
                <a
                  href="mailto:info.consulvenez@gmail.com"
                  className="underline"
                >
                  info.consulvenez@gmail.com
                </a>
              </p>
            </div>
          </section>

          {/* 2 */}
          <section>
            <h2 className="mb-3 text-2xl font-semibold">
              2. Objeto de la política
            </h2>

            <p>
              Esta Política de Privacidad tiene como finalidad informar a los
              titulares sobre la forma en que se recolectan, almacenan,
              utilizan, consultan, procesan, transmiten y protegen los datos
              personales tratados mediante el Sistema Caja Barranquilla.
            </p>

            <p className="mt-3">
              El tratamiento de los datos se realizará de acuerdo con la
              normativa aplicable en materia de protección de datos personales
              y con las finalidades propias de las funciones y procedimientos
              administrativos y consulares correspondientes.
            </p>
          </section>

          {/* 3 */}
          <section>
            <h2 className="mb-3 text-2xl font-semibold">
              3. Marco general de protección de datos
            </h2>

            <p>
              El tratamiento de datos personales se realizará observando,
              según corresponda, las disposiciones aplicables en materia de
              protección de datos personales, incluyendo la Ley Estatutaria
              1581 de 2012 y sus normas reglamentarias o complementarias que
              resulten aplicables.
            </p>

            <p className="mt-3">
              Entre los principios aplicables se encuentran los de legalidad,
              finalidad, libertad, veracidad o calidad, transparencia,
              acceso y circulación restringida, seguridad y confidencialidad.
            </p>
          </section>

          {/* 4 */}
          <section>
            <h2 className="mb-3 text-2xl font-semibold">
              4. Datos personales que pueden ser tratados
            </h2>

            <p>
              Dependiendo del trámite o servicio, el Sistema puede procesar
              información suministrada por el titular o registrada durante la
              atención consular, incluyendo:
            </p>

            <ul className="mt-4 list-disc space-y-2 pl-6">
              <li>Nombres y apellidos.</li>
              <li>Número de cédula o pasaporte.</li>
              <li>Nacionalidad.</li>
              <li>Fecha y lugar de nacimiento.</li>
              <li>Estado civil.</li>
              <li>Género, cuando corresponda al trámite.</li>
              <li>Dirección de correo electrónico.</li>
              <li>Número telefónico.</li>
              <li>Información relacionada con actuaciones o servicios consulares.</li>
              <li>Información necesaria para la generación de recibos y documentos.</li>
              <li>Fotografías u otros documentos cuando sean necesarios para el trámite correspondiente.</li>
            </ul>

            <p className="mt-4">
              La información recopilada estará limitada, en la medida
              aplicable, a aquella necesaria para las finalidades del trámite
              o servicio correspondiente.
            </p>
          </section>

          {/* 5 */}
          <section>
            <h2 className="mb-3 text-2xl font-semibold">
              5. Finalidades del tratamiento
            </h2>

            <p>Los datos personales podrán ser tratados para:</p>

            <ul className="mt-4 list-disc space-y-2 pl-6">
              <li>
                Gestionar registros y procedimientos administrativos
                relacionados con la atención consular.
              </li>

              <li>
                Identificar al titular y consultar la información necesaria
                para la prestación del servicio correspondiente.
              </li>

              <li>
                Registrar actuaciones y movimientos asociados a los servicios
                prestados.
              </li>

              <li>
                Generar recibos, comprobantes, certificados, constancias y
                demás documentos relacionados con los trámites.
              </li>

              <li>
                Mantener registros administrativos y de control interno.
              </li>

              <li>
                Generar reportes administrativos, contables y estadísticos
                relacionados con la operación del sistema.
              </li>

              <li>
                Enviar al correo electrónico suministrado por el titular los
                recibos o documentos relacionados con su trámite, cuando
                corresponda.
              </li>

              <li>
                Atender solicitudes, consultas, correcciones y requerimientos
                relacionados con los datos personales.
              </li>

              <li>
                Cumplir obligaciones legales, administrativas o de control
                que resulten aplicables.
              </li>
            </ul>
          </section>

          {/* 6 */}
          <section>
            <h2 className="mb-3 text-2xl font-semibold">
              6. Uso de Google y servicios tecnológicos
            </h2>

            <p>
              El Sistema Caja Barranquilla utiliza determinados servicios
              tecnológicos de Google para apoyar funciones de almacenamiento,
              procesamiento y envío de información.
            </p>

            <p className="mt-4">
              Dependiendo de la configuración del sistema, pueden utilizarse
              servicios como Google Sheets y Gmail mediante las interfaces
              oficiales de programación (APIs) y mecanismos de autorización
              OAuth.
            </p>

            <h3 className="mt-6 mb-2 text-xl font-semibold">
              6.1 Uso de Gmail
            </h3>

            <p>
              La integración con Gmail tiene como finalidad permitir que el
              sistema envíe automáticamente al correo electrónico suministrado
              por el ciudadano los recibos o documentos correspondientes a su
              trámite.
            </p>

            <p className="mt-3">
              La autorización OAuth utilizada por el sistema se encuentra
              asociada a la cuenta institucional configurada para el envío de
              dichos mensajes.
            </p>

            <p className="mt-3">
              El sistema no utiliza esta autorización para leer,
              clasificar, analizar o procesar de manera general los mensajes
              personales contenidos en el buzón de correo. El acceso se
              utiliza para la funcionalidad específica de envío de mensajes
              desde la cuenta institucional autorizada.
            </p>

            <p className="mt-3">
              Los datos obtenidos mediante las APIs de Google serán utilizados
              únicamente para proporcionar las funciones para las cuales el
              usuario o responsable haya autorizado el acceso y de acuerdo con
              las políticas aplicables de Google.
            </p>

            <h3 className="mt-6 mb-2 text-xl font-semibold">
              6.2 Uso de Google Sheets
            </h3>

            <p>
              Google Sheets puede utilizarse como infraestructura de
              almacenamiento y consulta de información relacionada con los
              registros consulares, actuaciones, movimientos de caja,
              correlativos y reportes administrativos.
            </p>

            <p className="mt-3">
              El acceso a dichas hojas se encuentra restringido a las cuentas
              y servicios autorizados por el responsable del sistema.
            </p>
          </section>

          {/* 7 */}
          <section>
            <h2 className="mb-3 text-2xl font-semibold">
              7. Datos de Google utilizados por la aplicación
            </h2>

            <p>
              Cuando la aplicación utiliza Google OAuth para autorizar una
              cuenta institucional, la información de Google se trata
              únicamente en la medida necesaria para proporcionar la
              funcionalidad autorizada.
            </p>

            <p className="mt-4">
              En particular, la autorización de Gmail se utiliza para obtener
              las credenciales técnicas necesarias para que el servidor pueda
              efectuar envíos de correo autorizados.
            </p>

            <p className="mt-4">
              El sistema no vende, alquila ni comercializa los datos obtenidos
              mediante las APIs de Google.
            </p>

            <p className="mt-4">
              Los datos obtenidos de Google no se utilizarán para publicidad
              personalizada, elaboración de perfiles comerciales ni
              finalidades ajenas a la prestación de las funciones autorizadas
              de la aplicación.
            </p>
          </section>

          {/* 8 */}
          <section>
            <h2 className="mb-3 text-2xl font-semibold">
              8. Conservación de la información
            </h2>

            <p>
              Los datos personales podrán conservarse durante el tiempo
              necesario para cumplir las finalidades para las cuales fueron
              recolectados, atender obligaciones legales, administrativas,
              contables, documentales o de archivo, y garantizar la adecuada
              trazabilidad de los trámites realizados.
            </p>

            <p className="mt-3">
              La eliminación, actualización, conservación o archivo de la
              información estará sujeta a las obligaciones legales,
              administrativas y documentales que resulten aplicables.
            </p>
          </section>

          {/* 9 */}
          <section>
            <h2 className="mb-3 text-2xl font-semibold">
              9. Seguridad de la información
            </h2>

            <p>
              Se adoptan medidas técnicas y administrativas razonables
              destinadas a proteger la información contra pérdida,
              alteración, acceso no autorizado, divulgación indebida o
              utilización no autorizada.
            </p>

            <p className="mt-3">
              Entre las medidas utilizadas por el sistema pueden encontrarse
              mecanismos de autenticación, control de acceso, credenciales
              protegidas mediante variables de entorno, conexiones cifradas y
              restricciones de acceso a los servicios utilizados por la
              aplicación.
            </p>

            <p className="mt-3">
              El acceso a información administrativa y personal se encuentra
              limitado según las funciones y permisos asignados a los
              usuarios autorizados.
            </p>
          </section>

          {/* 10 */}
          <section>
            <h2 className="mb-3 text-2xl font-semibold">
              10. Compartición y transferencia de información
            </h2>

            <p>
              Los datos personales no serán comercializados ni vendidos a
              terceros.
            </p>

            <p className="mt-3">
              La información podrá ser tratada por proveedores tecnológicos
              utilizados para operar la plataforma cuando ello resulte
              necesario para la prestación de las funcionalidades del
              sistema, incluyendo servicios de infraestructura, alojamiento,
              almacenamiento o envío de correo electrónico.
            </p>

            <p className="mt-3">
              Asimismo, la información podrá ser suministrada cuando exista
              una obligación legal, requerimiento de autoridad competente,
              autorización del titular o cuando sea necesario para el
              cumplimiento de las funciones correspondientes.
            </p>
          </section>

          {/* 11 */}
          <section>
            <h2 className="mb-3 text-2xl font-semibold">
              11. Derechos de los titulares
            </h2>

            <p>
              De acuerdo con el régimen aplicable de protección de datos
              personales, los titulares podrán ejercer los derechos que les
              correspondan, incluyendo, según sea procedente:
            </p>

            <ul className="mt-4 list-disc space-y-2 pl-6">
              <li>Conocer la información personal objeto de tratamiento.</li>
              <li>Solicitar la actualización de sus datos.</li>
              <li>Solicitar la rectificación de información incorrecta o incompleta.</li>
              <li>Solicitar información sobre el uso dado a sus datos.</li>
              <li>
                Presentar solicitudes relacionadas con el tratamiento de sus
                datos personales.
              </li>
              <li>
                Solicitar la supresión de los datos cuando legalmente proceda.
              </li>
              <li>
                Presentar consultas o reclamos relacionados con el tratamiento
                de sus datos.
              </li>
            </ul>

            <p className="mt-4">
              El ejercicio de estos derechos estará sujeto a las excepciones,
              limitaciones y condiciones establecidas por la legislación
              aplicable.
            </p>
          </section>

          {/* 12 */}
          <section>
            <h2 className="mb-3 text-2xl font-semibold">
              12. Procedimiento para consultas y solicitudes
            </h2>

            <p>
              Las consultas o solicitudes relacionadas con datos personales
              podrán dirigirse al correo:
            </p>

            <p className="mt-3">
              <a
                href="mailto:info.consulvenez@gmail.com"
                className="font-medium underline"
              >
                info.consulvenez@gmail.com
              </a>
            </p>

            <p className="mt-4">
              La solicitud deberá permitir identificar al titular y describir
              de manera clara la información o actuación requerida. Cuando
              corresponda, podrán solicitarse documentos que permitan verificar
              la identidad o representación del solicitante.
            </p>
          </section>

          {/* 13 */}
          <section>
            <h2 className="mb-3 text-2xl font-semibold">
              13. Cookies y tecnologías similares
            </h2>

            <p>
              El sitio web y la aplicación pueden utilizar tecnologías
              necesarias para mantener sesiones, autenticación, seguridad y
              funcionamiento técnico de la plataforma.
            </p>

            <p className="mt-3">
              Estas tecnologías no se utilizan para vender datos personales a
              terceros ni para crear perfiles comerciales de los usuarios.
            </p>
          </section>

          {/* 14 */}
          <section>
            <h2 className="mb-3 text-2xl font-semibold">
              14. Cambios a esta política
            </h2>

            <p>
              Esta Política de Privacidad podrá actualizarse cuando resulte
              necesario debido a cambios en las funcionalidades del sistema,
              servicios tecnológicos utilizados, procedimientos administrativos
              o normativa aplicable.
            </p>

            <p className="mt-3">
              La versión vigente será publicada en esta misma dirección web.
            </p>
          </section>

          {/* 15 */}
          <section>
            <h2 className="mb-3 text-2xl font-semibold">
              15. Contacto
            </h2>

            <div className="rounded-lg border border-gray-200 bg-gray-50 p-5">
              <p className="font-semibold">
                Consulado General de la República Bolivariana de Venezuela en
                Barranquilla
              </p>

              <p className="mt-2">
                Sistema Caja Barranquilla
              </p>

              <p className="mt-2">
                Correo electrónico:{" "}
                <a
                  href="mailto:info.consulvenez@gmail.com"
                  className="underline"
                >
                  info.consulvenez@gmail.com
                </a>
              </p>

              <p className="mt-2">
                Sitio web:{" "}
                <a
                  href="https://consultaconsulvenezbarranquilla.app"
                  className="underline"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  consultaconsulvenezbarranquilla.app
                </a>
              </p>
            </div>
          </section>

          {/* Footer */}
          <footer className="border-t border-gray-200 pt-8 text-sm text-gray-500">
            <p>
              Última actualización: 30 de septiembre de 2026.
            </p>

            <p className="mt-2">
              Esta política se publica con fines informativos y de
              transparencia sobre el tratamiento de datos realizado mediante
              el Sistema Caja Barranquilla.
            </p>
          </footer>
        </div>
      </div>
    </main>
  );
}