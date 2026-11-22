
const NOMBRE_BD = "SIMTELE_RISK";
const VERSION_BD = 2;
let conexion = null;

export function abrirBaseDatos() {
    return new Promise((resolve, reject) => {
        const solicitud = indexedDB.open(NOMBRE_BD, VERSION_BD);

        solicitud.onupgradeneeded = event => {
            const db = event.target.result;

            // Se conservan los almacenes originales de la Semana 1.
            const almacenesOriginales = [
                "casos",
                "escenarios",
                "simulaciones",
                "ejecuciones",
                "iteraciones",
                "resumenes"
            ];

            for (const nombre of almacenesOriginales) {
                if (!db.objectStoreNames.contains(nombre)) {
                    const store = db.createObjectStore(nombre, { keyPath: "id" });

                    if (nombre === "ejecuciones" || nombre === "iteraciones" || nombre === "resumenes") {
                        const indice = nombre === "ejecuciones" ? "simulacion_id" : "ejecucion_id";
                        store.createIndex(indice, indice, { unique: false });
                    }
                }
            }

            if (!db.objectStoreNames.contains("experimentos")) {
                const store = db.createObjectStore("experimentos", { keyPath: "id" });
                store.createIndex("fecha", "fecha", { unique: false });
                store.createIndex("caso_id", "caso_id", { unique: false });
                store.createIndex("escenario", "escenario", { unique: false });
            }
        };

        solicitud.onsuccess = event => {
            conexion = event.target.result;
            conexion.onversionchange = () => conexion.close();
            resolve(conexion);
        };

        solicitud.onerror = () => reject(solicitud.error);
    });
}

async function obtenerConexion() {
    if (!conexion) await abrirBaseDatos();
    return conexion;
}

export async function inicializarDatos() {
    const db = await obtenerConexion();

    return new Promise((resolve, reject) => {
        const tx = db.transaction(["casos", "escenarios"], "readwrite");
        const casosStore = tx.objectStore("casos");
        const escenariosStore = tx.objectStore("escenarios");

        tx.oncomplete = () => resolve(true);
        tx.onerror = () => reject(tx.error);
    });
}

export async function guardarSimulacion(datos) {
    const db = await obtenerConexion();

    const registro = {
        ...structuredClone(datos),
        id: crypto.randomUUID(),
        fecha: new Date().toISOString()
    };

    return new Promise((resolve, reject) => {
        const tx = db.transaction(["experimentos"], "readwrite");
        tx.objectStore("experimentos").add(registro);

        tx.oncomplete = () => resolve(registro.id);
        tx.onerror = () => reject(tx.error);
        tx.onabort = () => reject(tx.error || new Error("No se pudo guardar el experimento."));
    });
}

export async function obtenerHistorial() {
    const db = await obtenerConexion();

    return new Promise((resolve, reject) => {
        const tx = db.transaction(["experimentos"], "readonly");
        const solicitud = tx.objectStore("experimentos").getAll();

        solicitud.onsuccess = () => {
            const registros = solicitud.result || [];
            registros.sort((a, b) => new Date(b.fecha) - new Date(a.fecha));
            resolve(registros);
        };

        solicitud.onerror = () => reject(solicitud.error);
    });
}

export async function recuperarSimulacion(id) {
    const db = await obtenerConexion();

    return new Promise((resolve, reject) => {
        const tx = db.transaction(["experimentos"], "readonly");
        const solicitud = tx.objectStore("experimentos").get(id);

        solicitud.onsuccess = () => resolve(solicitud.result || null);
        solicitud.onerror = () => reject(solicitud.error);
    });
}

export async function eliminarSimulacion(id) {
    const db = await obtenerConexion();

    return new Promise((resolve, reject) => {
        const tx = db.transaction(["experimentos"], "readwrite");
        tx.objectStore("experimentos").delete(id);

        tx.oncomplete = () => resolve(true);
        tx.onerror = () => reject(tx.error);
    });
}
