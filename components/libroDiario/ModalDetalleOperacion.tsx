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

}

export default function ModalDetalleOperacion({

  open,

  movimiento,

  onClose,

}: Props) {

  if (!open || !movimiento) {

    return null;

  }

  if (movimiento.origen === "PLANILLA") {

    return (

      <DetallePlanilla

        movimiento={movimiento}

        onClose={onClose}

      />

    );

  }

  return (

    <DetalleMovimiento

      movimiento={movimiento}

      onClose={onClose}

    />

  );

}