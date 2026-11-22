
import { calcularResiduo, normaInf } from "./metodos.js";

export function calcularErrorEscalar(referencia, aproximacion) {
    const absoluto = Math.abs(referencia - aproximacion);
    const relativo = referencia !== 0
        ? absoluto / Math.abs(referencia)
        : null;

    return {
        absoluto,
        relativo,
        porcentual: relativo === null ? null : relativo * 100
    };
}

export function calcularErrores(aproximacion, referencia, A, b) {
    const errores = referencia.map((valor, i) => ({
        variable: "x" + (i + 1),
        referencia: valor,
        aproximacion: aproximacion[i],
        ...calcularErrorEscalar(valor, aproximacion[i])
    }));

    const residuoVector = calcularResiduo(A, b, aproximacion);

    return {
        errores,
        residuoVector,
        normaResiduo: normaInf(residuoVector),
        errorMaximo: Math.max(...errores.map(e => e.absoluto))
    };
}

export function formatoNumero(valor) {
    if (valor === null || valor === undefined || !Number.isFinite(Number(valor))) {
        return "No definido";
    }
    return Number(valor).toExponential(6);
}
