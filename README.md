# SIMTELE-RISK

## Proyecto integrador de Métodos Numéricos I

SIMTELE-RISK es una aplicación web académica orientada al análisis
de cuatro casos hipotéticos relacionados con un sistema de transporte
por cable.

El proyecto integra modelos matemáticos, métodos numéricos,
teoría de errores y almacenamiento de simulaciones.

## 1. Casos de estudio

La aplicación contempla cuatro módulos:

1. Detención de emergencia de cabinas.
2. Deterioro mecánico y mantenimiento.
3. Oscilaciones por viento.
4. Reconstrucción de señales de sensores.

Cada módulo contempla los escenarios:

- NORMAL
- ESTRÉS
- MAL CONDICIONADO

## 2. Métodos numéricos

En la primera etapa se implementan los siguientes métodos
para la resolución de sistemas lineales:

- Jacobi.
- Gauss-Seidel.
- Descomposición LU.
- Gradiente conjugado.

También se incorporan cálculos de:

- Error absoluto.
- Error relativo.
- Error porcentual.
- Residuo del sistema.
- Comparación con una solución de referencia.

## 3. Base de datos

La aplicación utiliza IndexedDB, una base de datos integrada
en el navegador.

Se almacenan:

- Casos de estudio.
- Escenarios.
- Simulaciones.
- Ejecuciones de métodos.
- Iteraciones.
- Resultados y conclusiones.

El archivo `database/schema.sql` contiene el diseño relacional
inicial del proyecto.

Los datos de IndexedDB permanecen en el navegador y equipo
donde se ejecuta la aplicación. No constituyen una base de datos
centralizada compartida entre usuarios.

## 4. Tecnologías utilizadas

- HTML5.
- CSS3.
- JavaScript ES Modules.
- IndexedDB.
- SQL para el diseño relacional.

No se requieren dependencias externas ni instalación de paquetes
para ejecutar esta versión.

## 5. Estructura del proyecto

```text
SIMTELE-RISK/
│
├── index.html
├── README.md
├── .gitignore
│
├── css/
│   └── styles.css
│
├── js/
│   ├── datos.js
│   ├── metodos.js
│   ├── errores.js
│   ├── database.js
│   └── app.js
|   |__ metodos_avanzados.js
│
└── database/
    └── schema.sql
