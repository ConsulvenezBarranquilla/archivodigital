export function convertirNumero(valor: unknown): number {

    if (valor === null || valor === undefined || valor === "") {
        return 0;
    }

    if (typeof valor === "number") {
        return valor;
    }

    let texto = String(valor).trim();

    // Si contiene coma, asumimos formato colombiano:
    // 1.234,56 -> 1234.56
    if (texto.includes(",")) {

        texto = texto
            .replace(/\./g, "")
            .replace(",", ".");

    }

    const numero = Number(texto);

    return Number.isNaN(numero) ? 0 : numero;

}