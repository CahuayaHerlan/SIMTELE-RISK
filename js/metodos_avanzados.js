
/* ==========================================================
   SIMTELE-RISK
   METODOS NUMERICOS AVANZADOS Y GRAFICOS
   ========================================================== */

(function () {
    "use strict";

    const CONFIG = {
        iteraciones: 100,
        tolerancia: 0.000001
    };

    // ------------------------------------------------------
    // FUNCIONES GENERALES
    // ------------------------------------------------------

    function validarNumero(valor, nombre) {
        const numero = Number(valor);

        if (!Number.isFinite(numero)) {
            throw new Error("El valor de " + nombre + " no es válido.");
        }

        return numero;
    }

    function redondear(numero, decimales = 6) {
        return Number(numero.toFixed(decimales));
    }

    function crearPuntos(inicio, fin, cantidad, funcion) {
        const puntos = [];

        for (let i = 0; i <= cantidad; i++) {
            const x = inicio + (fin - inicio) * i / cantidad;

            puntos.push({
                x: x,
                y: funcion(x)
            });
        }

        return puntos;
    }

    // ------------------------------------------------------
    // 1. METODO DE BISECCION
    // ------------------------------------------------------

    function biseccion(f, a, b, tolerancia = CONFIG.tolerancia) {
        let fa = f(a);
        let fb = f(b);

        if (fa * fb > 0) {
            throw new Error(
                "El intervalo no contiene un cambio de signo."
            );
        }

        let medio = 0;
        let error = Infinity;
        let iteracion = 0;

        while (
            error > tolerancia &&
            iteracion < CONFIG.iteraciones
        ) {
            medio = (a + b) / 2;

            const fm = f(medio);

            error = Math.abs(b - a) / 2;

            if (Math.abs(fm) < tolerancia) {
                break;
            }

            if (fa * fm < 0) {
                b = medio;
                fb = fm;
            } else {
                a = medio;
                fa = fm;
            }

            iteracion++;
        }

        return {
            metodo: "Bisección",
            resultado: medio,
            error: error,
            iteraciones: iteracion,
            convergio: error <= tolerancia
        };
    }

    // ------------------------------------------------------
    // 2. METODO DE NEWTON-RAPHSON
    // ------------------------------------------------------

    function newton(f, x0, tolerancia = CONFIG.tolerancia) {
        let x = x0;
        let error = Infinity;
        let iteracion = 0;

        function derivada(valor) {
            const h = 0.000001;

            return (
                f(valor + h) - f(valor - h)
            ) / (2 * h);
        }

        while (
            error > tolerancia &&
            iteracion < CONFIG.iteraciones
        ) {
            const fx = f(x);
            const dfx = derivada(x);

            if (Math.abs(dfx) < 1e-12) {
                throw new Error(
                    "La derivada es demasiado pequeña."
                );
            }

            const nuevo = x - fx / dfx;

            error = Math.abs(nuevo - x);

            x = nuevo;
            iteracion++;
        }

        return {
            metodo: "Newton-Raphson",
            resultado: x,
            error: error,
            iteraciones: iteracion,
            convergio: error <= tolerancia
        };
    }

    // ------------------------------------------------------
    // 3. METODO DE LA SECANTE
    // ------------------------------------------------------

    function secante(f, x0, x1, tolerancia = CONFIG.tolerancia) {
        let error = Infinity;
        let iteracion = 0;

        while (
            error > tolerancia &&
            iteracion < CONFIG.iteraciones
        ) {
            const f0 = f(x0);
            const f1 = f(x1);

            const denominador = f1 - f0;

            if (Math.abs(denominador) < 1e-12) {
                throw new Error(
                    "No se puede continuar con el método de la secante."
                );
            }

            const nuevo = x1 - (
                f1 * (x1 - x0)
            ) / denominador;

            error = Math.abs(nuevo - x1);

            x0 = x1;
            x1 = nuevo;

            iteracion++;
        }

        return {
            metodo: "Secante",
            resultado: x1,
            error: error,
            iteraciones: iteracion,
            convergio: error <= tolerancia
        };
    }

    // ------------------------------------------------------
    // 4. EULER MEJORADO - HEUN
    // ------------------------------------------------------

    function heun(f, y0, t0, tf, h) {
        const resultados = [];

        let t = t0;
        let y = y0;

        resultados.push({ x: t, y: y });

        while (t < tf - 1e-10) {
            const paso = Math.min(h, tf - t);

            const k1 = f(t, y);
            const k2 = f(t + paso, y + paso * k1);

            y = y + paso * (k1 + k2) / 2;
            t += paso;

            resultados.push({ x: t, y: y });
        }

        return resultados;
    }

    // ------------------------------------------------------
    // 5. RUNGE-KUTTA DE CUARTO ORDEN
    // ------------------------------------------------------

    function rungeKutta4(f, y0, t0, tf, h) {
        const resultados = [];

        let t = t0;
        let y = y0;

        resultados.push({ x: t, y: y });

        while (t < tf - 1e-10) {
            const paso = Math.min(h, tf - t);

            const k1 = f(t, y);
            const k2 = f(t + paso / 2, y + paso * k1 / 2);
            const k3 = f(t + paso / 2, y + paso * k2 / 2);
            const k4 = f(t + paso, y + paso * k3);

            y += paso * (
                k1 + 2 * k2 + 2 * k3 + k4
            ) / 6;

            t += paso;

            resultados.push({ x: t, y: y });
        }

        return resultados;
    }

    // ------------------------------------------------------
    // 6. OSCILACIONES - RUNGE KUTTA PARA SISTEMA
    // ------------------------------------------------------

    function oscilacionRK4(y0, v0, masa, amortiguamiento,
                           rigidez, tf, h) {

        const resultados = [];

        let t = 0;
        let y = y0;
        let v = v0;

        function aceleracion(posicion, velocidad) {
            return (
                -amortiguamiento * velocidad -
                rigidez * posicion
            ) / masa;
        }

        resultados.push({
            x: t,
            y: y,
            velocidad: v
        });

        while (t < tf - 1e-10) {
            const paso = Math.min(h, tf - t);

            const k1y = v;
            const k1v = aceleracion(y, v);

            const k2y = v + paso * k1v / 2;
            const k2v = aceleracion(
                y + paso * k1y / 2,
                v + paso * k1v / 2
            );

            const k3y = v + paso * k2v / 2;
            const k3v = aceleracion(
                y + paso * k2y / 2,
                v + paso * k2v / 2
            );

            const k4y = v + paso * k3v;
            const k4v = aceleracion(
                y + paso * k3y,
                v + paso * k3v
            );

            y += paso * (
                k1y + 2 * k2y + 2 * k3y + k4y
            ) / 6;

            v += paso * (
                k1v + 2 * k2v + 2 * k3v + k4v
            ) / 6;

            t += paso;

            resultados.push({
                x: t,
                y: y,
                velocidad: v
            });
        }

        return resultados;
    }

    // ------------------------------------------------------
    // 7. INTERPOLACION DE LAGRANGE
    // ------------------------------------------------------

    function lagrange(datos, x) {
        let resultado = 0;

        for (let i = 0; i < datos.length; i++) {
            let termino = datos[i].y;

            for (let j = 0; j < datos.length; j++) {
                if (i !== j) {
                    const denominador =
                        datos[i].x - datos[j].x;

                    if (denominador === 0) {
                        throw new Error(
                            "Los valores X no pueden repetirse."
                        );
                    }

                    termino *= (
                        x - datos[j].x
                    ) / denominador;
                }
            }

            resultado += termino;
        }

        return resultado;
    }

    // ------------------------------------------------------
    // 8. INTEGRACION - TRAPECIO
    // ------------------------------------------------------

    function trapecio(f, a, b, n) {
        if (n < 1) {
            throw new Error("El número de divisiones debe ser positivo.");
        }

        const h = (b - a) / n;

        let suma = (f(a) + f(b)) / 2;

        for (let i = 1; i < n; i++) {
            suma += f(a + i * h);
        }

        return suma * h;
    }

    // ------------------------------------------------------
    // 9. INTEGRACION - SIMPSON 1/3
    // ------------------------------------------------------

    function simpson(f, a, b, n) {
        if (n < 2 || n % 2 !== 0) {
            throw new Error(
                "Simpson requiere un número par de divisiones."
            );
        }

        const h = (b - a) / n;

        let suma = f(a) + f(b);

        for (let i = 1; i < n; i++) {
            const x = a + i * h;

            if (i % 2 === 0) {
                suma += 2 * f(x);
            } else {
                suma += 4 * f(x);
            }
        }

        return suma * h / 3;
    }

    // ------------------------------------------------------
    // GRAFICOS CON CANVAS
    // ------------------------------------------------------

    function dibujarGrafico(canvas, puntos, titulo) {
        if (!canvas || !puntos || puntos.length === 0) {
            return;
        }

        const contexto = canvas.getContext("2d");

        const ancho = canvas.width;
        const alto = canvas.height;

        contexto.clearRect(0, 0, ancho, alto);

        const margen = 45;

        const valoresX = puntos.map(p => p.x);
        const valoresY = puntos.map(p => p.y);

        let minX = Math.min(...valoresX);
        let maxX = Math.max(...valoresX);
        let minY = Math.min(...valoresY);
        let maxY = Math.max(...valoresY);

        if (minX === maxX) maxX = minX + 1;
        if (minY === maxY) maxY = minY + 1;

        const espacioY = (maxY - minY) * 0.1;

        minY -= espacioY;
        maxY += espacioY;

        function px(x) {
            return margen +
                (x - minX) / (maxX - minX) *
                (ancho - margen * 2);
        }

        function py(y) {
            return alto - margen -
                (y - minY) / (maxY - minY) *
                (alto - margen * 2);
        }

        // Fondo
        contexto.fillStyle = "#ffffff";
        contexto.fillRect(0, 0, ancho, alto);

        // Cuadrícula
        contexto.strokeStyle = "#e5e7eb";
        contexto.lineWidth = 1;

        for (let i = 0; i <= 5; i++) {
            const x = margen +
                i * (ancho - margen * 2) / 5;

            const y = margen +
                i * (alto - margen * 2) / 5;

            contexto.beginPath();
            contexto.moveTo(x, margen);
            contexto.lineTo(x, alto - margen);
            contexto.stroke();

            contexto.beginPath();
            contexto.moveTo(margen, y);
            contexto.lineTo(ancho - margen, y);
            contexto.stroke();
        }

        // Ejes
        contexto.strokeStyle = "#64748b";
        contexto.lineWidth = 1.5;

        contexto.beginPath();
        contexto.moveTo(margen, margen);
        contexto.lineTo(margen, alto - margen);
        contexto.lineTo(ancho - margen, alto - margen);
        contexto.stroke();

        // Curva
        contexto.strokeStyle = "#2563eb";
        contexto.lineWidth = 2.5;
        contexto.beginPath();

        puntos.forEach((punto, i) => {
            const x = px(punto.x);
            const y = py(punto.y);

            if (i === 0) {
                contexto.moveTo(x, y);
            } else {
                contexto.lineTo(x, y);
            }
        });

        contexto.stroke();

        // Titulo
        contexto.fillStyle = "#111827";
        contexto.font = "bold 15px Arial";
        contexto.textAlign = "center";
        contexto.fillText(titulo, ancho / 2, 22);

        // Etiquetas
        contexto.font = "11px Arial";
        contexto.fillStyle = "#475569";

        contexto.textAlign = "left";
        contexto.fillText(
            "Y: " + redondear(maxY, 2),
            5,
            margen
        );

        contexto.fillText(
            "Y: " + redondear(minY, 2),
            5,
            alto - margen
        );

        contexto.textAlign = "center";
        contexto.fillText(
            "X: " + redondear(minX, 2),
            margen,
            alto - 12
        );

        contexto.fillText(
            "X: " + redondear(maxX, 2),
            ancho - margen,
            alto - 12
        );
    }

    // ------------------------------------------------------
    // INTERFAZ INDEPENDIENTE
    // ------------------------------------------------------

    function crearInterfaz() {
        if (document.getElementById("simtele-avanzados")) {
            return;
        }

        const seccion = document.createElement("section");

        seccion.id = "simtele-avanzados";
        seccion.className = "simtele-avanzados";

        seccion.innerHTML = `
            <div class="sa-cabecera">
                <span class="sa-etiqueta">COM-254 · MÉTODOS NUMÉRICOS</span>
                <h2>Laboratorio de métodos avanzados</h2>
                <p>
                    Simulación numérica de los cuatro módulos
                    del sistema SIMTELE-RISK.
                </p>
            </div>

            <div class="sa-contenido">

                <div class="sa-controles">
                    <label for="sa-modulo">Módulo</label>

                    <select id="sa-modulo">
                        <option value="detencion">Detención</option>
                        <option value="deterioro">Deterioro</option>
                        <option value="oscilaciones">Oscilaciones</option>
                        <option value="sensores">Sensores</option>
                    </select>

                    <div id="sa-parametros"></div>

                    <button id="sa-ejecutar">
                        Ejecutar simulación
                    </button>
                </div>

                <div class="sa-resultados">
                    <h3>Resultados</h3>

                    <div id="sa-salida">
                        Selecciona un módulo y ejecuta una simulación.
                    </div>

                    <h3>Representación gráfica</h3>

                    <canvas
                        id="sa-grafico"
                        width="850"
                        height="380">
                    </canvas>
                </div>

            </div>
        `;

        const estilo = document.createElement("style");

        estilo.textContent = `
            .simtele-avanzados {
                margin: 45px auto;
                max-width: 1250px;
                padding: 25px;
                border-radius: 18px;
                background: var(--card-bg, #ffffff);
                color: var(--text-color, #172033);
                border: 1px solid var(--border-color, #dbe2ea);
            }

            .sa-cabecera {
                margin-bottom: 25px;
            }

            .sa-etiqueta {
                color: #2563eb;
                font-size: 12px;
                font-weight: bold;
                letter-spacing: 1px;
            }

            .sa-cabecera h2 {
                margin: 8px 0;
                font-size: 25px;
            }

            .sa-contenido {
                display: grid;
                grid-template-columns: 280px minmax(0, 1fr);
                gap: 25px;
            }

            .sa-controles,
            .sa-resultados {
                padding: 20px;
                border: 1px solid var(--border-color, #dbe2ea);
                border-radius: 12px;
            }

            .sa-controles label {
                display: block;
                margin: 12px 0 5px;
                font-weight: 600;
            }

            .sa-controles input,
            .sa-controles select {
                width: 100%;
                padding: 10px;
                border: 1px solid #cbd5e1;
                border-radius: 7px;
                box-sizing: border-box;
                background: var(--input-bg, #ffffff);
                color: inherit;
            }

            .sa-controles button {
                width: 100%;
                margin-top: 20px;
                padding: 12px;
                border: 0;
                border-radius: 8px;
                background: #2563eb;
                color: white;
                font-weight: bold;
                cursor: pointer;
            }

            .sa-controles button:hover {
                background: #1d4ed8;
            }

            .sa-resultados h3 {
                margin-top: 0;
            }

            #sa-grafico {
                width: 100%;
                height: auto;
                border: 1px solid #e2e8f0;
                border-radius: 8px;
            }

            .sa-tabla {
                width: 100%;
                border-collapse: collapse;
                margin: 12px 0 20px;
            }

            .sa-tabla th,
            .sa-tabla td {
                padding: 9px;
                border-bottom: 1px solid #e2e8f0;
                text-align: left;
            }

            .sa-conclusion {
                padding: 12px;
                margin-top: 15px;
                border-left: 4px solid #2563eb;
                background: #eff6ff;
                color: #1e3a8a;
                border-radius: 5px;
            }

            .sa-error {
                color: #b91c1c;
                font-weight: bold;
            }

            @media(max-width: 800px) {
                .sa-contenido {
                    grid-template-columns: 1fr;
                }
            }
        `;

        document.head.appendChild(estilo);

        const destino =
            document.querySelector("main") ||
            document.querySelector(".container") ||
            document.body;

        destino.appendChild(seccion);

        document.getElementById("sa-modulo")
            .addEventListener("change", actualizarParametros);

        document.getElementById("sa-ejecutar")
            .addEventListener("click", ejecutar);

        actualizarParametros();
    }

    // ------------------------------------------------------
    // PARAMETROS SEGUN MODULO
    // ------------------------------------------------------

    function campo(nombre, valor, id) {
        return `
            <label for="${id}">${nombre}</label>
            <input
                type="number"
                id="${id}"
                value="${valor}"
                step="any">
        `;
    }

    function obtenerValor(id, nombre) {
        const elemento = document.getElementById(id);

        if (!elemento) {
            throw new Error("No se encontró el parámetro " + nombre);
        }

        return validarNumero(elemento.value, nombre);
    }

    function actualizarParametros() {
        const modulo = document.getElementById("sa-modulo").value;
        const contenedor = document.getElementById("sa-parametros");

        if (modulo === "detencion") {
            contenedor.innerHTML =
                campo("Velocidad inicial (m/s)", 20, "sa-v0") +
                campo("Desaceleración (m/s²)", 2, "sa-a") +
                campo("Intervalo inicial (s)", 0, "sa-a0") +
                campo("Intervalo final (s)", 20, "sa-b");
        }

        if (modulo === "deterioro") {
            contenedor.innerHTML =
                campo("Deterioro inicial", 10, "sa-d0") +
                campo("Tasa de deterioro", 0.08, "sa-k") +
                campo("Límite permitido", 50, "sa-limite") +
                campo("Tiempo máximo", 30, "sa-tiempo");
        }

        if (modulo === "oscilaciones") {
            contenedor.innerHTML =
                campo("Desplazamiento inicial (m)", 1, "sa-y0") +
                campo("Velocidad inicial (m/s)", 0, "sa-v0") +
                campo("Masa (kg)", 1, "sa-masa") +
                campo("Amortiguamiento", 0.5, "sa-amort") +
                campo("Rigidez", 10, "sa-rigidez") +
                campo("Tiempo final (s)", 20, "sa-tf") +
                campo("Paso h", 0.1, "sa-h");
        }

        if (modulo === "sensores") {
            contenedor.innerHTML = `
                <p>
                    Se utilizarán mediciones de ejemplo
                    para interpolación e integración.
                </p>
                <p>
                    Puntos: (0, 10), (1, 15), (2, 12),
                    (3, 20), (4, 18).
                </p>
                <label for="sa-x">Punto a interpolar</label>
                <input type="number" id="sa-x" value="2.5" step="any">
                <label for="sa-n">Divisiones para integración</label>
                <input type="number" id="sa-n" value="4" min="2" step="2">
            `;
        }

        document.getElementById("sa-salida").innerHTML =
            "Parámetros actualizados. Ejecuta la simulación.";
    }

    // ------------------------------------------------------
    // MOSTRAR RESULTADOS
    // ------------------------------------------------------

    function mostrarResultados(html, puntos, titulo) {
        document.getElementById("sa-salida").innerHTML = html;

        dibujarGrafico(
            document.getElementById("sa-grafico"),
            puntos,
            titulo
        );
    }

    function tablaResultados(resultados) {
        let html = `
            <table class="sa-tabla">
                <thead>
                    <tr>
                        <th>Método</th>
                        <th>Resultado</th>
                        <th>Error</th>
                        <th>Iteraciones</th>
                    </tr>
                </thead>
                <tbody>
        `;

        resultados.forEach(r => {
            html += `
                <tr>
                    <td>${r.metodo}</td>
                    <td>${redondear(r.resultado)}</td>
                    <td>${redondear(r.error, 9)}</td>
                    <td>${r.iteraciones}</td>
                </tr>
            `;
        });

        html += "</tbody></table>";

        return html;
    }

    // ------------------------------------------------------
    // EJECUCION DE LOS CUATRO MODULOS
    // ------------------------------------------------------

    function ejecutarDetencion() {
        const v0 = obtenerValor("sa-v0", "velocidad inicial");
        const a = obtenerValor("sa-a", "desaceleración");
        const inicio = obtenerValor("sa-a0", "intervalo inicial");
        const fin = obtenerValor("sa-b", "intervalo final");

        if (v0 <= 0 || a <= 0 || fin <= inicio) {
            throw new Error("Revisa la velocidad, desaceleración e intervalo.");
        }

        const f = t => v0 - a * t;

        const resultados = [
            biseccion(f, inicio, fin),
            newton(f, fin / 2),
            secante(f, inicio, fin)
        ];

        const puntos = crearPuntos(
            inicio,
            fin,
            100,
            f
        );

        const html =
            tablaResultados(resultados) +
            `<div class="sa-conclusion">
                La simulación estima el tiempo necesario para
                que el vehículo alcance velocidad cero.
                El resultado esperado es ${redondear(v0 / a)} segundos.
            </div>`;

        mostrarResultados(
            html,
            puntos,
            "Velocidad durante la detención"
        );
    }

    function ejecutarDeterioro() {
        const d0 = obtenerValor("sa-d0", "deterioro inicial");
        const k = obtenerValor("sa-k", "tasa de deterioro");
        const limite = obtenerValor("sa-limite", "límite");
        const tiempo = obtenerValor("sa-tiempo", "tiempo máximo");

        if (d0 <= 0 || k <= 0 || limite <= d0 || tiempo <= 0) {
            throw new Error("Los parámetros de deterioro no son válidos.");
        }

        const f = t => d0 * Math.exp(k * t) - limite;

        const resultados = [
            biseccion(f, 0, tiempo),
            newton(f, tiempo / 2),
            secante(f, 0, tiempo)
        ];

        const puntos = crearPuntos(
            0,
            tiempo,
            100,
            t => d0 * Math.exp(k * t)
        );

        const html =
            tablaResultados(resultados) +
            `<div class="sa-conclusion">
                Se estima el tiempo en el que el deterioro
                alcanza el límite permitido.
                Un valor mayor indica una condición de mayor riesgo.
            </div>`;

        mostrarResultados(
            html,
            puntos,
            "Evolución del deterioro"
        );
    }

    function ejecutarOscilaciones() {
        const y0 = obtenerValor("sa-y0", "desplazamiento inicial");
        const v0 = obtenerValor("sa-v0", "velocidad inicial");
        const masa = obtenerValor("sa-masa", "masa");
        const amort = obtenerValor("sa-amort", "amortiguamiento");
        const rigidez = obtenerValor("sa-rigidez", "rigidez");
        const tf = obtenerValor("sa-tf", "tiempo final");
        const h = obtenerValor("sa-h", "paso");

        if (
            masa <= 0 ||
            rigidez <= 0 ||
            tf <= 0 ||
            h <= 0 ||
            amort < 0
        ) {
            throw new Error("Los parámetros del sistema oscilatorio no son válidos.");
        }

        const f = (t, y) => y;

        const heunResultado = heun(
            (t, y) => {
                // Aproximación escalar no usada para el sistema completo.
                return y;
            },
            y0,
            0,
            tf,
            h
        );

        const rk = oscilacionRK4(
            y0,
            v0,
            masa,
            amort,
            rigidez,
            tf,
            h
        );

        const puntos = rk.map(p => ({
            x: p.x,
            y: p.y
        }));

        const ultimo = rk[rk.length - 1];

        const html = `
            <p><strong>Método:</strong> Runge-Kutta de cuarto orden.</p>
            <p><strong>Desplazamiento final:</strong>
                ${redondear(ultimo.y)} m</p>
            <p><strong>Velocidad final:</strong>
                ${redondear(ultimo.velocidad)} m/s</p>
            <p><strong>Puntos calculados:</strong> ${rk.length}</p>
            <div class="sa-conclusion">
                El método RK4 aproxima el comportamiento del
                sistema oscilatorio considerando masa, rigidez
                y amortiguamiento. La curva permite observar
                la evolución de las vibraciones.
            </div>
        `;

        mostrarResultados(
            html,
            puntos,
            "Desplazamiento del sistema oscilatorio"
        );
    }

    function ejecutarSensores() {
        const x = obtenerValor("sa-x", "punto de interpolación");
        const n = obtenerValor("sa-n", "divisiones");

        if (n < 2 || n % 2 !== 0 || !Number.isInteger(n)) {
            throw new Error("Simpson requiere un número par de divisiones.");
        }

        const datos = [
            { x: 0, y: 10 },
            { x: 1, y: 15 },
            { x: 2, y: 12 },
            { x: 3, y: 20 },
            { x: 4, y: 18 }
        ];

        const interpolado = lagrange(datos, x);

        const funcion = valor => lagrange(datos, valor);

        const areaTrapecio = trapecio(
            funcion,
            0,
            4,
            n
        );

        const areaSimpson = simpson(
            funcion,
            0,
            4,
            n
        );

        const puntos = crearPuntos(
            0,
            4,
            100,
            funcion
        );

        const html = `
            <p><strong>Interpolación en x = ${x}:</strong>
                ${redondear(interpolado)}</p>
            <p><strong>Integral por trapecio:</strong>
                ${redondear(areaTrapecio)}</p>
            <p><strong>Integral por Simpson 1/3:</strong>
                ${redondear(areaSimpson)}</p>
            <div class="sa-conclusion">
                La interpolación estima una medición entre
                puntos conocidos. La integración aproxima
                el área acumulada de la señal registrada.
            </div>
        `;

        mostrarResultados(
            html,
            puntos,
            "Interpolación de mediciones de sensores"
        );
    }

    // ------------------------------------------------------
    // CONTROL PRINCIPAL
    // ------------------------------------------------------

    function ejecutar() {
        try {
            const modulo =
                document.getElementById("sa-modulo").value;

            if (modulo === "detencion") {
                ejecutarDetencion();
            }

            if (modulo === "deterioro") {
                ejecutarDeterioro();
            }

            if (modulo === "oscilaciones") {
                ejecutarOscilaciones();
            }

            if (modulo === "sensores") {
                ejecutarSensores();
            }

        } catch (error) {
            document.getElementById("sa-salida").innerHTML =
                `<p class="sa-error">
                    Error: ${error.message}
                </p>`;
        }
    }

    // ------------------------------------------------------
    // INICIALIZACION
    // ------------------------------------------------------

    function iniciar() {
        crearInterfaz();
        console.log(
            "SIMTELE-RISK: módulo de métodos avanzados iniciado."
        );
    }

    if (document.readyState === "loading") {
        document.addEventListener("DOMContentLoaded", iniciar);
    } else {
        iniciar();
    }

    // API pública para futuras ampliaciones
    window.SIMTELEAvanzados = {
        biseccion,
        newton,
        secante,
        heun,
        rungeKutta4,
        oscilacionRK4,
        lagrange,
        trapecio,
        simpson,
        dibujarGrafico
    };

})();
