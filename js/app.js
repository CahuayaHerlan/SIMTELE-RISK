
import {
    casos,
    parametrosCasos,
    metodosPorCaso
} from "./datos.js";

import { ejecutarExperimento } from "./metodos_avanzados.js";
import { formatoNumero } from "./errores.js";

import {
    abrirBaseDatos,
    inicializarDatos,
    guardarSimulacion,
    obtenerHistorial,
    recuperarSimulacion,
    eliminarSimulacion
} from "./database.js";

const $ = id => document.getElementById(id);

let casoSeleccionado = 1;
let ultimaEjecucion = null;

const selectorEscenario = $("escenario");
const selectorMetodo = $("metodo");
const botonGuardar = $("guardar");

function nombreEscenario(valor) {
    return valor.replaceAll("_", " ");
}

function obtenerNombreMetodo(id) {
    const lista = metodosPorCaso[casoSeleccionado] || [];
    const metodo = lista.find(item => item[0] === id);
    return metodo ? metodo[1] : id;
}

function mostrarCasos() {
    $("casos").innerHTML = casos.map(caso => `
        <article class="case-card">
            <span class="case-number">MÓDULO 0${caso.id}</span>
            <h3>${caso.nombre}</h3>
            <p>${caso.descripcion}</p>
            <div class="case-model">${caso.modelo}</div>
            <button class="case-button" data-id="${caso.id}">Abrir módulo</button>
        </article>
    `).join("");

    document.querySelectorAll(".case-button").forEach(boton => {
        boton.addEventListener("click", () => seleccionarCaso(Number(boton.dataset.id)));
    });
}

function mostrarDetalle(caso) {
    $("codigo-caso").textContent = "MÓDULO 0" + caso.id;
    $("titulo-caso").textContent = caso.nombre;
    $("descripcion-caso").textContent = caso.descripcion;
    $("pregunta-caso").textContent = caso.pregunta;
    $("modelo-caso").textContent = caso.modelo;
    $("ecuaciones-caso").innerHTML = caso.ecuaciones.map(e => `<li>${e}</li>`).join("");
    $("metodos-caso").textContent = caso.metodos;

    $("escenarios-caso").innerHTML = Object.entries(caso.escenarios).map(([nombre, descripcion]) => `
        <article class="scenario-item">
            <strong>${nombreEscenario(nombre)}</strong>
            <p>${descripcion}</p>
        </article>
    `).join("");
}

function mostrarParametros() {
    const parametros = parametrosCasos[casoSeleccionado][selectorEscenario.value];

    $("parametros-dinamicos").innerHTML = Object.entries(parametros).map(([nombre, valor]) => `
        <div class="control-group">
            <label for="param-${nombre}">${nombre}</label>
            <input type="number" step="any" id="param-${nombre}" value="${valor}">
        </div>
    `).join("");
}

function leerParametros() {
    const parametros = {};
    const base = parametrosCasos[casoSeleccionado][selectorEscenario.value];

    for (const nombre of Object.keys(base)) {
        const campo = $("param-" + nombre);
        const valor = Number(campo.value);

        if (!Number.isFinite(valor)) {
            throw new Error(`El parámetro ${nombre} no es válido.`);
        }

        parametros[nombre] = valor;
    }

    return parametros;
}

function cargarMetodos() {
    selectorMetodo.innerHTML = metodosPorCaso[casoSeleccionado]
        .map(([id, nombre]) => `<option value="${id}">${nombre}</option>`)
        .join("");

    mostrarDescripcionMetodo();
}

function mostrarDescripcionMetodo() {
    const descripciones = {
        jacobi: "Método iterativo que utiliza los valores de la iteración anterior.",
        "gauss-seidel": "Método iterativo que actualiza los valores durante cada iteración.",
        lu: "Factorización LU con pivoteo parcial y sustituciones hacia adelante y atrás.",
        gradiente: "Método de gradiente conjugado para matrices simétricas definidas positivas.",
        biseccion: "Método cerrado que requiere un intervalo con cambio de signo.",
        newton: "Método de Newton-Raphson basado en la derivada de la función.",
        secante: "Método de raíces que utiliza dos aproximaciones iniciales.",
        trapecio: "Regla del trapecio compuesta con refinamiento de subintervalos.",
        simpson: "Regla compuesta de Simpson 1/3; utiliza un número par de subintervalos.",
        romberg: "Integración numérica mediante extrapolación de Richardson.",
        rk2: "Runge-Kutta de segundo orden, variante del punto medio.",
        rk4: "Runge-Kutta clásico de cuarto orden.",
        lagrange: "Interpolación polinómica de Lagrange.",
        "newton-interpolacion": "Interpolación mediante diferencias divididas de Newton.",
        spline: "Interpolación mediante splines cúbicos naturales."
    };

    $("descripcion-metodo").textContent = descripciones[selectorMetodo.value] || "";
}

function validarConfiguracion() {
    const tolerancia = Number($("tolerancia").value);
    const maxIter = Number($("max-iter").value);
    const paso = Number($("paso").value);
    const subintervalos = Number($("subintervalos").value);

    if (!(tolerancia > 0)) {
        throw new Error("La tolerancia debe ser mayor que cero.");
    }
    if (!Number.isInteger(maxIter) || maxIter < 1) {
        throw new Error("El máximo de iteraciones debe ser un entero positivo.");
    }
    if (!(paso > 0)) {
        throw new Error("El paso h debe ser mayor que cero.");
    }
    if (!Number.isInteger(subintervalos) || subintervalos < 2) {
        throw new Error("Los subintervalos deben ser un entero igual o mayor que 2.");
    }

    return { tolerancia, maxIter, paso, subintervalos };
}

function crearTabla(filas) {
    if (!filas || filas.length === 0) {
        return "<p>No hay datos de iteraciones para mostrar.</p>";
    }

    const columnas = [...new Set(filas.flatMap(fila => Object.keys(fila)))];

    const nombres = {
        numero: "Iteración / paso",
        aproximacion: "Aproximación",
        residual: "Residuo",
        error: "Error",
        referencia: "Referencia",
        a: "Extremo a",
        b: "Extremo b"
    };

    return `
        <table>
            <thead>
                <tr>${columnas.map(c => `<th>${nombres[c] || c}</th>`).join("")}</tr>
            </thead>
            <tbody>
                ${filas.map(fila => `
                    <tr>
                        ${columnas.map(c => {
                            const valor = fila[c];
                            return `<td>${typeof valor === "number" ? formatoNumero(valor) : (valor ?? "—")}</td>`;
                        }).join("")}
                    </tr>
                `).join("")}
            </tbody>
        </table>
    `;
}

function dibujarGrafico(id, puntos, titulo) {
    const canvas = $(id);
    const ctx = canvas.getContext("2d");
    const ancho = canvas.width;
    const alto = canvas.height;

    ctx.clearRect(0, 0, ancho, alto);
    ctx.fillStyle = "#0a1426";
    ctx.fillRect(0, 0, ancho, alto);

    if (!puntos || puntos.length === 0) {
        ctx.fillStyle = "#a5b4c8";
        ctx.fillText("Sin datos disponibles", 25, 35);
        return;
    }

    const xs = puntos.map((p, i) => typeof p.x === "number" ? p.x : i + 1);
    const ys = puntos.map(p => Number(p.y));

    let minX = Math.min(...xs);
    let maxX = Math.max(...xs);
    let minY = Math.min(...ys);
    let maxY = Math.max(...ys);

    if (minX === maxX) { minX -= 1; maxX += 1; }
    if (minY === maxY) { minY -= 1; maxY += 1; }

    const px = x => 48 + (x - minX) / (maxX - minX) * (ancho - 70);
    const py = y => alto - 35 - (y - minY) / (maxY - minY) * (alto - 65);

    ctx.strokeStyle = "#40516b";
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(42, 20);
    ctx.lineTo(42, alto - 30);
    ctx.lineTo(ancho - 15, alto - 30);
    ctx.stroke();

    ctx.fillStyle = "#a5b4c8";
    ctx.font = "13px Arial";
    ctx.fillText(titulo, 48, 17);
    ctx.fillText(maxY.toExponential(2), 3, 35);
    ctx.fillText(minY.toExponential(2), 3, alto - 35);

    ctx.strokeStyle = "#38bdf8";
    ctx.lineWidth = 2;
    ctx.beginPath();

    puntos.forEach((p, i) => {
        const x = px(xs[i]);
        const y = py(ys[i]);

        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
    });

    ctx.stroke();

    puntos.forEach((p, i) => {
        ctx.fillStyle = "#38bdf8";
        ctx.beginPath();
        ctx.arc(px(xs[i]), py(ys[i]), 3, 0, Math.PI * 2);
        ctx.fill();
    });
}

function mostrarErrores(errores) {
    if (!errores || errores.length === 0) {
        $("tabla-errores").innerHTML =
            "<p>No existe una referencia escalar directa para esta ejecución. Consulta la gráfica de respuesta.</p>";
        return;
    }

    $("tabla-errores").innerHTML = `
        <table>
            <thead>
                <tr>
                    <th>Variable</th>
                    <th>Referencia</th>
                    <th>Aproximación</th>
                    <th>Error absoluto</th>
                    <th>Error relativo</th>
                    <th>Error porcentual</th>
                </tr>
            </thead>
            <tbody>
                ${errores.map(e => `
                    <tr>
                        <td>${e.variable}</td>
                        <td>${formatoNumero(e.referencia)}</td>
                        <td>${formatoNumero(e.aproximacion)}</td>
                        <td>${formatoNumero(e.absoluto)}</td>
                        <td>${formatoNumero(e.relativo)}</td>
                        <td>${formatoNumero(e.porcentual)}</td>
                    </tr>
                `).join("")}
            </tbody>
        </table>
    `;
}

function generarConclusiones(resultado, metodo, escenario) {
    const errorMaximo = resultado.errores?.length
        ? Math.max(...resultado.errores.map(e => e.absoluto))
        : null;

    const numerica = resultado.convergio
        ? `El método ${metodo} completó el cálculo. ${resultado.resumen || ""} ${
            errorMaximo === null
                ? ""
                : "El error absoluto máximo fue " + formatoNumero(errorMaximo) + "."
        }`
        : `El método ${metodo} no alcanzó el criterio de convergencia. Se deben revisar el residuo, las iteraciones y la sensibilidad numérica.`;

    const aplicada = `En el escenario ${nombreEscenario(escenario)}, el resultado describe el comportamiento del modelo matemático hipotético. No representa una medición real ni confirma una falla de un sistema de transporte por cable.`;

    const sistemas = "Desde Ingeniería de Sistemas, el módulo integra modelado matemático, algoritmos numéricos, validación, visualización y almacenamiento de experimentos reproducibles.";

    return { numerica, aplicada, sistemas };
}

function mostrarResultado(registro) {
    const r = registro.resultado;

    const valor = Array.isArray(r.valor)
        ? r.valor.map((v, i) => `x${i + 1} = ${formatoNumero(v)}`).join(" · ")
        : formatoNumero(r.valor);

    $("resultado").innerHTML = `
        <div class="result-grid">
            <div class="result-box">
                <span>ESTADO</span>
                <strong class="${r.convergio ? "success" : "warning"}">
                    ${r.convergio ? "COMPLETADO" : "REVISAR"}
                </strong>
            </div>
            <div class="result-box">
                <span>MÓDULO</span>
                <strong>${casos.find(c => c.id === registro.caso_id).nombre}</strong>
            </div>
            <div class="result-box">
                <span>ESCENARIO</span>
                <strong>${nombreEscenario(registro.escenario)}</strong>
            </div>
            <div class="result-box">
                <span>MÉTODO</span>
                <strong>${registro.nombre_metodo}</strong>
            </div>
        </div>
        <h3>${r.titulo}</h3>
        <div class="model-box">${valor}</div>
        <p>${r.mensaje}</p>
        <p>${r.resumen || ""}</p>
    `;

    $("tabla-iteraciones").innerHTML = crearTabla(r.iteraciones);
    mostrarErrores(r.errores);

    $("titulo-grafico-modelo").textContent =
        r.tipo === "interpolacion" ? "Datos de entrada y evolución" : "Evolución del resultado";

    $("titulo-grafico-error").textContent =
        r.tipo === "interpolacion" ? "Error en puntos ocultos" :
        r.tipo === "edo" ? "Magnitud de la respuesta" : "Error o residuo";

    dibujarGrafico("grafico-modelo", r.puntos, "Resultado");
    dibujarGrafico("grafico-error", r.puntosError, "Error / comparación");

    $("conclusiones").innerHTML = `
        <article class="conclusion-card">
            <h3>Conclusión numérica</h3>
            <p>${registro.conclusiones.numerica}</p>
        </article>
        <article class="conclusion-card">
            <h3>Conclusión del problema</h3>
            <p>${registro.conclusiones.aplicada}</p>
        </article>
        <article class="conclusion-card">
            <h3>Ingeniería de Sistemas</h3>
            <p>${registro.conclusiones.sistemas}</p>
        </article>
    `;
}

function ejecutarSimulacion() {
    try {
        const configuracion = validarConfiguracion();
        const parametros = leerParametros();
        const metodo = selectorMetodo.value;
        const escenario = selectorEscenario.value;

        const resultado = ejecutarExperimento(
            casoSeleccionado,
            escenario,
            metodo,
            {
                tolerancia: configuracion.tolerancia,
                maxIter: configuracion.maxIter,
                paso: configuracion.paso,
                subintervalos: configuracion.subintervalos,
                parametros
            }
        );

        const conclusiones = generarConclusiones(
            resultado,
            obtenerNombreMetodo(metodo),
            escenario
        );

        ultimaEjecucion = {
            caso_id: casoSeleccionado,
            escenario,
            metodo,
            nombre_metodo: obtenerNombreMetodo(metodo),
            configuracion,
            parametros,
            resultado,
            conclusiones
        };

        mostrarResultado(ultimaEjecucion);
        botonGuardar.disabled = false;

        $("mensaje-estado").textContent =
            "Experimento ejecutado correctamente. Puedes guardarlo en el historial.";
    } catch (error) {
        ultimaEjecucion = null;
        botonGuardar.disabled = true;
        $("mensaje-estado").textContent = "No se pudo ejecutar: " + error.message;
    }
}

async function guardarResultado() {
    if (!ultimaEjecucion) return;

    try {
        const id = await guardarSimulacion(ultimaEjecucion);
        $("mensaje-estado").textContent = "Simulación guardada. ID: " + id;
        await mostrarHistorial();
    } catch (error) {
        $("mensaje-estado").textContent = "Error al guardar: " + error.message;
    }
}

async function mostrarHistorial() {
    try {
        const historial = await obtenerHistorial();
        const filtro = $("buscar-historial").value.toLowerCase();

        const filtrados = historial.filter(item => {
            const caso = casos.find(c => c.id === item.caso_id)?.nombre || "";
            return `${caso} ${item.metodo} ${item.nombre_metodo} ${item.escenario}`
                .toLowerCase()
                .includes(filtro);
        });

        if (filtrados.length === 0) {
            $("historial").innerHTML = "<p>No hay simulaciones guardadas que coincidan con la búsqueda.</p>";
            return;
        }

        $("historial").innerHTML = filtrados.map(item => {
            const caso = casos.find(c => c.id === item.caso_id)?.nombre || "Módulo";

            return `
                <article class="history-item">
                    <div>
                        <strong>${caso} · ${nombreEscenario(item.escenario)}</strong>
                        <p>${item.nombre_metodo} · ${new Date(item.fecha).toLocaleString()}</p>
                        <small>ID: ${item.id}</small>
                    </div>
                    <div class="history-actions">
                        <button class="secondary-button" data-recuperar="${item.id}">Recuperar</button>
                        <button class="secondary-button" data-relanzar="${item.id}">Relanzar</button>
                        <button class="danger-button" data-eliminar="${item.id}">Eliminar</button>
                    </div>
                </article>
            `;
        }).join("");

        $("historial").querySelectorAll("[data-recuperar]").forEach(boton => {
            boton.addEventListener("click", () => recuperarResultado(boton.dataset.recuperar, false));
        });

        $("historial").querySelectorAll("[data-relanzar]").forEach(boton => {
            boton.addEventListener("click", () => recuperarResultado(boton.dataset.relanzar, true));
        });

        $("historial").querySelectorAll("[data-eliminar]").forEach(boton => {
            boton.addEventListener("click", async () => {
                if (confirm("¿Eliminar esta simulación?")) {
                    await eliminarSimulacion(boton.dataset.eliminar);
                    await mostrarHistorial();
                }
            });
        });
    } catch (error) {
        $("historial").textContent = "No se pudo cargar el historial: " + error.message;
    }
}

async function recuperarResultado(id, relanzar) {
    try {
        const registro = await recuperarSimulacion(id);

        if (!registro) {
            throw new Error("No se encontró el experimento.");
        }

        seleccionarCaso(registro.caso_id, false);
        selectorEscenario.value = registro.escenario;
        mostrarParametros();

        for (const [nombre, valor] of Object.entries(registro.parametros)) {
            const campo = $("param-" + nombre);
            if (campo) campo.value = valor;
        }

        $("tolerancia").value = registro.configuracion.tolerancia;
        $("max-iter").value = registro.configuracion.maxIter;
        $("paso").value = registro.configuracion.paso;
        $("subintervalos").value = registro.configuracion.subintervalos;
        selectorMetodo.value = registro.metodo;
        mostrarDescripcionMetodo();

        if (relanzar) {
            ejecutarSimulacion();
            $("mensaje-estado").textContent = "Experimento recuperado y cálculo relanzado.";
        } else {
            ultimaEjecucion = registro;
            mostrarResultado(registro);
            botonGuardar.disabled = false;
            $("mensaje-estado").textContent = "Resultados históricos recuperados.";
        }

        $("seccion-experimento").scrollIntoView({ behavior: "smooth" });
    } catch (error) {
        $("mensaje-estado").textContent = "Error al recuperar: " + error.message;
    }
}

function seleccionarCaso(id, desplazar = true) {
    casoSeleccionado = id;

    const caso = casos.find(c => c.id === id);
    mostrarDetalle(caso);
    cargarMetodos();
    mostrarParametros();

    $("resultado").innerHTML = "";
    $("tabla-iteraciones").innerHTML = "";
    $("tabla-errores").innerHTML = "";
    $("conclusiones").innerHTML = "";

    dibujarGrafico("grafico-modelo", [], "Resultado");
    dibujarGrafico("grafico-error", [], "Error");

    ultimaEjecucion = null;
    botonGuardar.disabled = true;
    $("mensaje-estado").textContent = "Configura el escenario y ejecuta un método.";

    if (desplazar) {
        $("detalle-caso").scrollIntoView({ behavior: "smooth" });
    }
}

async function iniciar() {
    try {
        await abrirBaseDatos();
        await inicializarDatos();

        mostrarCasos();
        seleccionarCaso(1, false);

        selectorEscenario.addEventListener("change", mostrarParametros);
        selectorMetodo.addEventListener("change", mostrarDescripcionMetodo);
        $("ejecutar").addEventListener("click", ejecutarSimulacion);
        botonGuardar.addEventListener("click", guardarResultado);
        $("actualizar-historial").addEventListener("click", mostrarHistorial);
        $("buscar-historial").addEventListener("input", mostrarHistorial);

        await mostrarHistorial();

        $("mensaje-estado").textContent =
            "Aplicación lista. Selecciona un módulo y ejecuta un experimento.";
    } catch (error) {
        $("mensaje-estado").textContent =
            "No se pudo iniciar la aplicación: " + error.message;
    }
}

iniciar();
