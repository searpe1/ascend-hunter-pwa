# ASCEND · Protocolo del Cazador

PWA móvil de entrenamiento gamificado con progresión diaria y mazmorras automáticas.

## Funciones incluidas

- Misión diaria persistente hasta las 07:00 del día siguiente.
- Límite real de dos horas desde que se acepta.
- Ejercicios escalados según nivel y atributos.
- Un nivel por misión diaria completada, regalo aleatorio y 12% de probabilidad de llave.
- Mazmorras aleatorias de rango E–S, salas, enemigos, jefe y combate automático animado.
- Derrota o abandono: -2 niveles, -1 en dos atributos y posibilidad de perder equipo.
- La mazmorra desbloqueada persiste incluso tras perder o abandonar; solo se cierra para siempre al completarla.
- Clases, habilidades activas/pasivas, atributos, inventario y equipamiento.
- Sonidos sintéticos mediante Web Audio, sin recursos externos protegidos.
- Instalación como PWA y funcionamiento sin conexión tras la primera carga.

## Versión publicada

La aplicación se despliega automáticamente en GitHub Pages desde la rama `main`.

## Ejecutar localmente

No abras `index.html` directamente porque usa módulos ES. Desde la carpeta:

```bash
python3 -m http.server 8080
```

Después abre `http://localhost:8080`.

## Estructura

- `index.html`: contenedor y onboarding.
- `styles.css`: interfaz mobile-first.
- `js/data.js`: catálogo de clases, enemigos, rangos y objetos.
- `js/game.js`: reglas, progresión, recompensas y combate.
- `js/state.js`: persistencia en `localStorage`.
- `js/app.js`: renderizado e interacción.

## Nota de diseño

La dirección visual es una reinterpretación original de fantasía urbana y sistema de cazador. No incluye logotipos, ilustraciones, tipografías, música, diálogos ni recursos oficiales de *Solo Leveling*.
