export function convertirFecha(
  fechaTexto: string
) {

  if (!fechaTexto) {
    return null;
  }

  const limpio =
    fechaTexto.trim();

  // Ya viene en formato ISO
  if (limpio.includes("T")) {

    const fecha =
      new Date(limpio);

    return isNaN(fecha.getTime())
      ? null
      : fecha;

  }

  // Solo fecha
  if (
    limpio.length === 10 &&
    limpio.includes("-")
  ) {

    const fecha =
      new Date(
        `${limpio}T00:00:00`
      );

    return isNaN(fecha.getTime())
      ? null
      : fecha;

  }

  // Fecha + hora separadas por espacio
  const partes =
    limpio.split(" ");

  if (partes.length < 2) {
    return null;
  }

  const fecha =
    partes[0];

  let hora =
    partes[1];

  const hms =
    hora.split(":");

  if (
    hms[0].length === 1
  ) {

    hms[0] =
      "0" + hms[0];

  }

  hora =
    hms.join(":");

  const resultado =
    new Date(
      `${fecha}T${hora}`
    );

  return isNaN(resultado.getTime())
    ? null
    : resultado;

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