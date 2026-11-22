
function multiplicarMatrizVector(A, x) {
    return A.map(fila => fila.reduce((suma, valor, j) => suma + valor * x[j], 0));
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
        descripcion: "Estudio del movimiento de una cabina durante una detención de emergencia hipotética.",
        pregunta: "¿Qué distancia recorrería una cabina hasta detenerse completamente?",
        modelo: "v(t) = v₀ - at",
        ecuaciones: [
            "v(t) = v₀ - at",
            "x(t) = x₀ + v₀t - (at²)/2",
            "t_det = v₀/a",
            "d_f = v₀²/(2a)"
        ],
        metodos: "RK2, RK4, integración compuesta y métodos de raíces.",
        escenarios: {
            NORMAL: "Velocidad y desaceleración nominales.",
            ESTRES: "Mayor velocidad inicial y menor desaceleración.",
            MAL_CONDICIONADO: "Desaceleración pequeña, que aumenta la sensibilidad del tiempo de detención."
        }
    },
    {
        id: 2,
        nombre: "Deterioro mecánico y mantenimiento",
        descripcion: "Estimación del deterioro mecánico mediante un modelo matemático hipotético.",
        pregunta: "¿En qué momento el deterioro alcanzaría un umbral establecido?",
        modelo: "D(t) = D₀ + αt + βt²",
        ecuaciones: [
            "D(t) = D₀ + αt + βt²",
            "f(t) = D₀ + αt + βt² - D_umbral",
            "A · x = b"
        ],
        metodos: "Bisección, Newton-Raphson, secante, Jacobi, Gauss-Seidel, LU y gradiente conjugado.",
        escenarios: {
            NORMAL: "Parámetros nominales y sistema lineal de referencia.",
            ESTRES: "Variación de los parámetros de deterioro y de la solución de referencia.",
            MAL_CONDICIONADO: "Matriz sensible a perturbaciones numéricas."
        }
    },
    {
        id: 3,
        nombre: "Oscilaciones por viento",
        descripcion: "Estudio de las oscilaciones de una cabina ante una fuerza externa hipotética.",
        pregunta: "¿Cómo cambia la oscilación al modificar la fuerza del viento y el amortiguamiento?",
        modelo: "m x'' + c x' + kx = F(t)",
        ecuaciones: [
            "x' = v",
            "v' = [F(t) - cv - kx]/m",
            "ω₀ = √(k/m)",
            "ζ = c/(2√(km))"
        ],
        metodos: "Runge-Kutta de segundo y cuarto orden e integración numérica.",
        escenarios: {
            NORMAL: "Fuerza externa y amortiguamiento nominales.",
            ESTRES: "Mayor intensidad de la fuerza externa.",
            MAL_CONDICIONADO: "Amortiguamiento reducido y mayor sensibilidad de la respuesta."
        }
    },
    {
        id: 4,
        nombre: "Reconstrucción de señales de sensores",
        descripcion: "Reconstrucción de registros faltantes mediante señales sintéticas.",
        pregunta: "¿Cómo reconstruir datos faltantes y medir el error de predicción?",
        modelo: "y(t) = sen(t)",
        ecuaciones: [
            "y(t) = sen(t)",
            "P(x) = Σ yᵢ Lᵢ(x)",
            "E_abs = |y_real - y_aprox|"
        ],
        metodos: "Interpolación de Lagrange, Newton por diferencias divididas y splines cúbicos.",
        escenarios: {
            NORMAL: "Nodos equiespaciados y señal sin ruido.",
            ESTRES: "Datos con ruido y mayor cantidad de puntos ocultos.",
            MAL_CONDICIONADO: "Interpolación polinómica de grado elevado y sensibilidad al ruido."
        }
    }
];

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
        b: multiplicarMatrizVector(matrizMalCondicionada, referenciaMalCondicionada),
        descripcion: "Matriz sensible a perturbaciones numéricas; se compara la estabilidad de los métodos."
    }
};

export const metodosDisponibles = [
    { id: "jacobi", nombre: "Jacobi" },
    { id: "gauss-seidel", nombre: "Gauss-Seidel" },
    { id: "lu", nombre: "Descomposición LU" },
    { id: "gradiente", nombre: "Gradiente conjugado" }
];

export const metodosPorCaso = {
    1: [
        ["rk2", "Runge-Kutta 2 (punto medio)"],
        ["rk4", "Runge-Kutta 4"],
        ["trapecio", "Trapecio compuesto"],
        ["simpson", "Simpson 1/3 compuesto"],
        ["romberg", "Integración de Romberg"],
        ["biseccion", "Bisección"],
        ["newton", "Newton-Raphson"],
        ["secante", "Secante"]
    ],
    2: [
        ["biseccion", "Bisección"],
        ["newton", "Newton-Raphson"],
        ["secante", "Secante"],
        ["jacobi", "Jacobi"],
        ["gauss-seidel", "Gauss-Seidel"],
        ["lu", "Descomposición LU"],
        ["gradiente", "Gradiente conjugado"]
    ],
    3: [
        ["rk2", "Runge-Kutta 2 (punto medio)"],
        ["rk4", "Runge-Kutta 4"],
        ["trapecio", "Trapecio compuesto"],
        ["simpson", "Simpson 1/3 compuesto"],
        ["romberg", "Integración de Romberg"]
    ],
    4: [
        ["lagrange", "Interpolación de Lagrange"],
        ["newton-interpolacion", "Newton por diferencias divididas"],
        ["spline", "Spline cúbico natural"]
    ]
};

export const parametrosCasos = {
    1: {
        NORMAL: { x0: 0, v0: 8, a: 1.6, tiempo: 8 },
        ESTRES: { x0: 0, v0: 10, a: 1.2, tiempo: 10 },
        MAL_CONDICIONADO: { x0: 0, v0: 8, a: 0.08, tiempo: 100 }
    },
    2: {
        NORMAL: { D0: 10, alpha: 0.8, beta: 0.025, umbral: 50 },
        ESTRES: { D0: 12, alpha: 1.2, beta: 0.04, umbral: 50 },
        MAL_CONDICIONADO: { D0: 10, alpha: 0.0001, beta: 0.00001, umbral: 10.1 }
    },
    3: {
        NORMAL: { masa: 500, amortiguamiento: 80, rigidez: 1200, fuerza: 100, frecuencia: 1.2, x0: 0.02, v0: 0, tiempo: 10 },
        ESTRES: { masa: 500, amortiguamiento: 40, rigidez: 1200, fuerza: 250, frecuencia: 1.2, x0: 0.02, v0: 0, tiempo: 10 },
        MAL_CONDICIONADO: { masa: 500, amortiguamiento: 5, rigidez: 1200, fuerza: 400, frecuencia: 1.2, x0: 0.02, v0: 0, tiempo: 10 }
    },
    4: {
        NORMAL: { intervalo: 6.283185307179586, amplitud: 1, frecuencia: 1, puntos: 9, ocultos: 3, ruido: 0 },
        ESTRES: { intervalo: 6.283185307179586, amplitud: 1, frecuencia: 1, puntos: 9, ocultos: 6, ruido: 0.05 },
        MAL_CONDICIONADO: { intervalo: 10, amplitud: 1, frecuencia: 1, puntos: 21, ocultos: 6, ruido: 0.001 }
    }
};
