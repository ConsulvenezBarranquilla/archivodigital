"use client";

import { useEffect, useState } from "react";

interface Props {
  mostrar: boolean;
  onCerrar: () => void;
}

export default function TotpUsuarioCard({
  mostrar,
  onCerrar,
}: Props) {
  const [configurado, setConfigurado] = useState(false);
  const [cargando, setCargando] = useState(false);

  const [qr, setQr] = useState("");
  const [secreto, setSecreto] = useState("");
  const [secretoCifrado, setSecretoCifrado] = useState("");

  const [codigo, setCodigo] = useState("");

  const [mensaje, setMensaje] = useState("");
  const [error, setError] = useState("");

  async function cargarEstado() {
    try {
      setCargando(true);
      setError("");

      const response = await fetch(
        "/api/usuarios/totp",
        {
          credentials: "include",
        }
      );

      const data = await response.json();

      if (!response.ok || !data.ok) {
        throw new Error(
          data.error ||
            "No fue posible consultar el estado del autenticador."
        );
      }

      setConfigurado(Boolean(data.configurado));
    } catch (err: any) {
      setError(
        err?.message ||
          "No fue posible consultar el autenticador."
      );
    } finally {
      setCargando(false);
    }
  }

  useEffect(() => {
    if (!mostrar) {
      return;
    }

    setQr("");
    setSecreto("");
    setSecretoCifrado("");
    setCodigo("");
    setMensaje("");
    setError("");

    cargarEstado();
  }, [mostrar]);

  async function iniciarConfiguracion() {
    try {
      setCargando(true);
      setError("");
      setMensaje("");

      const response = await fetch(
        "/api/usuarios/totp",
        {
          method: "POST",
          credentials: "include",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            accion: "iniciar",
          }),
        }
      );

      const data = await response.json();

      if (!response.ok || !data.ok) {
        throw new Error(
          data.error ||
            "No fue posible iniciar la configuración."
        );
      }

      setQr(data.uri);
      setSecreto(data.secreto);
      setSecretoCifrado(data.secretoCifrado);
      setCodigo("");
    } catch (err: any) {
      setError(
        err?.message ||
          "No fue posible iniciar la configuración."
      );
    } finally {
      setCargando(false);
    }
  }

  async function confirmarConfiguracion() {
    if (!codigo.trim()) {
      setError(
        "Introduzca el código de 6 dígitos."
      );
      return;
    }

    if (!/^\d{6}$/.test(codigo.trim())) {
      setError(
        "El código debe contener exactamente 6 dígitos."
      );
      return;
    }

    try {
      setCargando(true);
      setError("");
      setMensaje("");

      const response = await fetch(
        "/api/usuarios/totp",
        {
          method: "POST",
          credentials: "include",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            accion: "confirmar",
            secreto,
            secretoCifrado,
            codigo: codigo.trim(),
          }),
        }
      );

      const data = await response.json();

      if (!response.ok || !data.ok) {
        throw new Error(
          data.error ||
            "No fue posible confirmar el autenticador."
        );
      }

      setConfigurado(true);
      setQr("");
      setSecreto("");
      setSecretoCifrado("");
      setCodigo("");

      setMensaje(
        "Google Authenticator quedó configurado correctamente."
      );
    } catch (err: any) {
      setError(
        err?.message ||
          "No fue posible confirmar el autenticador."
      );
    } finally {
      setCargando(false);
    }
  }

  async function desactivar() {
    const confirmar = window.confirm(
      "¿Desea desactivar Google Authenticator para su usuario?"
    );

    if (!confirmar) {
      return;
    }

    try {
      setCargando(true);
      setError("");
      setMensaje("");

      const response = await fetch(
        "/api/usuarios/totp",
        {
          method: "POST",
          credentials: "include",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            accion: "desactivar",
          }),
        }
      );

      const data = await response.json();

      if (!response.ok || !data.ok) {
        throw new Error(
          data.error ||
            "No fue posible desactivar el autenticador."
        );
      }

      setConfigurado(false);

      setMensaje(
        "Google Authenticator fue desactivado."
      );
    } catch (err: any) {
      setError(
        err?.message ||
          "No fue posible desactivar el autenticador."
      );
    } finally {
      setCargando(false);
    }
  }

  if (!mostrar) {
    return null;
  }

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(0,0,0,0.55)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 1000,
        padding: "20px",
      }}
    >
      <div
        style={{
          width: "100%",
          maxWidth: "520px",
          background: "white",
          borderRadius: "14px",
          padding: "26px",
          boxShadow: "0 20px 50px rgba(0,0,0,0.25)",
        }}
      >
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: "20px",
          }}
        >
          <div>
            <h2
              style={{
                margin: 0,
                color: "#172554",
                fontSize: "20px",
              }}
            >
              🔐 Google Authenticator
            </h2>

            <div
              style={{
                marginTop: "6px",
                color: "#64748b",
                fontSize: "13px",
              }}
            >
              Autenticación requerida para autorizar firmas.
            </div>
          </div>

          <button
            type="button"
            onClick={onCerrar}
            style={{
              border: "none",
              background: "transparent",
              fontSize: "24px",
              cursor: "pointer",
              color: "#64748b",
            }}
          >
            ×
          </button>
        </div>

        {cargando && (
          <div
            style={{
              padding: "12px",
              marginBottom: "15px",
              background: "#f8fafc",
              borderRadius: "8px",
              color: "#475569",
            }}
          >
            Procesando...
          </div>
        )}

        {mensaje && (
          <div
            style={{
              padding: "12px",
              marginBottom: "15px",
              background: "#dcfce7",
              border: "1px solid #86efac",
              borderRadius: "8px",
              color: "#166534",
            }}
          >
            {mensaje}
          </div>
        )}

        {error && (
          <div
            style={{
              padding: "12px",
              marginBottom: "15px",
              background: "#fee2e2",
              border: "1px solid #fca5a5",
              borderRadius: "8px",
              color: "#991b1b",
            }}
          >
            {error}
          </div>
        )}

        {!configurado && !qr && (
          <>
            <div
              style={{
                padding: "16px",
                background: "#f8fafc",
                borderRadius: "10px",
                marginBottom: "18px",
              }}
            >
              <div
                style={{
                  fontWeight: 700,
                  marginBottom: "8px",
                  color: "#334155",
                }}
              >
                Estado
              </div>

              <div
                style={{
                  color: "#b45309",
                  fontWeight: 600,
                }}
              >
                ⚠ No configurado
              </div>
            </div>

            <button
              type="button"
              onClick={iniciarConfiguracion}
              disabled={cargando}
              style={{
                width: "100%",
                padding: "12px",
                borderRadius: "8px",
                border: "none",
                background: "#2563eb",
                color: "white",
                fontWeight: 600,
                cursor: cargando
                  ? "not-allowed"
                  : "pointer",
              }}
            >
              🔐 Configurar Google Authenticator
            </button>
          </>
        )}

        {!configurado && qr && (
          <>
            <div
              style={{
                textAlign: "center",
                marginBottom: "18px",
              }}
            >
              <div
                style={{
                  fontWeight: 600,
                  color: "#334155",
                  marginBottom: "12px",
                }}
              >
                1. Escanee este código QR con Google Authenticator
              </div>

              <div
                style={{
                  display: "inline-block",
                  padding: "12px",
                  background: "white",
                  border: "1px solid #e2e8f0",
                  borderRadius: "10px",
                }}
              >
                <img
                  src={`https://api.qrserver.com/v1/create-qr-code/?size=220x220&data=${encodeURIComponent(
                    qr
                  )}`}
                  alt="Código QR de Google Authenticator"
                  width={220}
                  height={220}
                />
              </div>
            </div>

            <div
              style={{
                padding: "12px",
                background: "#f8fafc",
                borderRadius: "8px",
                marginBottom: "18px",
              }}
            >
              <div
                style={{
                  fontSize: "13px",
                  color: "#64748b",
                  marginBottom: "5px",
                }}
              >
                Si no puede escanear el QR, introduzca manualmente
                esta clave:
              </div>

              <div
                style={{
                  fontFamily: "monospace",
                  fontWeight: 700,
                  letterSpacing: "2px",
                  wordBreak: "break-all",
                  color: "#172554",
                }}
              >
                {secreto}
              </div>
            </div>

            <label
              style={{
                display: "block",
                fontWeight: 600,
                color: "#334155",
                marginBottom: "7px",
              }}
            >
              2. Código de 6 dígitos
            </label>

            <input
              type="text"
              inputMode="numeric"
              maxLength={6}
              value={codigo}
              onChange={(e) =>
                setCodigo(
                  e.target.value
                    .replace(/\D/g, "")
                    .slice(0, 6)
                )
              }
              placeholder="000000"
              style={{
                width: "100%",
                boxSizing: "border-box",
                padding: "12px",
                borderRadius: "8px",
                border: "1px solid #cbd5e1",
                fontSize: "20px",
                letterSpacing: "5px",
                textAlign: "center",
                marginBottom: "15px",
              }}
            />

            <button
              type="button"
              onClick={confirmarConfiguracion}
              disabled={cargando}
              style={{
                width: "100%",
                padding: "12px",
                borderRadius: "8px",
                border: "none",
                background: "#008c45",
                color: "white",
                fontWeight: 600,
                cursor: cargando
                  ? "not-allowed"
                  : "pointer",
              }}
            >
              ✓ Confirmar y activar
            </button>
          </>
        )}

        {configurado && (
          <>
            <div
              style={{
                padding: "18px",
                background: "#dcfce7",
                border: "1px solid #86efac",
                borderRadius: "10px",
                marginBottom: "18px",
              }}
            >
              <div
                style={{
                  fontSize: "18px",
                  fontWeight: 700,
                  color: "#166534",
                  marginBottom: "6px",
                }}
              >
                ✓ Autenticador configurado
              </div>

              <div
                style={{
                  fontSize: "14px",
                  color: "#166534",
                }}
              >
                Su usuario ya puede utilizar Google Authenticator
                para autorizar operaciones de firma.
              </div>
            </div>

            <button
              type="button"
              onClick={desactivar}
              disabled={cargando}
              style={{
                width: "100%",
                padding: "11px",
                borderRadius: "8px",
                border: "1px solid #dc2626",
                background: "white",
                color: "#dc2626",
                fontWeight: 600,
                cursor: cargando
                  ? "not-allowed"
                  : "pointer",
              }}
            >
              Desactivar Google Authenticator
            </button>
          </>
        )}
      </div>
    </div>
  );
}