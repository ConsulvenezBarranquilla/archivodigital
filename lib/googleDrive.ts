import { google } from "googleapis";
import { Readable } from "node:stream";

/*------------------------------------------
AUTENTICACIÓN GOOGLE DRIVE
------------------------------------------*/

const GOOGLE_DRIVE_CLIENT_ID =
  process.env.GOOGLE_DRIVE_CLIENT_ID || "";

const GOOGLE_DRIVE_CLIENT_SECRET =
  process.env.GOOGLE_DRIVE_CLIENT_SECRET || "";

const GOOGLE_DRIVE_REFRESH_TOKEN =
  process.env.GOOGLE_DRIVE_REFRESH_TOKEN || "";


const oauth2Client =
  new google.auth.OAuth2(
    GOOGLE_DRIVE_CLIENT_ID,
    GOOGLE_DRIVE_CLIENT_SECRET
  );


oauth2Client.setCredentials({
  refresh_token:
    GOOGLE_DRIVE_REFRESH_TOKEN,
});


const drive =
  google.drive({
    version: "v3",
    auth:
      oauth2Client,
  });

/*------------------------------------------
CONFIGURACIÓN
------------------------------------------*/

const GOOGLE_DRIVE_ROOT_FOLDER_ID =
  process.env.GOOGLE_DRIVE_ROOT_FOLDER_ID || "";

/*------------------------------------------
TIPOS
------------------------------------------*/

export interface SubirArchivoDriveParams {
  archivo: File;
  categoria: string;
  tipoArchivo: string;
  documentoId: string;
  archivoIdExistente?: string;
}

/*------------------------------------------
VALIDACIONES
------------------------------------------*/

const TIPOS_PERMITIDOS: Record<string, string[]> = {
  CONSTANCIA_REGISTRO: [
    "PDF_CONSTANCIA",
    "PDF_FIRMADO",
    "FOTO_CARNET",
  ],

  FIRMAS_USUARIOS: [
    "FIRMA_VISUAL",
  ],
};

const MIME_PERMITIDOS: Record<string, string[]> = {
  PDF_CONSTANCIA: [
    "application/pdf",
  ],

  PDF_FIRMADO: [
    "application/pdf",
  ],

  FOTO_CARNET: [
    "image/jpeg",
    "image/jpg",
    "image/png",
    "image/webp",
  ],

  FIRMA_VISUAL: [
  "image/png",
  "image/jpeg",
  "image/jpg",
  "image/webp",
],
};

/*------------------------------------------
NOMBRE SEGURO
------------------------------------------*/

function nombreSeguro(
  nombre: string
) {
  return nombre
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-zA-Z0-9._-]/g, "_");
}

/*------------------------------------------
OBTENER EXTENSIÓN
------------------------------------------*/

function obtenerExtension(
  nombre: string,
  mimeType: string
) {
  const extension =
    nombre
      .split(".")
      .pop()
      ?.toLowerCase();

  if (
    extension &&
    extension !== nombre.toLowerCase()
  ) {
    return extension;
  }

  if (
    mimeType ===
    "application/pdf"
  ) {
    return "pdf";
  }

  if (
    mimeType ===
      "image/jpeg" ||
    mimeType ===
      "image/jpg"
  ) {
    return "jpg";
  }

  if (
    mimeType ===
    "image/png"
  ) {
    return "png";
  }

  if (
    mimeType ===
    "image/webp"
  ) {
    return "webp";
  }

  return "bin";
}

/*------------------------------------------
BUSCAR CARPETA
------------------------------------------*/

async function buscarCarpeta(
  nombre: string,
  carpetaPadre: string
) {
  const response =
    await drive.files.list({
      q:
        `'${carpetaPadre}' in parents ` +
        `and name = '${nombre.replace(/'/g, "\\'")}' ` +
        `and mimeType = 'application/vnd.google-apps.folder' ` +
        `and trashed = false`,

      fields:
        "files(id,name)",

      pageSize: 1,
    });

  return (
    response.data.files?.[0] ||
    null
  );
}

/*------------------------------------------
CREAR / OBTENER CARPETA
------------------------------------------*/

async function obtenerOCrearCarpeta(
  nombre: string,
  carpetaPadre: string
) {
  const existente =
    await buscarCarpeta(
      nombre,
      carpetaPadre
    );

  if (
    existente?.id
  ) {
    return existente.id;
  }

  const response =
    await drive.files.create({
      requestBody: {
        name: nombre,
        mimeType:
          "application/vnd.google-apps.folder",
        parents: [
          carpetaPadre,
        ],
      },

      fields:
        "id,name",
    });

  if (
    !response.data.id
  ) {
    throw new Error(
      `No se pudo crear la carpeta "${nombre}".`
    );
  }

  return response.data.id;
}

/*------------------------------------------
OBTENER CARPETA DEL DOCUMENTO
------------------------------------------*/

async function obtenerCarpetaDocumento(
  categoria: string,
  documentoId: string
) {
  if (
    !GOOGLE_DRIVE_ROOT_FOLDER_ID
  ) {
    throw new Error(
      "Falta configurar GOOGLE_DRIVE_ROOT_FOLDER_ID."
    );
  }

  const carpetaCategoria =
    await obtenerOCrearCarpeta(
      categoria,
      GOOGLE_DRIVE_ROOT_FOLDER_ID
    );

  const carpetaDocumento =
    await obtenerOCrearCarpeta(
      documentoId,
      carpetaCategoria
    );

  return carpetaDocumento;
}

/*------------------------------------------
SUBIR / ACTUALIZAR ARCHIVO
------------------------------------------*/

export async function subirArchivoDrive(
  params: SubirArchivoDriveParams
) {
  const {
    archivo,
    categoria,
    tipoArchivo,
    documentoId,
    archivoIdExistente,
  } = params;

  if (
    !archivo
  ) {
    throw new Error(
      "No se recibió ningún archivo."
    );
  }

  if (
    !categoria
  ) {
    throw new Error(
      "La categoría del archivo es obligatoria."
    );
  }

  if (
    !tipoArchivo
  ) {
    throw new Error(
      "El tipo de archivo es obligatorio."
    );
  }

  if (
    !documentoId
  ) {
    throw new Error(
      "El documentoId es obligatorio."
    );
  }

  /*----------------------------------------
  VALIDAR CATEGORÍA
  ----------------------------------------*/

  const tiposCategoria =
    TIPOS_PERMITIDOS[
      categoria
    ];

  if (
    !tiposCategoria
  ) {
    throw new Error(
      `La categoría "${categoria}" no está habilitada para carga de archivos.`
    );
  }

  /*----------------------------------------
  VALIDAR TIPO
  ----------------------------------------*/

  if (
    !tiposCategoria.includes(
      tipoArchivo
    )
  ) {
    throw new Error(
      `El tipo "${tipoArchivo}" no está permitido para ${categoria}.`
    );
  }

  /*----------------------------------------
  VALIDAR MIME
  ----------------------------------------*/

  const mimePermitidos =
    MIME_PERMITIDOS[
      tipoArchivo
    ] || [];

  if (
    !mimePermitidos.includes(
      archivo.type
    )
  ) {
    throw new Error(
      `El archivo recibido (${archivo.type}) no es válido para ${tipoArchivo}.`
    );
  }

  /*----------------------------------------
  LÍMITE DE TAMAÑO
  ----------------------------------------*/

  const MAX_SIZE =
    10 * 1024 * 1024;

  if (
    archivo.size >
    MAX_SIZE
  ) {
    throw new Error(
      "El archivo supera el límite máximo de 10 MB."
    );
  }

  /*----------------------------------------
  CARPETA
  ----------------------------------------*/

  const carpetaId =
    await obtenerCarpetaDocumento(
      categoria,
      documentoId
    );

  /*----------------------------------------
  NOMBRE
  ----------------------------------------*/

  const extension =
    obtenerExtension(
      archivo.name,
      archivo.type
    );

  let nombreArchivo =
    `${documentoId}_${tipoArchivo}.${extension}`;

  nombreArchivo =
    nombreSeguro(
      nombreArchivo
    );

  /*----------------------------------------
  CONTENIDO
  ----------------------------------------*/

  const arrayBuffer =
    await archivo.arrayBuffer();

  const buffer =
    Buffer.from(
      arrayBuffer
    );

  const stream =
    Readable.from(
      buffer
    );

  /*----------------------------------------
  ACTUALIZAR ARCHIVO EXISTENTE
  ----------------------------------------*/

  if (
    archivoIdExistente
  ) {
    const response =
      await drive.files.update({
        fileId:
          archivoIdExistente,

        requestBody: {
          name:
            nombreArchivo,
          mimeType:
            archivo.type,
        },

        media: {
          mimeType:
            archivo.type,
          body:
            stream,
        },

        fields:
          "id,name,mimeType,size,modifiedTime",
      });

    if (
      !response.data.id
    ) {
      throw new Error(
        "Google Drive no devolvió el ID del archivo actualizado."
      );
    }

    return {
      id:
        response.data.id,

      nombre:
        response.data.name ||
        nombreArchivo,

      mimeType:
        response.data.mimeType ||
        archivo.type,

      size:
        response.data.size ||
        String(archivo.size),

      actualizado:
        true,
    };
  }

  /*----------------------------------------
  CREAR ARCHIVO NUEVO
  ----------------------------------------*/

  const response =
    await drive.files.create({
      requestBody: {
        name:
          nombreArchivo,

        mimeType:
          archivo.type,

        parents: [
          carpetaId,
        ],
      },

      media: {
        mimeType:
          archivo.type,

        body:
          stream,
      },

      fields:
        "id,name,mimeType,size,createdTime",
    });

  if (
    !response.data.id
  ) {
    throw new Error(
      "Google Drive no devolvió el ID del archivo creado."
    );
  }

  return {
    id:
      response.data.id,

    nombre:
      response.data.name ||
      nombreArchivo,

    mimeType:
      response.data.mimeType ||
      archivo.type,

    size:
      response.data.size ||
      String(archivo.size),

    creado:
      true,
  };
}
/*------------------------------------------
SUBIR FIRMA VISUAL
------------------------------------------*/

export async function subirFirmaDrive(
  archivo: File,
  usuario: string,
  idFirma: string
) {
  if (!archivo) {
    throw new Error(
      "No se recibió ningún archivo de firma."
    );
  }

  if (!usuario) {
    throw new Error(
      "El usuario de la firma es obligatorio."
    );
  }

  if (!idFirma) {
    throw new Error(
      "El idFirma es obligatorio."
    );
  }

  /*----------------------------------------
  VALIDAR MIME
  ----------------------------------------*/

  const mimePermitidos =
    MIME_PERMITIDOS["FIRMA_VISUAL"] || [];

  if (
    !mimePermitidos.includes(
      archivo.type
    )
  ) {
    throw new Error(
      `El archivo recibido (${archivo.type}) no es válido para una firma visual.`
    );
  }

  /*----------------------------------------
  LÍMITE DE TAMAÑO
  ----------------------------------------*/

  const MAX_SIZE =
    10 * 1024 * 1024;

  if (
    archivo.size >
    MAX_SIZE
  ) {
    throw new Error(
      "La firma supera el límite máximo de 10 MB."
    );
  }

  /*----------------------------------------
  CARPETA FIRMAS
  ----------------------------------------*/

  if (
    !GOOGLE_DRIVE_ROOT_FOLDER_ID
  ) {
    throw new Error(
      "Falta configurar GOOGLE_DRIVE_ROOT_FOLDER_ID."
    );
  }

  const carpetaFirmas =
    await obtenerOCrearCarpeta(
      "FIRMAS_USUARIOS",
      GOOGLE_DRIVE_ROOT_FOLDER_ID
    );

  /*----------------------------------------
  CARPETA DEL USUARIO
  ----------------------------------------*/

  const usuarioSeguro =
    nombreSeguro(usuario);

  const carpetaUsuario =
    await obtenerOCrearCarpeta(
      usuarioSeguro,
      carpetaFirmas
    );

  /*----------------------------------------
  NOMBRE DEL ARCHIVO
  ----------------------------------------*/

  const extension =
    obtenerExtension(
      archivo.name,
      archivo.type
    );

  let nombreArchivo =
    `${idFirma}_FIRMA_VISUAL.${extension}`;

  nombreArchivo =
    nombreSeguro(
      nombreArchivo
    );

  /*----------------------------------------
  CONTENIDO
  ----------------------------------------*/

  const arrayBuffer =
    await archivo.arrayBuffer();

  const buffer =
    Buffer.from(
      arrayBuffer
    );

  const stream =
    Readable.from(
      buffer
    );

  /*----------------------------------------
  CREAR ARCHIVO
  ----------------------------------------*/

  const response =
    await drive.files.create({
      requestBody: {
        name:
          nombreArchivo,

        mimeType:
          archivo.type,

        parents: [
          carpetaUsuario,
        ],
      },

      media: {
        mimeType:
          archivo.type,

        body:
          stream,
      },

      fields:
        "id,name,mimeType,size,createdTime",
    });

  if (
    !response.data.id
  ) {
    throw new Error(
      "Google Drive no devolvió el ID de la firma creada."
    );
  }

  return {
    id:
      response.data.id,

    nombre:
      response.data.name ||
      nombreArchivo,

    mimeType:
      response.data.mimeType ||
      archivo.type,

    size:
      response.data.size ||
      String(archivo.size),

    creado:
      true,
  };
}

/*------------------------------------------
SUBIR SELLO INSTITUCIONAL
------------------------------------------*/

export async function subirSelloDrive(
  archivo: File,
  idSello: string
) {

  if (!archivo) {
    throw new Error(
      "No se recibió ningún archivo de sello."
    );
  }

  if (!idSello) {
    throw new Error(
      "El idSello es obligatorio."
    );
  }

  /*----------------------------------------
  VALIDAR MIME
  ----------------------------------------*/

  const mimePermitidos = [
    "image/png",
    "image/jpeg",
    "image/jpg",
    "image/webp",
  ];

  if (
    !mimePermitidos.includes(
      archivo.type
    )
  ) {
    throw new Error(
      `El archivo recibido (${archivo.type}) no es válido para un sello institucional.`
    );
  }

  /*----------------------------------------
  LÍMITE DE TAMAÑO
  ----------------------------------------*/

  const MAX_SIZE =
    10 * 1024 * 1024;

  if (
    archivo.size >
    MAX_SIZE
  ) {
    throw new Error(
      "El sello supera el límite máximo de 10 MB."
    );
  }

  /*----------------------------------------
  CARPETA SELLOS
  ----------------------------------------*/

  if (
    !GOOGLE_DRIVE_ROOT_FOLDER_ID
  ) {
    throw new Error(
      "Falta configurar GOOGLE_DRIVE_ROOT_FOLDER_ID."
    );
  }

  const carpetaSellos =
    await obtenerOCrearCarpeta(
      "SELLOS_INSTITUCIONALES",
      GOOGLE_DRIVE_ROOT_FOLDER_ID
    );

  /*----------------------------------------
  NOMBRE DEL ARCHIVO
  ----------------------------------------*/

  const extension =
    obtenerExtension(
      archivo.name,
      archivo.type
    );

  let nombreArchivo =
    `${idSello}_SELLO_DIGITAL.${extension}`;

  nombreArchivo =
    nombreSeguro(
      nombreArchivo
    );

  /*----------------------------------------
  CONTENIDO
  ----------------------------------------*/

  const arrayBuffer =
    await archivo.arrayBuffer();

  const buffer =
    Buffer.from(
      arrayBuffer
    );

  const stream =
    Readable.from(
      buffer
    );

  /*----------------------------------------
  CREAR ARCHIVO
  ----------------------------------------*/

  const response =
    await drive.files.create({
      requestBody: {
        name:
          nombreArchivo,

        mimeType:
          archivo.type,

        parents: [
          carpetaSellos,
        ],
      },

      media: {
        mimeType:
          archivo.type,

        body:
          stream,
      },

      fields:
        "id,name,mimeType,size,createdTime",
    });

  if (
    !response.data.id
  ) {
    throw new Error(
      "Google Drive no devolvió el ID del sello creado."
    );
  }

  return {
    id:
      response.data.id,

    nombre:
      response.data.name ||
      nombreArchivo,

    mimeType:
      response.data.mimeType ||
      archivo.type,

    size:
      response.data.size ||
      String(archivo.size),

    creado:
      true,
  };
}

/*------------------------------------------
DESCARGAR ARCHIVO
------------------------------------------*/

export async function descargarArchivoDrive(
  archivoId: string
) {

  if (!archivoId) {

    throw new Error(
      "El archivoId es obligatorio."
    );

  }

  const response =
    await drive.files.get({

      fileId:
        archivoId,

      alt:
        "media",

    }, {

      responseType:
        "arraybuffer",

    });

  return Buffer.from(
    response.data as ArrayBuffer
  );

}

/** Guarda un archivo de respaldo en una carpeta dedicada dentro del Drive
 *  usado por los documentos firmados. */
export async function subirRespaldoDrive(
  nombreArchivo: string,
  contenido: Buffer
) {
  if (!GOOGLE_DRIVE_ROOT_FOLDER_ID) {
    throw new Error("Falta configurar GOOGLE_DRIVE_ROOT_FOLDER_ID.");
  }
  if (!nombreArchivo || !contenido.length) {
    throw new Error("El nombre y el contenido del respaldo son obligatorios.");
  }

  const carpetaRespaldos = await obtenerOCrearCarpeta(
    "Respaldos",
    GOOGLE_DRIVE_ROOT_FOLDER_ID
  );
  const nombreSeguroArchivo = nombreSeguro(nombreArchivo);
  const mimeType = "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet";
  const response = await drive.files.create({
    requestBody: {
      name: nombreSeguroArchivo,
      mimeType,
      parents: [carpetaRespaldos],
    },
    media: {
      mimeType,
      body: Readable.from(contenido),
    },
    fields: "id,name,size,createdTime",
  });

  if (!response.data.id) {
    throw new Error(`Drive no devolvió el ID de ${nombreSeguroArchivo}.`);
  }

  return {
    id: response.data.id,
    nombre: response.data.name || nombreSeguroArchivo,
    creado: response.data.createdTime || new Date().toISOString(),
  };
}
