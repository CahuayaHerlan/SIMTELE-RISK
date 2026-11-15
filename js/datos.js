// ============================================
// SIMTELE-RISK - DATOS DEL PROYECTO
// ============================================

function multiplicarMatrizVector(A, x) {
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

const matrizNormal = [
    [4, -1, 0, 0],
    [-1, 4, -1, 0],
    [0, -1, 4, -1],
    [0, 0, -1, 3]
];

const matrizMalCondicionada = [
    [1, 0.99, 0.99, 0.99],
    [0.99, 1, 0.99, 0.99],
    [0.99, 0.99, 1, 0.99],
    [0.99, 0.99, 0.99, 1]
];

const referenciaNormal = [1, 2, -1, 1];

const referenciaEstres = [1.1, 1.9, -0.9, 0.95];

const referenciaMalCondicionada = [1, -1, 2, -2];

export const casos = [
    {
        id: 1,
        nombre: "Detención de emergencia",
        descripcion:
            "Estudio del movimiento de una cabina durante una detención de emergencia hipotética.",
        pregunta:
            "¿Qué distancia recorrería una cabina hasta detenerse completamente?",
        modelo:
            "v(t) = v₀ - at",
        ecuaciones: [
            "v(t) = v₀ - at",
            "x(t) = x₀ + v₀t - (at²)/2",
            "t_det = v₀/a",
            "d_f = v₀²/(2a)"
        ],
        metodos:
            "EDO mediante RK2 y RK4, integración numérica y métodos de raíces.",
        escenarios: {
            NORMAL: "Velocidad y desaceleración nominales.",
            ESTRES: "Mayor velocidad inicial o menor desaceleración.",
            MAL_CONDICIONADO: "Parámetros muy sensibles a pequeñas variaciones."
        }
    },
    {
        id: 2,
        nombre: "Deterioro mecánico y mantenimiento",
        descripcion:
            "Estimación del deterioro mecánico mediante un modelo matemático hipotético.",
        pregunta:
            "¿En qué momento el deterioro alcanzaría un umbral establecido?",
        modelo:
            "D(t) = D₀ + αt + βt²",
        ecuaciones: [
            "D(t) = D₀ + αt + βt²",
            "f(t) = D₀ + αt + βt² - D_umbral",
            "A · x = b"
        ],
        metodos:
            "Sistemas lineales: Jacobi, Gauss-Seidel, LU y gradiente conjugado.",
        escenarios: {
            NORMAL: "Parámetros nominales y sistema lineal de referencia.",
            ESTRES: "Variación de los valores de referencia del sistema.",
            MAL_CONDICIONADO: "Matriz con mayor sensibilidad numérica."
        }
    },
    {
        id: 3,
        nombre: "Oscilaciones por viento",
        descripcion:
            "Estudio de las oscilaciones de una cabina ante una fuerza externa hipotética.",
        pregunta:
            "¿Cómo cambia la oscilación al modificar la fuerza del viento y el amortiguamiento?",
        modelo:
            "m x'' + c x' + kx = F(t)",
        ecuaciones: [
            "x' = v",
            "v' = [F(t) - cv - kx]/m",
            "ω₀ = √(k/m)",
            "ζ = c/(2√(km))"
        ],
        metodos:
            "Ecuaciones diferenciales mediante RK2 y RK4 e integración numérica.",
        escenarios: {
            NORMAL: "Fuerza externa y amortiguamiento nominales.",
            ESTRES: "Mayor intensidad de la fuerza externa.",
            MAL_CONDICIONADO: "Parámetros sensibles a pequeñas perturbaciones."
        }
    },
    {
        id: 4,
        nombre: "Reconstrucción de señales de sensores",
        descripcion:
            "Reconstrucción de registros faltantes mediante señales sintéticas.",
        pregunta:
            "¿Cómo reconstruir datos faltantes y medir el error de predicción?",
        modelo:
            "y(t) = sen(t) o y(t) = e⁻ᵗ",
        ecuaciones: [
            "y(t) = sen(t)",
            "y(t) = e⁻ᵗ",
            "E_abs = |y_real - y_aprox|"
        ],
        metodos:
            "Interpolación de Lagrange, Newton y splines cúbicos.",
        escenarios: {
            NORMAL: "Datos sintéticos completos y consistentes.",
            ESTRES: "Mayor perturbación o ruido en los datos.",
            MAL_CONDICIONADO: "Puntos muy próximos o distribución desfavorable."
        }
    }
];

// Sistemas lineales para las primeras pruebas de Semana 1.
// En los tres escenarios se conoce la solución de referencia.

export const escenariosLineales = {
    NORMAL: {
        nombre: "Normal",
        A: matrizNormal,
        xReferencia: referenciaNormal,
        b: multiplicarMatrizVector(matrizNormal, referenciaNormal),
        descripcion: "Matriz diagonalmente dominante y solución de referencia conocida."
    },

    ESTRES: {
        nombre: "Estrés",
        A: matrizNormal,
        xReferencia: referenciaEstres,
        b: multiplicarMatrizVector(matrizNormal, referenciaEstres),
        descripcion: "Se modifica la solución de referencia para evaluar la respuesta del sistema."
    },

    MAL_CONDICIONADO: {
        nombre: "Mal condicionado",
        A: matrizMalCondicionada,
        xReferencia: referenciaMalCondicionada,
        b: multiplicarMatrizVector(
            matrizMalCondicionada,
            referenciaMalCondicionada
        ),
        descripcion: "Matriz sensible a perturbaciones numéricas; se compara la estabilidad de los métodos."
    }
};

export const metodosDisponibles = [
    { id: "jacobi", nombre: "Jacobi" },
    { id: "gauss-seidel", nombre: "Gauss-Seidel" },
    { id: "lu", nombre: "Descomposición LU" },
    { id: "gradiente", nombre: "Gradiente conjugado" }
];