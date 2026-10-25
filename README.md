# Show up — demo interactiva

Demo estática de una plataforma de videojuegos educativos competitivos para el aula. Funciona sin backend, base de datos ni dependencias externas.

## Ejecutar localmente

1. Abre una terminal en la carpeta del proyecto.
2. Inicia un servidor estático, por ejemplo: `python3 -m http.server 8000 -d dist`.
3. Abre `http://localhost:8000`.
4. Pulsa **Jugar** para entrar en la aplicación.

También puede abrirse `dist/index.html` directamente, aunque algunos navegadores limitan los módulos JavaScript cuando se utiliza el protocolo `file://`. El servidor estático evita ese problema.

## Estructura

- `dist/index.html`: landing de Show up.
- `dist/styles.css`, `dist/refinements.css` y `dist/script.js`: estilos e interacciones de la landing.
- `dist/assets/`: fotografías del equipo.
- `dist/index.html`: landing del proyecto, vídeo integrado, ODS, viabilidad, uso de IA y perfiles del equipo.
- `dist/play/index.html`: entrada de la demo.
- `dist/play/styles.css` y `dist/play/refinements.css`: sistema visual y mejoras de usabilidad del juego.
- `dist/play/app.js`: navegación, estado, salas, equipos, temporizadores, puntuación y vistas.
- `dist/play/games.js`: lógica de los cuatro minijuegos y generación de tableros.
- `dist/play/i18n.js`: interfaz en español y catalán.
- `dist/play/data.js`: sesión y participantes de demostración.

## Recorrido de prueba recomendado

### Alumno

1. Pulsa **Entrar como alumno**.
2. Introduce un alias, acepta el aviso de invitado y utiliza `SHOW-4821`.
3. Únete a un equipo o crea uno nuevo.
4. Inicia la simulación.
5. Completa el test, el ahorcado, la sopa de letras y el crucigrama.
6. Revisa el ranking después de cada turno y el podio final.

### Profesor

1. Pulsa **Entrar como profesor** e introduce un alias.
2. Revisa la sesión de demostración o abre el editor.
3. Añade, edita, elimina u ordena los ejercicios de la sesión.
4. Selecciona un minijuego, configura el contenido y genera su vista previa.
5. Guarda los cambios, crea una sala e inicia la sesión.

## Funcionalidades reales de la demo

- Navegación diferenciada para profesor y alumno.
- Accesos sociales simulados sin transmisión de datos.
- Código de sala, copia al portapapeles y participantes ficticios.
- Creación y selección de equipos con confirmación visual y acceso directo a la sala.
- Landing con vídeo reproducible de YouTube, simbología del reto, ODS 3, 4 y 11, viabilidad técnica y transparencia sobre el uso de IA.
- Constructor local de sesiones con edición, eliminación, reordenación, validación y vista previa de ejercicios.
- Ahorcado, tipo test, sopa de letras por arrastre o selección de extremos y crucigrama con avance automático jugables.
- La sopa de letras reconoce cualquier aparición válida de una palabra esperada, aunque se repita en distintas posiciones o se seleccione en sentido inverso.
- Ayuda contextual dentro de cada minijuego y revelado de la solución tras una respuesta incorrecta.
- Temporizadores con pausa y reanudación.
- Puntuación basada en acierto y rapidez.
- Ranking por turno, acumulado y podio calculado.
- Español y catalán sin perder el estado de la sesión.
- Diseño responsive y soporte para movimiento reducido.

## Qué requeriría backend en un producto real

- Autenticación con Google, Discord o Facebook.
- Persistencia de cuentas, asignaturas, ejercicios y resultados.
- Salas multijugador y sincronización en tiempo real.
- Invitaciones remotas y presencia real de participantes.
- Roles institucionales, permisos, auditoría y cumplimiento de protección de datos.
- Integraciones con sistemas académicos de las universidades.

Todos los nombres de equipos, participantes y resultados incluidos en la demo son ficticios o simulados localmente.
