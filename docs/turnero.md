# Turnero de Atención Consular

## Operación

- Recepción registra la visita en `BitacoraVisitas` y crea un turno para las categorías `Información` y `Trámite`. La pestaña conserva A:G para los datos históricos; H guarda el ID de turno e I el ID de solicitud idempotente.
- Recepción ve y modifica únicamente turnos de `Información`. Caja ve y modifica turnos de `Información` y `Trámite`. Las opciones existentes `Acompañante` y `Cita Institucional` siguen guardándose en la bitácora y no entran a estas colas, que solo admiten los dos tipos requeridos por el flujo.
- Después de escribir el recibo y todos sus detalles en Caja, la API valida los códigos contra el catálogo activo `Actuaciones` y crea un turno independiente para cada pasaporte, apostilla, visa, constancia de registro consular o reseteo SAIME elegible.
- La cola compartida de analistas aparece en `/atencion`. Sus turnos conservan el orden de entrada y se mantienen separados aunque pertenezcan al mismo recibo.
- La pantalla del televisor se abre directamente en `/turnero`; no requiere sesión.

## Persistencia y recuperación

Upstash Redis es la fuente de verdad del estado activo de las colas. Usa `KV_REST_API_URL` y `KV_REST_API_TOKEN`, ya requeridas por la autenticación existente. Scripts Lua realizan la creación idempotente y las transiciones de estado de forma atómica; un contador Redis entrega un orden FIFO estable.

La pestaña `TurnosAtencion`, creada dentro del libro identificado por `MODULO_CAJA_SHEET_ID`, recibe un historial con estas columnas: Evento ID, Turno ID, Evento, Creado el, Nombre, Documento, Tipo de visita, Cola, Estado, Etapa, Actuación, Recibo, Visita ID, Detalle ID, Usuario, Fecha de actualización y Caja. Redis conserva una cola de salida y cada lectura/escritura intenta replicar eventos pendientes.

Redis y Google Sheets no comparten transacciones. Por eso el turno confirmado depende de Redis, y Sheets es el registro histórico replicado. Si Sheets falla después de guardar Redis, el evento permanece en la cola de salida y se intenta de nuevo en la siguiente consulta o acción. Si una instancia cae después de que Google acepte el append y antes de que Redis confirme la salida, el historial de Sheets puede contener dos filas con el mismo Evento ID; el turno activo no se duplica. La infraestructura existente no permite garantizar exactamente una fila entre esos dos servicios.

Si falla la transferencia de actuaciones después de guardar el recibo, Caja muestra el botón de recuperación del mismo correlativo. `POST /api/turnos/recuperar` vuelve a leer Caja, `DetalleCaja` y `Actuaciones` y usa claves idempotentes `recibo:<correlativo>:detalle:<posición>`. No vuelve a facturar.

## Permisos y datos públicos

`/api/turnos` verifica la sesión en el servidor y filtra operaciones por rol. La pantalla pública consulta solamente `/api/turnos/publico`, que devuelve el nombre, el tipo de llamado, la actuación cuando llama Analistas, la caja cuando llama Caja y la fecha. No entrega documento, correo, teléfono, ID interno, recibo, sesión ni otras atenciones.
