// ============================================
// SIMTELE-RISK - BASE DE DATOS INDEXEDDB
// ============================================

import { casos, escenariosLineales } from "./datos.js";

const NOMBRE_BD = "SIMTELE_RISK";
const VERSION_BD = 1;

let conexion = null;

export function abrirBaseDatos() {
    return new Promise((resolve, reject) => {
        const solicitud = indexedDB.open(
            NOMBRE_BD,
            VERSION_BD
        );

        solicitud.onupgradeneeded = event => {
            const db = event.target.result;

            if (!db.objectStoreNames.contains("casos")) {
                db.createObjectStore("casos", {
                    keyPath: "id"
                });
            }

            if (!db.objectStoreNames.contains("escenarios")) {
                db.createObjectStore("escenarios", {
                    keyPath: "id"
                });
            }

            if (!db.objectStoreNames.contains("simulaciones")) {
                db.createObjectStore("simulaciones", {
                    keyPath: "id"
                });
            }

            if (!db.objectStoreNames.contains("ejecuciones")) {
                const store = db.createObjectStore("ejecuciones", {
                    keyPath: "id"
                });

                store.createIndex(
                    "simulacion_id",
                    "simulacion_id",
                    { unique: false }
                );
            }

            if (!db.objectStoreNames.contains("iteraciones")) {
                const store = db.createObjectStore("iteraciones", {
                    keyPath: "id"
                });

                store.createIndex(
                    "ejecucion_id",
                    "ejecucion_id",
                    { unique: false }
                );
            }

            if (!db.objectStoreNames.contains("resumenes")) {
                const store = db.createObjectStore("resumenes", {
                    keyPath: "id"
                });

                store.createIndex(
                    "ejecucion_id",
                    "ejecucion_id",
                    { unique: false }
                );
            }
        };

        solicitud.onsuccess = event => {
            conexion = event.target.result;
            resolve(conexion);
        };

        solicitud.onerror = () => {
            reject(solicitud.error);
        };
    });
}

// ============================================
// INSERTAR DATOS INICIALES
// ============================================

export async function inicializarDatos() {
    if (!conexion) {
        await abrirBaseDatos();
    }

    const tx = conexion.transaction(
        ["casos", "escenarios"],
        "readwrite"
    );

    const casosStore = tx.objectStore("casos");
    const escenariosStore = tx.objectStore("escenarios");

    for (const caso of casos) {
        casosStore.put(caso);
    }

    for (const caso of casos) {
        for (const tipo of Object.keys(caso.escenarios)) {
            escenariosStore.put({
                id: caso.id + "_" + tipo,
                caso_id: caso.id,
                tipo,
                descripcion: caso.escenarios[tipo]
            });
        }
    }

    for (const tipo of Object.keys(escenariosLineales)) {
        escenariosStore.put({
            id: "2_LINEAL_" + tipo,
            caso_id: 2,
            tipo,
            parametros: escenariosLineales[tipo]
        });
    }

    return new Promise((resolve, reject) => {
        tx.oncomplete = () => resolve(true);
        tx.onerror = () => reject(tx.error);
    });
}

// ============================================
// GUARDAR UNA SIMULACIÓN COMPLETA
// ============================================

export async function guardarSimulacion(datos) {
    if (!conexion) {
        await abrirBaseDatos();
    }

    const idSimulacion = Date.now();
    const idEjecucion = idSimulacion + 1;

    const tx = conexion.transaction(
        [
            "simulaciones",
            "ejecuciones",
            "iteraciones",
            "resumenes"
        ],
        "readwrite"
    );

    const simulacion = {
        id: idSimulacion,
        caso_id: datos.caso_id,
        escenario: datos.escenario,
        fecha: new Date().toISOString(),
        estado: datos.resultado.convergio
            ? "CONVERGIO"
            : "NO CONVERGIO"
    };

    const ejecucion = {
        id: idEjecucion,
        simulacion_id: idSimulacion,
        metodo: datos.metodo,
        tolerancia: datos.tolerancia,
        max_iter: datos.maxIter,
        convergio: datos.resultado.convergio,
        mensaje: datos.resultado.mensaje,
        aproximacion_final: datos.resultado.x
    };

    tx.objectStore("simulaciones").put(simulacion);
    tx.objectStore("ejecuciones").put(ejecucion);

    for (const iteracion of datos.resultado.iteraciones) {
        tx.objectStore("iteraciones").put({
            id: idEjecucion + "_" + iteracion.numero,
            ejecucion_id: idEjecucion,
            numero: iteracion.numero,
            aproximacion: iteracion.aproximacion,
            residual: iteracion.residual
        });
    }

    tx.objectStore("resumenes").put({
        id: idEjecucion,
        ejecucion_id: idEjecucion,
        referencia: datos.referencia,
        errores: datos.errores,
        interpretacion: datos.interpretacion
    });

    return new Promise((resolve, reject) => {
        tx.oncomplete = () => resolve(idSimulacion);
        tx.onerror = () => reject(tx.error);
    });
}

// ============================================
// RECUPERAR HISTORIAL
// ============================================

export async function obtenerHistorial() {
    if (!conexion) {
        await abrirBaseDatos();
    }

    return new Promise((resolve, reject) => {
        const tx = conexion.transaction(
            ["simulaciones", "ejecuciones"],
            "readonly"
        );

        const solicitudes = [];

        tx.objectStore("simulaciones")
            .getAll().onsuccess = event => {
                solicitudes.push(event.target.result);
            };

        tx.objectStore("ejecuciones")
            .getAll().onsuccess = event => {
                solicitudes.push(event.target.result);
            };

        tx.oncomplete = () => {
            const simulaciones = solicitudes[0] || [];
            const ejecuciones = solicitudes[1] || [];

            let historial = simulaciones.map(sim => {
                const ejecucion = ejecuciones.find(
                    e => e.simulacion_id === sim.id
                );

                return {
                    ...sim,
                    ejecucion
                };
            });

            historial.sort(
                (a, b) => b.id - a.id
            );

            resolve(historial);
        };

        tx.onerror = () => reject(tx.error);
    });
}

// ============================================
// RECUPERAR UNA SIMULACIÓN
// ============================================

export async function recuperarSimulacion(id) {
    if (!conexion) {
        await abrirBaseDatos();
    }

    return new Promise((resolve, reject) => {
        const tx = conexion.transaction(
            [
                "simulaciones",
                "ejecuciones",
                "iteraciones",
                "resumenes"
            ],
            "readonly"
        );

        let simulacion;
        let ejecucion;
        let iteraciones;
        let resumen;

        tx.objectStore("simulaciones").get(id).onsuccess =
            event => simulacion = event.target.result;

        const ejecucionesRequest =
            tx.objectStore("ejecuciones").getAll();

        ejecucionesRequest.onsuccess = event => {
            ejecucion = event.target.result.find(
                e => e.simulacion_id === id
            );
        };

        tx.objectStore("iteraciones").getAll().onsuccess =
            event => {
                iteraciones = event.target.result;
            };

        tx.objectStore("resumenes").getAll().onsuccess =
            event => {
                resumen = event.target.result;
            };

        tx.oncomplete = () => {
            if (!ejecucion) {
                resolve(null);
                return;
            }

            resolve({
                simulacion,
                ejecucion,
                iteraciones: iteraciones.filter(
                    i => i.ejecucion_id === ejecucion.id
                ),
                resumen: resumen.find(
                    r => r.ejecucion_id === ejecucion.id
                )
            });
        };

        tx.onerror = () => reject(tx.error);
    });
}