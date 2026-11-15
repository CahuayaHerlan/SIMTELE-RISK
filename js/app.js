// ============================================
// SIMTELE-RISK - APLICACIÓN PRINCIPAL
// ============================================

import {
    casos,
    escenariosLineales,
    metodosDisponibles
} from "./datos.js";

import {
    ejecutarMetodo
} from "./metodos.js";

import {
    calcularErrores,
    formatoNumero
} from "./errores.js";

import {
    abrirBaseDatos,
    inicializarDatos,
    guardarSimulacion,
    obtenerHistorial,
    recuperarSimulacion
} from "./database.js";

// ============================================
// ELEMENTOS DE LA INTERFAZ
// ============================================

const contenedorCasos = document.getElementById("casos");
const selectorEscenario = document.getElementById("escenario");
const selectorMetodo = document.getElementById("metodo");
const botonEjecutar = document.getElementById("ejecutar");
const botonGuardar = document.getElementById("guardar");
const contenedorResultado = document.getElementById("resultado");
const contenedorIteraciones = document.getElementById("tabla-iteraciones");
const contenedorErrores = document.getElementById("tabla-errores");
const contenedorHistorial = document.getElementById("historial");
const mensajeEstado = document.getElementById("mensaje-estado");

let casoSeleccionado = 2;
let ultimaEjecucion = null;

// ============================================
// MOSTRAR LOS CUATRO CASOS
// ============================================

function mostrarCasos() {
    contenedorCasos.innerHTML = "";

    casos.forEach(caso => {
        const tarjeta = document.createElement("article");

        tarjeta.className = "case-card";

        tarjeta.innerHTML = `
            <span class="case-number">MÓDULO 0${caso.id}</span>
            <h3>${caso.nombre}</h3>
            <p>${caso.descripcion}</p>
            <div class="case-model">${caso.modelo}</div>
            <button class="case-button" data-id="${caso.id}">
                Ver modelo
            </button>
        `;

        contenedorCasos.appendChild(tarjeta);
    });

    document.querySelectorAll(".case-button").forEach(boton => {
        boton.addEventListener("click", () => {
            seleccionarCaso(Number(boton.dataset.id));
        });
    });
}

// ============================================
// MOSTRAR INFORMACIÓN DEL CASO
// ============================================

function seleccionarCaso(id) {
    casoSeleccionado = id;

    const caso = casos.find(c => c.id === id);

    document.getElementById("titulo-caso").textContent =
        caso.nombre;

    document.getElementById("descripcion-caso").textContent =
        caso.descripcion;

    document.getElementById("pregunta-caso").textContent =
        caso.pregunta;

    document.getElementById("modelo-caso").textContent =
        caso.modelo;

    document.getElementById("ecuaciones-caso").innerHTML =
        caso.ecuaciones.map(e => `<li>${e}</li>`).join("");

    document.getElementById("metodos-caso").textContent =
        caso.metodos;

    document.getElementById("escenarios-caso").innerHTML =
        Object.entries(caso.escenarios)
            .map(([nombre, descripcion]) => `
                <div class="scenario-item">
                    <strong>${nombre.replaceAll("_", " ")}</strong>
                    <p>${descripcion}</p>
                </div>
            `).join("");

    document.getElementById("seccion-experimento").hidden =
        id !== 2;

    document.getElementById("detalle-caso").scrollIntoView({
        behavior: "smooth"
    });
}

// ============================================
// CARGAR SELECTORES
// ============================================

function cargarSelectores() {
    selectorEscenario.innerHTML = `
        <option value="NORMAL">Normal</option>
        <option value="ESTRES">Estrés</option>
        <option value="MAL_CONDICIONADO">Mal condicionado</option>
    `;

    selectorMetodo.innerHTML = "";

    metodosDisponibles.forEach(metodo => {
        const opcion = document.createElement("option");

        opcion.value = metodo.id;
        opcion.textContent = metodo.nombre;

        selectorMetodo.appendChild(opcion);
    });
}

// ============================================
// EJECUTAR SIMULACIÓN
// ============================================

function ejecutarSimulacion() {
    try {
        const escenarioNombre = selectorEscenario.value;
        const metodo = selectorMetodo.value;

        const tolerancia = Number(
            document.getElementById("tolerancia").value
        );

        const maxIter = Number(
            document.getElementById("max-iter").value
        );

        if (
            !Number.isFinite(tolerancia) ||
            tolerancia <= 0 ||
            !Number.isInteger(maxIter) ||
            maxIter < 1
        ) {
            throw new Error(
                "Verifica la tolerancia y el máximo de iteraciones."
            );
        }

        const escenario =
            escenariosLineales[escenarioNombre];

        const resultado = ejecutarMetodo(
            metodo,
            escenario.A,
            escenario.b,
            tolerancia,
            maxIter
        );

        const errores = calcularErrores(
            resultado.x,
            escenario.xReferencia,
            escenario.A,
            escenario.b
        );

        const nombreMetodo = metodosDisponibles.find(
            m => m.id === metodo
        ).nombre;

        const interpretacion = generarConclusiones(
            resultado,
            errores,
            escenarioNombre,
            nombreMetodo
        );

        ultimaEjecucion = {
            caso_id: 2,
            escenario: escenarioNombre,
            metodo,
            tolerancia,
            maxIter,
            referencia: escenario.xReferencia,
            resultado,
            errores,
            interpretacion
        };

        mostrarResultado(
            resultado,
            errores,
            interpretacion,
            nombreMetodo,
            escenario
        );

        botonGuardar.disabled = false;

        mensajeEstado.textContent =
            "Simulación ejecutada correctamente.";

    } catch (error) {
        mensajeEstado.textContent = error.message;
        botonGuardar.disabled = true;
    }
}

// ============================================
// CONCLUSIONES
// ============================================

function generarConclusiones(
    resultado,
    errores,
    escenario,
    metodo
) {
    let conclusionNumerica;

    if (resultado.convergio) {
        conclusionNumerica =
            `El método ${metodo} alcanzó la tolerancia establecida. ` +
            `El residuo máximo fue ${formatoNumero(errores.normaResiduo)} ` +
            `y el error absoluto máximo fue ${formatoNumero(errores.errorMaximo)}.`;
    } else {
        conclusionNumerica =
            `El método ${metodo} no alcanzó la tolerancia establecida. ` +
            `Se deben revisar las iteraciones, el residuo y el comportamiento ` +
            `del método bajo el escenario ${escenario.replaceAll("_", " ")}.`;
    }

    let conclusionProblema =
        "El sistema lineal permite estudiar cómo se comporta un modelo " +
        "matemático hipotético de deterioro. La solución obtenida representa " +
        "los valores de las incógnitas del sistema y no constituye una " +
        "medición real de una instalación de transporte.";

    let conclusionIngenieria =
        "Desde Ingeniería de Sistemas, este módulo integra el modelado " +
        "matemático, la implementación de algoritmos, la validación de " +
        "resultados y el almacenamiento de experimentos para facilitar " +
        "la comparación y trazabilidad de los cálculos.";

    return {
        numerica: conclusionNumerica,
        problema: conclusionProblema,
        ingenieria: conclusionIngenieria
    };
}

// ============================================
// MOSTRAR RESULTADOS
// ============================================

function mostrarResultado(
    resultado,
    errores,
    conclusiones,
    nombreMetodo,
    escenario
) {
    contenedorResultado.innerHTML = `
        <div class="result-grid">
            <div class="result-box">
                <span>ESTADO</span>
                <strong class="${resultado.convergio ? "success" : "warning"}">
                    ${resultado.convergio ? "CONVERGIÓ" : "NO CONVERGIÓ"}
                </strong>
            </div>

            <div class="result-box">
                <span>MÉTODO</span>
                <strong>${nombreMetodo}</strong>
            </div>

            <div class="result-box">
                <span>ESCENARIO</span>
                <strong>${escenario.nombre}</strong>
            </div>

            <div class="result-box">
                <span>ITERACIONES</span>
                <strong>${resultado.iteraciones.length - 1}</strong>
            </div>

            <div class="result-box">
                <span>RESIDUO MÁXIMO</span>
                <strong>${formatoNumero(errores.normaResiduo)}</strong>
            </div>

            <div class="result-box">
                <span>ERROR ABSOLUTO MÁXIMO</span>
                <strong>${formatoNumero(errores.errorMaximo)}</strong>
            </div>
        </div>

        <h3>Solución aproximada</h3>

        <div class="solution-vector">
            ${resultado.x.map((v, i) =>
                `<span>x${i + 1} = ${formatoNumero(v)}</span>`
            ).join("")}
        </div>

        <p class="method-message">${resultado.mensaje}</p>

        <h3>Conclusiones del experimento</h3>

        <div class="conclusion-card">
            <h4>Conclusión numérica</h4>
            <p>${conclusiones.numerica}</p>
        </div>

        <div class="conclusion-card">
            <h4>Conclusión del problema</h4>
            <p>${conclusiones.problema}</p>
        </div>

        <div class="conclusion-card">
            <h4>Ingeniería de Sistemas</h4>
            <p>${conclusiones.ingenieria}</p>
        </div>
    `;

    // Tabla de iteraciones

    contenedorIteraciones.innerHTML = `
        <table>
            <thead>
                <tr>
                    <th>Iteración</th>
                    <th>x₁</th>
                    <th>x₂</th>
                    <th>x₃</th>
                    <th>x₄</th>
                    <th>Residuo</th>
                </tr>
            </thead>

            <tbody>
                ${resultado.iteraciones.map(iteracion => `
                    <tr>
                        <td>${iteracion.numero}</td>
                        ${iteracion.aproximacion.map(v =>
                            `<td>${formatoNumero(v)}</td>`
                        ).join("")}
                        <td>${formatoNumero(iteracion.residual)}</td>
                    </tr>
                `).join("")}
            </tbody>
        </table>
    `;

    // Tabla de errores

    contenedorErrores.innerHTML = `
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
                ${errores.errores.map(e => `
                    <tr>
                        <td>${e.variable}</td>
                        <td>${formatoNumero(e.referencia)}</td>
                        <td>${formatoNumero(e.aproximacion)}</td>
                        <td>${formatoNumero(e.absoluto)}</td>
                        <td>${formatoNumero(e.relativo)}</td>
                        <td>${formatoNumero(e.porcentual)}%</td>
                    </tr>
                `).join("")}
            </tbody>
        </table>
    `;
}

// ============================================
// GUARDAR SIMULACIÓN
// ============================================

async function guardarResultado() {
    if (!ultimaEjecucion) {
        mensajeEstado.textContent =
            "Primero debes ejecutar una simulación.";

        return;
    }

    try {
        const id = await guardarSimulacion(
            ultimaEjecucion
        );

        mensajeEstado.textContent =
            "Simulación guardada. Código: " + id;

        await mostrarHistorial();

    } catch (error) {
        mensajeEstado.textContent =
            "Error al guardar: " + error.message;
    }
}

// ============================================
// MOSTRAR HISTORIAL
// ============================================

async function mostrarHistorial() {
    try {
        const historial = await obtenerHistorial();

        if (historial.length === 0) {
            contenedorHistorial.innerHTML =
                "<p>No existen simulaciones guardadas.</p>";

            return;
        }

        contenedorHistorial.innerHTML = historial.map(item => `
            <div class="history-item">
                <div>
                    <strong>
                        ${item.escenario.replaceAll("_", " ")}
                    </strong>

                    <p>
                        ${item.ejecucion?.metodo || "Sin método"}
                        · ${new Date(item.fecha).toLocaleString()}
                    </p>

                    <span>${item.estado}</span>
                </div>

                <button data-id="${item.id}" class="history-button">
                    Recuperar
                </button>
            </div>
        `).join("");

        document.querySelectorAll(".history-button").forEach(boton => {
            boton.addEventListener("click", () => {
                recuperarResultado(Number(boton.dataset.id));
            });
        });

    } catch (error) {
        contenedorHistorial.textContent =
            "No se pudo recuperar el historial: " + error.message;
    }
}

// ============================================
// RECUPERAR SIMULACIÓN GUARDADA
// ============================================

async function recuperarResultado(id) {
    try {
        const datos = await recuperarSimulacion(id);

        if (!datos) {
            mensajeEstado.textContent =
                "No se encontró la simulación.";

            return;
        }

        const escenarioNombre = datos.simulacion.escenario;
        const escenario = escenariosLineales[escenarioNombre];

        const ejecucion = datos.ejecucion;

        const resultado = {
            x: ejecucion.aproximacion_final,
            convergio: ejecucion.convergio,
            mensaje: ejecucion.mensaje,
            iteraciones: datos.iteraciones.map(i => ({
                numero: i.numero,
                aproximacion: i.aproximacion,
                residual: i.residual
            }))
        };

        const resumen = datos.resumen;

        const errores = {
            errores: resumen.errores.errores,
            normaResiduo: resumen.errores.normaResiduo,
            errorMaximo: resumen.errores.errorMaximo
        };

        mostrarResultado(
            resultado,
            errores,
            resumen.interpretacion,
            ejecucion.metodo,
            escenario
        );

        casoSeleccionado = 2;

        selectorEscenario.value = escenarioNombre;
        selectorMetodo.value = ejecucion.metodo;

        document.getElementById("seccion-experimento").hidden = false;

        ultimaEjecucion = null;
        botonGuardar.disabled = true;

        mensajeEstado.textContent =
            "Simulación histórica recuperada correctamente.";

    } catch (error) {
        mensajeEstado.textContent =
            "Error al recuperar: " + error.message;
    }
}

// ============================================
// INICIO
// ============================================

async function iniciarAplicacion() {
    try {
        await abrirBaseDatos();
        await inicializarDatos();

        mostrarCasos();
        cargarSelectores();
        seleccionarCaso(2);
        await mostrarHistorial();

        mensajeEstado.textContent =
            "Base de datos conectada correctamente.";

    } catch (error) {
        mensajeEstado.textContent =
            "No se pudo iniciar la base de datos: " + error.message;
    }
}

botonEjecutar.addEventListener(
    "click",
    ejecutarSimulacion
);

botonGuardar.addEventListener(
    "click",
    guardarResultado
);

iniciarAplicacion();