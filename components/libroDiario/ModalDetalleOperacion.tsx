"use client";

import {
  MovimientoLibro,
} from "@/types/LibroDiario";

import DetallePlanilla from "./DetallePlanilla";
import DetalleMovimiento from "./DetalleMovimiento";

interface Props {

  open: boolean;

  movimiento: MovimientoLibro | null;

  onClose: () => void;

  onActualizado?: () => void | Promise<void>;

}

export default function ModalDetalleOperacion({

  open,

  movimiento,

  onClose,

  onActualizado,

}: Props) {

  if (!open || !movimiento) {

    return null;

  }

  // ======================================================
  // OPERACIONES DE GESTIÓN CONSULAR / PLANILLA
  // ======================================================

  if (
    movimiento.origen === "PLANILLA"
  ) {

    return (

      <DetallePlanilla

        movimiento={movimiento}

        onClose={onClose}

      />

    );

  }

  // ======================================================
  // MOVIMIENTO MANUAL
  // ======================================================

  return (

    <DetalleMovimiento

      movimiento={movimiento}

      onClose={onClose}

      onActualizado={onActualizado}

    />

  );

}