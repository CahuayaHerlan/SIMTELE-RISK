
import { ejecutarMetodo } from "./metodos.js";
import { escenariosLineales, parametrosCasos } from "./datos.js";
import { calcularErrorEscalar } from "./errores.js";

function biseccion(f, a, b, tol, max) {
    let fa = f(a);
    let fb = f(b);

    if (fa * fb > 0) {
        throw new Error("Bisección necesita un intervalo con cambio de signo.");
    }

    const filas = [];
    let m = a;

    for (let i = 1; i <= max; i++) {
        m = (a + b) / 2;
        const fm = f(m);
        const error = Math.abs(b - a) / 2;

        filas.push({
            numero: i, a, b,
            aproximacion: m,
            error,
            residual: Math.abs(fm)
        });

        if (Math.abs(fm) <= tol || error <= tol) break;

        if (fa * fm < 0) {
            b = m;
            fb = fm;
        } else {
            a = m;
            fa = fm;
        }
    }

    return {
        valor: m,
        iteraciones: filas,
        convergio: Math.abs(f(m)) <= tol || filas.at(-1).error <= tol,
        residual: Math.abs(f(m))
    };
}

function newtonRaphson(f, df, x, tol, max) {
    const filas = [];

    for (let i = 1; i <= max; i++) {
        const derivada = df(x);

        if (Math.abs(derivada) < 1e-14) {
            throw new Error("Newton-Raphson encontró una derivada demasiado pequeña.");
        }

        const nuevo = x - f(x) / derivada;
        const error = Math.abs(nuevo - x);
        const residual = Math.abs(f(nuevo));

        filas.push({
            numero: i,
            aproximacion: nuevo,
            error,
            residual
        });

        x = nuevo;

        if (error <= tol || residual <= tol) break;
    }

    return {
        valor: x,
        iteraciones: filas,
        convergio: Math.abs(f(x)) <= tol || filas.at(-1).error <= tol,
        residual: Math.abs(f(x))
    };
}

function secante(f, x0, x1, tol, max) {
    const filas = [];
    let x = x1;

    for (let i = 1; i <= max; i++) {
        const f0 = f(x0);
        const f1 = f(x1);
        const denominador = f1 - f0;

        if (Math.abs(denominador) < 1e-14) {
            throw new Error("La secante encontró un denominador demasiado pequeño.");
        }

        x = x1 - f1 * (x1 - x0) / denominador;

        const error = Math.abs(x - x1);
        const residual = Math.abs(f(x));

        filas.push({
            numero: i,
            aproximacion: x,
            error,
            residual
        });

        x0 = x1;
        x1 = x;

        if (error <= tol || residual <= tol) break;
    }

    return {
        valor: x,
        iteraciones: filas,
        convergio: Math.abs(f(x)) <= tol || filas.at(-1).error <= tol,
        residual: Math.abs(f(x))
    };
}

function trapecioCompuesto(f, a, b, n) {
    const h = (b - a) / n;
    let suma = (f(a) + f(b)) / 2;

    for (let i = 1; i < n; i++) {
        suma += f(a + i * h);
    }

    return suma * h;
}

function simpson13Compuesto(f, a, b, n) {
    if (n % 2 !== 0) n++;

    const h = (b - a) / n;
    let suma = f(a) + f(b);

    for (let i = 1; i < n; i++) {
        suma += (i % 2 === 0 ? 2 : 4) * f(a + i * h);
    }

    return suma * h / 3;
}

function romberg(f, a, b, niveles) {
    const R = [];

    for (let k = 0; k < niveles; k++) {
        R[k] = [];
        R[k][0] = trapecioCompuesto(f, a, b, 2 ** k);

        for (let j = 1; j <= k; j++) {
            R[k][j] = R[k][j - 1] +
                (R[k][j - 1] - R[k - 1][j - 1]) / (4 ** j - 1);
        }
    }

    return R;
}

function integrarEDO(f, t0, estado0, tf, h, orden) {
    const filas = [];
    let t = t0;
    let y = [...estado0];

    const pasos = Math.max(1, Math.ceil((tf - t0) / h));
    const paso = (tf - t0) / pasos;

    const sumar = (a, b, factor) =>
        a.map((valor, i) => valor + factor * b[i]);

    filas.push({ t, valores: [...y] });

    for (let i = 1; i <= pasos; i++) {
        const k1 = f(t, y);
        let nuevo;

        if (orden === 2) {
            const k2 = f(t + paso / 2, sumar(y, k1, paso / 2));
            nuevo = sumar(y, k2, paso);
        } else {
            const k2 = f(t + paso / 2, sumar(y, k1, paso / 2));
            const k3 = f(t + paso / 2, sumar(y, k2, paso / 2));
            const k4 = f(t + paso, sumar(y, k3, paso));

            nuevo = y.map((valor, j) =>
                valor + paso * (k1[j] + 2 * k2[j] + 2 * k3[j] + k4[j]) / 6
            );
        }

        y = nuevo;
        t = t0 + i * paso;
        filas.push({ t, valores: [...y] });
    }

    return { filas, resultado: y, paso };
}

function lagrange(x, y, xp) {
    let total = 0;

    for (let i = 0; i < x.length; i++) {
        let termino = y[i];

        for (let j = 0; j < x.length; j++) {
            if (j !== i) {
                termino *= (xp - x[j]) / (x[i] - x[j]);
            }
        }

        total += termino;
    }

    return total;
}

function newtonInterpolacion(x, y, xp) {
    const n = x.length;
    const d = [...y];

    for (let j = 1; j < n; j++) {
        for (let i = n - 1; i >= j; i--) {
            d[i] = (d[i] - d[i - 1]) / (x[i] - x[i - j]);
        }
    }

    let resultado = d[n - 1];

    for (let i = n - 2; i >= 0; i--) {
        resultado = resultado * (xp - x[i]) + d[i];
    }

    return resultado;
}

function splineNatural(x, y, xp) {
    const n = x.length;
    const h = x.slice(1).map((v, i) => v - x[i]);

    const alpha = new Array(n).fill(0);
    const l = new Array(n).fill(1);
    const mu = new Array(n).fill(0);
    const z = new Array(n).fill(0);
    const c = new Array(n).fill(0);
    const b = new Array(n - 1).fill(0);
    const d = new Array(n - 1).fill(0);

    for (let i = 1; i < n - 1; i++) {
        alpha[i] =
            3 * (y[i + 1] - y[i]) / h[i] -
            3 * (y[i] - y[i - 1]) / h[i - 1];
    }

    for (let i = 1; i < n - 1; i++) {
        l[i] = 2 * (x[i + 1] - x[i - 1]) - h[i - 1] * mu[i - 1];

        if (Math.abs(l[i]) < 1e-14) {
            throw new Error("No se puede construir el spline con estos nodos.");
        }

        mu[i] = h[i] / l[i];
        z[i] = (alpha[i] - h[i - 1] * z[i - 1]) / l[i];
    }

    for (let j = n - 2; j >= 0; j--) {
        c[j] = z[j] - mu[j] * c[j + 1];
        b[j] = (y[j + 1] - y[j]) / h[j] -
            h[j] * (c[j + 1] + 2 * c[j]) / 3;
        d[j] = (c[j + 1] - c[j]) / (3 * h[j]);
    }

    let i = n - 2;

    for (let j = 0; j < n - 1; j++) {
        if (xp >= x[j] && xp <= x[j + 1]) {
            i = j;
            break;
        }
    }

    const dx = xp - x[i];

    return y[i] + b[i] * dx + c[i] * dx ** 2 + d[i] * dx ** 3;
}

function obtenerRaiz(casoId, metodo, p, tol, max) {
    let f, df, a, b, inicial;

    if (casoId === 1) {
        f = t => p.v0 - p.a * t;
        df = () => -p.a;
        a = 0;
        b = p.tiempo;
        inicial = p.tiempo / 2;
    } else {
        f = t => p.D0 + p.alpha * t + p.beta * t ** 2 - p.umbral;
        df = t => p.alpha + 2 * p.beta * t;

        const discriminante =
            p.alpha ** 2 - 4 * p.beta * (p.D0 - p.umbral);

        if (discriminante < 0) {
            throw new Error("No existe una raíz real con los parámetros actuales.");
        }

        const raiz = p.beta !== 0
            ? (-p.alpha + Math.sqrt(discriminante)) / (2 * p.beta)
            : (p.umbral - p.D0) / p.alpha;

        if (!Number.isFinite(raiz) || raiz <= 0) {
            throw new Error("Los parámetros no producen una raíz positiva válida.");
        }

        a = 0;
        b = Math.max(raiz * 2, raiz + 1);
        inicial = raiz * 0.8;
    }

    if (metodo === "biseccion") return biseccion(f, a, b, tol, max);
    if (metodo === "newton") return newtonRaphson(f, df, inicial, tol, max);
    return secante(f, a, b, tol, max);
}

function resultadoRaiz(casoId, metodo, p, tol, max) {
    const raiz = obtenerRaiz(casoId, metodo, p, tol, max);
    const referencia = casoId === 1
        ? p.v0 / p.a
        : p.beta !== 0
            ? (-p.alpha + Math.sqrt(p.alpha ** 2 - 4 * p.beta * (p.D0 - p.umbral))) / (2 * p.beta)
            : (p.umbral - p.D0) / p.alpha;

    return {
        tipo: "raiz",
        titulo: "Resultado de búsqueda de raíz",
        valor: raiz.valor,
        referencia,
        convergio: raiz.convergio,
        mensaje: `Raíz calculada mediante ${metodo}. Residuo final: ${raiz.residual}.`,
        resumen: `Valor de referencia: ${referencia}.`,
        iteraciones: raiz.iteraciones,
        errores: [{
            variable: "Raíz",
            referencia,
            aproximacion: raiz.valor,
            ...calcularErrorEscalar(referencia, raiz.valor)
        }],
        puntos: raiz.iteraciones.map(f => ({ x: f.numero, y: f.aproximacion })),
        puntosError: raiz.iteraciones.map(f => ({ x: f.numero, y: f.residual }))
    };
}

function resultadoLineal(escenario, metodo, tol, max) {
    const r = ejecutarMetodo(metodo, escenario.A, escenario.b, tol, max);
    const errores = escenario.xReferencia.map((v, i) => ({
        variable: "x" + (i + 1),
        referencia: v,
        aproximacion: r.x[i],
        ...calcularErrorEscalar(v, r.x[i])
    }));

    return {
        tipo: "lineal",
        titulo: "Solución del sistema lineal Ax = b",
        valor: r.x,
        referencia: escenario.xReferencia,
        convergio: r.convergio,
        mensaje: r.mensaje,
        resumen: `Residuo final: ${r.iteraciones.at(-1)?.residual ?? "No disponible"}.`,
        iteraciones: r.iteraciones.map(f => ({
            numero: f.numero,
            aproximacion: f.aproximacion.join(", "),
            residual: f.residual
        })),
        errores,
        puntos: r.iteraciones.map(f => ({ x: f.numero, y: f.residual })),
        puntosError: errores.map((e, i) => ({ x: i + 1, y: e.absoluto }))
    };
}

function resultadoIntegracionFrenado(metodo, p, n) {
    const limite = p.v0 / p.a;
    const f = t => Math.max(0, p.v0 - p.a * t);
    const exacta = p.v0 ** 2 / (2 * p.a);
    const filas = [];

    let valor;

    if (metodo === "trapecio") {
        for (let k = 1; k <= 5; k++) {
            const nn = n * 2 ** (k - 1);
            const v = trapecioCompuesto(f, 0, limite, nn);
            filas.push({ numero: nn, aproximacion: v, error: Math.abs(exacta - v) });
        }
        valor = filas.at(-1).aproximacion;
    } else if (metodo === "simpson") {
        const nn = n % 2 === 0 ? n : n + 1;
        valor = simpson13Compuesto(f, 0, limite, nn);
        filas.push({ numero: nn, aproximacion: valor, error: Math.abs(exacta - valor) });
    } else {
        const R = romberg(f, 0, limite, 5);
        filas.push(...R.map((r, i) => ({
            numero: 2 ** i,
            aproximacion: r[i],
            error: Math.abs(exacta - r[i])
        })));
        valor = R.at(-1).at(-1);
    }

    return {
        tipo: "integral",
        titulo: "Distancia recorrida durante el frenado",
        valor,
        referencia: exacta,
        convergio: true,
        mensaje: "Se integró la velocidad desde el inicio hasta el tiempo de detención.",
        resumen: `Distancia analítica: ${exacta.toFixed(8)} m. Tiempo de detención: ${limite.toFixed(8)} s.`,
        iteraciones: filas,
        errores: [{
            variable: "Distancia",
            referencia: exacta,
            aproximacion: valor,
            ...calcularErrorEscalar(exacta, valor)
        }],
        puntos: filas.map(f => ({ x: f.numero, y: f.aproximacion })),
        puntosError: filas.map(f => ({ x: f.numero, y: f.error }))
    };
}

function resultadoEDO(casoId, metodo, p, paso) {
    const orden = metodo === "rk2" ? 2 : 4;
    let f, edo, referencia = [];

    if (casoId === 1) {
        f = (t, y) => [y[1], -p.a];
        edo = integrarEDO(f, 0, [p.x0, p.v0], p.tiempo, paso, orden);

        referencia = edo.filas.map(fila => ({
            x: p.x0 + p.v0 * fila.t - 0.5 * p.a * fila.t ** 2,
            v: p.v0 - p.a * fila.t
        }));
    } else {
        f = (t, y) => {
            const fuerza = p.fuerza * Math.sin(p.frecuencia * t);
            return [
                y[1],
                (fuerza - p.amortiguamiento * y[1] - p.rigidez * y[0]) / p.masa
            ];
        };

        edo = integrarEDO(f, 0, [p.x0, p.v0], p.tiempo, paso, orden);
    }

    const errores = casoId === 1
        ? edo.filas.map((fila, i) => ({
            variable: "t=" + fila.t.toFixed(4),
            referencia: referencia[i].x,
            aproximacion: fila.valores[0],
            ...calcularErrorEscalar(referencia[i].x, fila.valores[0])
        }))
        : [];

    return {
        tipo: "edo",
        titulo: casoId === 1 ? "Movimiento de detención" : "Respuesta oscilatoria",
        valor: edo.resultado,
        convergio: true,
        mensaje: `Se aplicó Runge-Kutta ${orden === 2 ? "2 (punto medio)" : "4"}.`,
        resumen: casoId === 1
            ? `Tiempo analítico de detención: ${(p.v0 / p.a).toFixed(6)} s. Distancia analítica: ${(p.v0 ** 2 / (2 * p.a)).toFixed(6)} m.`
            : `Desplazamiento máximo aproximado: ${Math.max(...edo.filas.map(f => Math.abs(f.valores[0]))).toFixed(8)} m.`,
        iteraciones: edo.filas.map(f => ({
            numero: f.t,
            aproximacion: f.valores.join(", ")
        })),
        errores,
        puntos: edo.filas.map(f => ({ x: f.t, y: f.valores[0] })),
        puntosError: casoId === 1
            ? edo.filas.map((f, i) => ({ x: f.t, y: Math.abs(f.valores[0] - referencia[i].x) }))
            : edo.filas.map(f => ({ x: f.t, y: Math.abs(f.valores[0]) }))
    };
}

function interpolacion(casoId, escenario, metodo, p) {
    const cantidad = Math.max(4, Math.min(21, Math.round(p.puntos)));
    const x = Array.from({ length: cantidad }, (_, i) => {
        const u = i / (cantidad - 1);
        return p.intervalo * u;
    });

    const funcionReal = t => p.amplitud * Math.sin(p.frecuencia * t);
    const y = x.map((t, i) =>
        funcionReal(t) + p.ruido * Math.sin((i + 1) * 12.345)
    );

    const cantidadPruebas = Math.max(3, Math.min(8, Math.round(p.ocultos)));
    const pruebas = Array.from({ length: cantidadPruebas }, (_, i) =>
        p.intervalo * (i + 0.5) / cantidadPruebas
    );

    const aproximar = t => {
        if (metodo === "lagrange") return lagrange(x, y, t);
        if (metodo === "newton-interpolacion") return newtonInterpolacion(x, y, t);
        return splineNatural(x, y, t);
    };

    const predicciones = pruebas.map(t => {
        const real = funcionReal(t);
        const aproximada = aproximar(t);
        return {
            t,
            real,
            aproximada,
            error: Math.abs(real - aproximada)
        };
    });

    const errores = predicciones.map((r, i) => ({
        variable: "Punto oculto " + (i + 1),
        referencia: r.real,
        aproximacion: r.aproximada,
        ...calcularErrorEscalar(r.real, r.aproximada)
    }));

    return {
        tipo: "interpolacion",
        titulo: "Reconstrucción de señal",
        valor: predicciones.map(r => r.aproximada),
        convergio: true,
        mensaje: `Se utilizaron ${cantidad} nodos y se evaluaron ${cantidadPruebas} puntos ocultos.`,
        resumen: `Error absoluto medio: ${(errores.reduce((s, e) => s + e.absoluto, 0) / errores.length).toFixed(8)}.`,
        iteraciones: predicciones.map((r, i) => ({
            numero: i + 1,
            aproximacion: r.aproximada,
            referencia: r.real,
            error: r.error
        })),
        errores,
        puntos: x.map((t, i) => ({ x: t, y: y[i] })),
        puntosError: predicciones.map(r => ({ x: r.t, y: r.error })),
        puntosReferencia: predicciones.map(r => ({ x: r.t, y: r.real })),
        puntosInterpolados: predicciones.map(r => ({ x: r.t, y: r.aproximada }))
    };
}

function integrarOscilacion(metodo, edo, p, n) {
    const valores = edo.filas;
    const interpolar = t => {
        const posicion = Math.min(
            valores.length - 2,
            Math.max(0, Math.floor(t / edo.paso))
        );
        const a = valores[posicion];
        const b = valores[posicion + 1];
        const proporcion = (t - a.t) / (b.t - a.t);
        return Math.abs(a.valores[0] + proporcion * (b.valores[0] - a.valores[0]));
    };

    let valor;
    const filas = [];

    if (metodo === "trapecio") {
        for (let k = 1; k <= 5; k++) {
            const nn = n * 2 ** (k - 1);
            const v = trapecioCompuesto(interpolar, 0, p.tiempo, nn);
            filas.push({ numero: nn, aproximacion: v });
        }
        valor = filas.at(-1).aproximacion;
    } else if (metodo === "simpson") {
        const nn = n % 2 === 0 ? n : n + 1;
        valor = simpson13Compuesto(interpolar, 0, p.tiempo, nn);
        filas.push({ numero: nn, aproximacion: valor });
    } else {
        const R = romberg(interpolar, 0, p.tiempo, 5);
        filas.push(...R.map((r, i) => ({
            numero: 2 ** i,
            aproximacion: r[i]
        })));
        valor = R.at(-1).at(-1);
    }

    return {
        tipo: "integral",
        titulo: "Integral de la magnitud del desplazamiento",
        valor,
        convergio: true,
        mensaje: "Se integró |x(t)| a partir de la respuesta numérica del modelo oscilatorio.",
        resumen: "La integral representa la magnitud acumulada del desplazamiento durante el intervalo.",
        iteraciones: filas,
        errores: [],
        puntos: filas.map(f => ({ x: f.numero, y: f.aproximacion })),
        puntosError: valores.map(f => ({ x: f.t, y: Math.abs(f.valores[0]) }))
    };
}

export function ejecutarExperimento(casoId, escenario, metodo, opciones = {}) {
    const p = {
        ...structuredClone(parametrosCasos[casoId][escenario]),
        ...(opciones.parametros || {})
    };

    const tol = opciones.tolerancia ?? 1e-8;
    const max = opciones.maxIter ?? 500;
    const paso = opciones.paso ?? 0.05;
    const n = Math.max(2, Math.round(opciones.subintervalos ?? 20));

    if (casoId === 2 && ["jacobi", "gauss-seidel", "lu", "gradiente"].includes(metodo)) {
        return resultadoLineal(escenariosLineales[escenario], metodo, tol, max);
    }

    if ([1, 2].includes(casoId) && ["biseccion", "newton", "secante"].includes(metodo)) {
        return resultadoRaiz(casoId, metodo, p, tol, max);
    }

    if (casoId === 1 && ["rk2", "rk4"].includes(metodo)) {
        return resultadoEDO(1, metodo, p, paso);
    }

    if (casoId === 1 && ["trapecio", "simpson", "romberg"].includes(metodo)) {
        return resultadoIntegracionFrenado(metodo, p, n);
    }

    if (casoId === 3 && ["rk2", "rk4"].includes(metodo)) {
        return resultadoEDO(3, metodo, p, paso);
    }

    if (casoId === 3 && ["trapecio", "simpson", "romberg"].includes(metodo)) {
        const edo = resultadoEDO(3, "rk4", p, paso);
        const filas = edo.iteraciones.map(f => {
            const partes = String(f.aproximacion).split(",").map(Number);
            return { t: Number(f.numero), valores: partes };
        });

        const pasoEdo = filas.length > 1 ? filas[1].t - filas[0].t : paso;
        return integrarOscilacion(metodo, { filas, paso: pasoEdo }, p, n);
    }

    if (casoId === 4 && ["lagrange", "newton-interpolacion", "spline"].includes(metodo)) {
        return interpolacion(casoId, escenario, metodo, p);
    }

    throw new Error("El método seleccionado no corresponde a este módulo.");
}
