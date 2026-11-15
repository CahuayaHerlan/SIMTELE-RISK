-- ============================================
-- SIMTELE-RISK
-- MODELO RELACIONAL INICIAL
-- ============================================

CREATE TABLE caso_estudio (
    id INTEGER PRIMARY KEY,
    nombre VARCHAR(100) NOT NULL,
    modelo_version VARCHAR(30)
);

CREATE TABLE escenario (
    id INTEGER PRIMARY KEY,
    caso_id INTEGER NOT NULL,
    tipo VARCHAR(30) NOT NULL,
    parametros_json TEXT,
    fuente_datos TEXT,

    FOREIGN KEY (caso_id)
        REFERENCES caso_estudio(id)
);

CREATE TABLE simulacion (
    id INTEGER PRIMARY KEY,
    escenario_id INTEGER NOT NULL,
    fecha DATETIME NOT NULL,
    estado VARCHAR(30),

    FOREIGN KEY (escenario_id)
        REFERENCES escenario(id)
);

CREATE TABLE ejecucion_metodo (
    id INTEGER PRIMARY KEY,
    simulacion_id INTEGER NOT NULL,
    metodo VARCHAR(50) NOT NULL,
    tolerancia REAL,
    paso REAL,
    max_iter INTEGER,
    convergio BOOLEAN,
    tiempo_ms REAL,

    FOREIGN KEY (simulacion_id)
        REFERENCES simulacion(id)
);

CREATE TABLE iteracion_resultado (
    id INTEGER PRIMARY KEY,
    ejecucion_id INTEGER NOT NULL,
    numero INTEGER NOT NULL,
    aproximacion_json TEXT,
    residual REAL,
    error_abs REAL,
    error_rel REAL,

    FOREIGN KEY (ejecucion_id)
        REFERENCES ejecucion_metodo(id)
);

CREATE TABLE resultado_resumen (
    id INTEGER PRIMARY KEY,
    ejecucion_id INTEGER NOT NULL,
    referencia TEXT,
    valor_json TEXT,
    metrica_error_json TEXT,
    interpretacion TEXT,

    FOREIGN KEY (ejecucion_id)
        REFERENCES ejecucion_metodo(id)
);