
PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS caso_estudio (
    id INTEGER PRIMARY KEY,
    codigo TEXT NOT NULL UNIQUE,
    nombre TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS escenario (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    caso_id INTEGER NOT NULL,
    tipo TEXT NOT NULL CHECK (
        tipo IN ('NORMAL', 'ESTRES', 'MAL_CONDICIONADO')
    ),
    descripcion TEXT,
    parametros_json TEXT,
    UNIQUE (caso_id, tipo),
    FOREIGN KEY (caso_id)
        REFERENCES caso_estudio(id)
        ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS simulacion (
    id TEXT PRIMARY KEY,
    escenario_id INTEGER NOT NULL,
    fecha TEXT NOT NULL,
    estado TEXT NOT NULL,
    FOREIGN KEY (escenario_id)
        REFERENCES escenario(id)
        ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS ejecucion_metodo (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    simulacion_id TEXT NOT NULL,
    metodo TEXT NOT NULL,
    tolerancia REAL,
    paso REAL,
    max_iter INTEGER,
    convergio INTEGER NOT NULL,
    parametros_usados_json TEXT NOT NULL,
    FOREIGN KEY (simulacion_id)
        REFERENCES simulacion(id)
        ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS iteracion_resultado (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    ejecucion_id INTEGER NOT NULL,
    numero INTEGER NOT NULL,
    aproximacion_json TEXT,
    residual REAL,
    error_abs REAL,
    error_rel REAL,
    FOREIGN KEY (ejecucion_id)
        REFERENCES ejecucion_metodo(id)
        ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS resultado_resumen (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    ejecucion_id INTEGER NOT NULL,
    referencia_json TEXT,
    valor_json TEXT NOT NULL,
    metrica_error_json TEXT,
    interpretacion TEXT,
    FOREIGN KEY (ejecucion_id)
        REFERENCES ejecucion_metodo(id)
        ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_escenario_caso
ON escenario(caso_id);

CREATE INDEX IF NOT EXISTS idx_simulacion_escenario
ON simulacion(escenario_id);

CREATE INDEX IF NOT EXISTS idx_ejecucion_simulacion
ON ejecucion_metodo(simulacion_id);

CREATE INDEX IF NOT EXISTS idx_iteracion_ejecucion
ON iteracion_resultado(ejecucion_id);

CREATE INDEX IF NOT EXISTS idx_resumen_ejecucion
ON resultado_resumen(ejecucion_id);

INSERT OR IGNORE INTO caso_estudio (id, codigo, nombre) VALUES
(1, 'DETENCION', 'Detención de emergencia'),
(2, 'DETERIORO', 'Deterioro mecánico y mantenimiento'),
(3, 'OSCILACIONES', 'Oscilaciones por viento'),
(4, 'SENSORES', 'Reconstrucción de señales de sensores');
