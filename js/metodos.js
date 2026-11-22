// ============================================
// SIMTELE-RISK - MÉTODOS NUMÉRICOS
// ============================================

export function multiplicarMatrizVector(A, x) {
    let resultado = [];

    for (let i = 0; i < A.length; i++) {
        let suma = 0;

        for (let j = 0; j < x.length; j++) {
            suma += A[i][j] * x[j];
        }

        resultado.push(suma);
    }

    return resultado;
}

export function normaInf(v) {
    let mayor = 0;

    for (let i = 0; i < v.length; i++) {
        if (Math.abs(v[i]) > mayor) {
            mayor = Math.abs(v[i]);
        }
    }

    return mayor;
}

export function calcularResiduo(A, b, x) {
    let Ax = multiplicarMatrizVector(A, x);
    let residuo = [];

    for (let i = 0; i < b.length; i++) {
        residuo.push(b[i] - Ax[i]);
    }

    return residuo;
}

function productoPunto(a, b) {
    let suma = 0;

    for (let i = 0; i < a.length; i++) {
        suma += a[i] * b[i];
    }

    return suma;
}

function registrarIteracion(iteraciones, k, x, residuo) {
    iteraciones.push({
        numero: k,
        aproximacion: [...x],
        residual: residuo
    });
}

// ============================================
// MÉTODO DE JACOBI
// ============================================

export function jacobi(A, b, tolerancia = 1e-8, maxIter = 500) {
    const n = b.length;

    let x = new Array(n).fill(0);
    let nuevo = new Array(n).fill(0);
    let iteraciones = [];

    let residual = normaInf(calcularResiduo(A, b, x));

    registrarIteracion(iteraciones, 0, x, residual);

    for (let k = 1; k <= maxIter; k++) {
        for (let i = 0; i < n; i++) {
            let suma = 0;

            if (A[i][i] === 0) {
                throw new Error("La diagonal contiene un cero.");
            }

            for (let j = 0; j < n; j++) {
                if (i !== j) {
                    suma += A[i][j] * x[j];
                }
            }

            nuevo[i] = (b[i] - suma) / A[i][i];
        }

        x = [...nuevo];

        residual = normaInf(calcularResiduo(A, b, x));

        registrarIteracion(iteraciones, k, x, residual);

        if (residual <= tolerancia) {
            return {
                x,
                iteraciones,
                convergio: true,
                mensaje: "Jacobi alcanzó la tolerancia."
            };
        }
    }

    return {
        x,
        iteraciones,
        convergio: false,
        mensaje: "Jacobi alcanzó el máximo de iteraciones."
    };
}

// ============================================
// MÉTODO DE GAUSS-SEIDEL
// ============================================

export function gaussSeidel(A, b, tolerancia = 1e-8, maxIter = 500) {
    const n = b.length;

    let x = new Array(n).fill(0);
    let iteraciones = [];

    let residual = normaInf(calcularResiduo(A, b, x));

    registrarIteracion(iteraciones, 0, x, residual);

    for (let k = 1; k <= maxIter; k++) {
        for (let i = 0; i < n; i++) {
            if (A[i][i] === 0) {
                throw new Error("La diagonal contiene un cero.");
            }

            let suma = 0;

            for (let j = 0; j < n; j++) {
                if (i !== j) {
                    suma += A[i][j] * x[j];
                }
            }

            x[i] = (b[i] - suma) / A[i][i];
        }

        residual = normaInf(calcularResiduo(A, b, x));

        registrarIteracion(iteraciones, k, x, residual);

        if (residual <= tolerancia) {
            return {
                x: [...x],
                iteraciones,
                convergio: true,
                mensaje: "Gauss-Seidel alcanzó la tolerancia."
            };
        }
    }

    return {
        x: [...x],
        iteraciones,
        convergio: false,
        mensaje: "Gauss-Seidel alcanzó el máximo de iteraciones."
    };
}

// ============================================
// DESCOMPOSICIÓN LU CON PIVOTEO PARCIAL
// ============================================

export function resolverLU(A, b) {
    const n = b.length;

    let M = A.map(fila => [...fila]);
    let L = Array.from(
        { length: n },
        () => new Array(n).fill(0)
    );

    let P = Array.from({ length: n }, (_, i) => i);

    for (let i = 0; i < n; i++) {
        L[i][i] = 1;
    }

    // Eliminación con pivotaje parcial.

    for (let k = 0; k < n; k++) {
        let mayor = Math.abs(M[k][k]);
        let filaPivote = k;

        for (let i = k + 1; i < n; i++) {
            if (Math.abs(M[i][k]) > mayor) {
                mayor = Math.abs(M[i][k]);
                filaPivote = i;
            }
        }

        if (mayor < 1e-14) {
            throw new Error("La matriz es singular o casi singular.");
        }

        if (filaPivote !== k) {
            [M[k], M[filaPivote]] = [M[filaPivote], M[k]];
            [P[k], P[filaPivote]] = [P[filaPivote], P[k]];

            for (let j = 0; j < k; j++) {
                [L[k][j], L[filaPivote][j]] =
                    [L[filaPivote][j], L[k][j]];
            }
        }

        for (let i = k + 1; i < n; i++) {
            let factor = M[i][k] / M[k][k];

            L[i][k] = factor;

            for (let j = k; j < n; j++) {
                M[i][j] -= factor * M[k][j];
            }
        }
    }

    let y = new Array(n).fill(0);
    let pb = P.map(i => b[i]);

    // Sustitución hacia adelante: Ly = Pb.

    for (let i = 0; i < n; i++) {
        let suma = 0;

        for (let j = 0; j < i; j++) {
            suma += L[i][j] * y[j];
        }

        y[i] = pb[i] - suma;
    }

    // Sustitución hacia atrás: Ux = y.

    let x = new Array(n).fill(0);

    for (let i = n - 1; i >= 0; i--) {
        let suma = 0;

        for (let j = i + 1; j < n; j++) {
            suma += M[i][j] * x[j];
        }

        x[i] = (y[i] - suma) / M[i][i];
    }

    const residual = normaInf(calcularResiduo(A, b, x));

    return {
        x,
        iteraciones: [
            {
                numero: 1,
                aproximacion: [...x],
                residual
            }
        ],
        convergio: residual < 1e-8,
        mensaje: "Solución obtenida mediante descomposición LU."
    };
}

// ============================================
// GRADIENTE CONJUGADO
// ============================================

export function gradienteConjugado(
    A,
    b,
    tolerancia = 1e-8,
    maxIter = 500
) {
    const n = b.length;

    let x = new Array(n).fill(0);
    let r = calcularResiduo(A, b, x);
    let p = [...r];

    let rr = productoPunto(r, r);

    let iteraciones = [];

    registrarIteracion(
        iteraciones,
        0,
        x,
        normaInf(r)
    );

    for (let k = 1; k <= maxIter; k++) {
        let Ap = multiplicarMatrizVector(A, p);
        let denominador = productoPunto(p, Ap);

        if (Math.abs(denominador) < 1e-20) {
            break;
        }

        let alpha = rr / denominador;

        for (let i = 0; i < n; i++) {
            x[i] += alpha * p[i];
            r[i] -= alpha * Ap[i];
        }

        let residual = normaInf(r);

        registrarIteracion(iteraciones, k, x, residual);

        if (residual <= tolerancia) {
            return {
                x: [...x],
                iteraciones,
                convergio: true,
                mensaje: "Gradiente conjugado alcanzó la tolerancia."
            };
        }

        let nuevoRR = productoPunto(r, r);
        let beta = nuevoRR / rr;

        for (let i = 0; i < n; i++) {
            p[i] = r[i] + beta * p[i];
        }

        rr = nuevoRR;
    }

    return {
        x: [...x],
        iteraciones,
        convergio: false,
        mensaje: "No se alcanzó la tolerancia."
    };
}

// ============================================
// EJECUCIÓN SEGÚN EL MÉTODO SELECCIONADO
// ============================================

export function ejecutarMetodo(
    metodo,
    A,
    b,
    tolerancia,
    maxIter
) {
    switch (metodo) {
        case "jacobi":
            return jacobi(A, b, tolerancia, maxIter);

        case "gauss-seidel":
            return gaussSeidel(A, b, tolerancia, maxIter);

        case "lu":
            return resolverLU(A, b);

        case "gradiente":
            return gradienteConjugado(A, b, tolerancia, maxIter);

        default:
            throw new Error("Método numérico no reconocido.");
    }
}
