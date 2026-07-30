export function convertirFecha(
  fechaTexto: string
) {

  if (!fechaTexto) {
    return null;
  }

  const limpio = fechaTexto.trim();
// ------------------------------------------
// Formato DD/MM/YYYY o DD/MM/YYYY HH:mm:ss
// ------------------------------------------

if (limpio.includes("/")) {

  const partes = limpio.split(" ");

  const [dia, mes, anio] =
    partes[0].split("/").map(Number);

  let hora = 0;
  let minuto = 0;
  let segundo = 0;

  if (partes.length > 1) {

    const hms =
      partes[1].split(":").map(Number);

    hora = hms[0] || 0;
    minuto = hms[1] || 0;
    segundo = hms[2] || 0;

  }

  return new Date(

    anio,

    mes - 1,

    dia,

    hora,

    minuto,

    segundo

  );

}
  const partes = limpio
    .replace("T", " ")
    .split(" ");

  if (partes.length < 2) {

    const soloFecha = partes[0].split("-");

    if (soloFecha.length !== 3) {
      return null;
    }

    return new Date(
      Number(soloFecha[0]),
      Number(soloFecha[1]) - 1,
      Number(soloFecha[2])
    );

  }

  const [fecha, hora] = partes;

  const [anio, mes, dia] =
    fecha.split("-").map(Number);

  const [h, m, s] =
    hora.split(":").map(Number);

  return new Date(
    anio,
    mes - 1,
    dia,
    h,
    m,
    s
  );

}
export function formatoFechaHoraRecibo(
  fechaTexto: string
) {

  if (!fechaTexto) return "";

  const [fecha, hora] = fechaTexto.split(" ");

  const [anio, mes, dia] =
    fecha.split("-");

  return `${dia}/${mes}/${anio} ${hora}`;

}
export function inicioDelDia(
  fecha: string
) {

  return convertirFecha(
    `${fecha} 00:00:00`
  );

}

export function finDelDia(
  fecha: string
) {

  return convertirFecha(
    `${fecha} 23:59:59`
  );

}
export function hoy() {

  const ahora = new Date();

  return new Date(
    ahora.getFullYear(),
    ahora.getMonth(),
    ahora.getDate()
  );

}
export function hoyISO() {

  return new Intl.DateTimeFormat(
    "sv-SE",
    {
      timeZone: "America/Bogota",
    }
  ).format(new Date());

}
export function fechaHoraActual() {

  return new Intl.DateTimeFormat(
    "sv-SE",
    {
      timeZone: "America/Bogota",
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      hour12: false,
    }
  ).format(new Date());

}
export function anioActual() {

    return Number(
        hoyISO().substring(0,4)
    );

}
export function formatoFechaHora(
  fechaTexto: string
) {

  const fecha =
    convertirFecha(fechaTexto);

  if (!fecha) {

    return fechaTexto;

  }

  return fecha.toLocaleString(
    "es-CO",
    {
      timeZone: "America/Bogota",
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      hour12: true,
    }
  );

}
/*------------------------------------------
 FECHA PARA INPUT TYPE="DATE"
------------------------------------------*/

export function fechaInput(

  fechaTexto: string

) {

  const fecha = convertirFecha(fechaTexto);

  if (!fecha) {

    return "";

  }

  const anio = fecha.getFullYear();

  const mes = String(

    fecha.getMonth() + 1

  ).padStart(2, "0");

  const dia = String(

    fecha.getDate()

  ).padStart(2, "0");

  return `${anio}-${mes}-${dia}`;

}
export function fechaDesdeInput(
  fecha: string
) {

  if (!fecha) {

    return "";

  }

  const [anio, mes, dia] = fecha.split("-");

  return `${dia}/${mes}/${anio}`;

}