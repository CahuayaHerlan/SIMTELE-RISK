// ============================================
// SIMTELE-RISK - TEORÍA DE ERRORES
// ============================================

import {
    calcularResiduo,
    normaInf
} from "./metodos.js";

export function calcularErrores(
    aproximacion,
    referencia,
    A,
    b
) {
    let errores = [];

    for (let i = 0; i < referencia.length; i++) {
        let errorAbsoluto = Math.abs(
            referencia[i] - aproximacion[i]
        );

        let errorRelativo = null;
        let errorPorcentual = null;

        if (referencia[i] !== 0) {
            errorRelativo =
                errorAbsoluto / Math.abs(referencia[i]);

            errorPorcentual = errorRelativo * 100;
        }

        errores.push({
            variable: "x" + (i + 1),
            referencia: referencia[i],
            aproximacion: aproximacion[i],
            absoluto: errorAbsoluto,
            relativo: errorRelativo,
            porcentual: errorPorcentual
        });
    }

    let residuoVector = calcularResiduo(
        A,
        b,
        aproximacion
    );

    return {
        errores,
        residuoVector,
        normaResiduo: normaInf(residuoVector),
        errorMaximo: Math.max(
            ...errores.map(e => e.absoluto)
        )
    };
}

export function formatoNumero(valor) {
    if (valor === null || valor === undefined) {
        return "No definido";
    }

    if (!Number.isFinite(valor)) {
        return "No definido";
    }

    return Number(valor).toExponential(6);
}