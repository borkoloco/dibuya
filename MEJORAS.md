# Mejoras posibles

Lista viva de mejoras para Dibuya. Se ordena por lo que más ayuda a **validar la idea con el sobrino de Santiago** antes de invertir más tiempo.

**Esfuerzo:** 🟢 horas · 🟡 uno o dos días · 🔴 una semana o más.
**Estado:** `[ ]` pendiente · `[x]` hecho · `[~]` en curso o decidido no hacer.

---

## 1. Antes de la prueba con el sobrino

Lo mínimo para que la prueba sea justa: que encuentre lo que pide, rápido, y que no se frustre.

- [x] 🟢 **Caché en el CDN de Vercel.** Agregar `Cache-Control: s-maxage` a `/api/search`. Las búsquedas repetidas responden al instante desde el borde y no gastan cuota de Pixabay. Hoy la caché en memoria casi no sirve en serverless.
- [ ] 🟢 **Clave propia de Pixabay.** Hoy se comparte con PAM: son 100 consultas por minuto entre las dos apps.
- [~] 🟢 **Sumar vectores de Pixabay** (`image_type=vector`). Descartado: se probó y la búsqueda de ilustraciones ya incluye casi todos los vectores; aportaba poco y duplicaba consultas.
- [x] 🟢 **Tolerancia a errores de ortografía.** "dinosaurrio", "unicornyo", "castiyo" o "unicron" encuentran lo que corresponde, comparando contra el vocabulario de [server/query.js](server/query.js) también por cómo suena (ll/y, v/b, z/s, h muda). Las palabras cortas no se corrigen, para no cambiar palabras válidas. Cuando hay corrección, la app muestra qué se buscó.
- [ ] 🟡 **Registrar Dibuya en Openverse (OAuth).** Da más cuota que el acceso anónimo. Hay que probar si además baja los 504 y los ~15 segundos por consulta; si no, evaluar reemplazar Openverse.
- [ ] 🟡 **Medir qué se busca**, de forma anónima: el texto del pedido, si dio resultados y qué dibujo se eligió, sin datos del chico. Sirve para ver qué falla en la prueba y para armar la biblioteca inicial con los pedidos más comunes. Vercel Analytics no usa cookies.

## 2. Modo copiar

Es el núcleo de la app: donde más valor se puede sumar.

- [x] 🟡 **Modo Hama / pixel art** (idea de Rosario, 13/11/2026). Primera versión hecha: botón 🟦 en el modo copiar, en [src/HamaMode.jsx](src/HamaMode.jsx) y [src/pixelate.js](src/pixelate.js). Falta probarla con Juanchi. Un botón en el modo copiar que convierte el dibujo elegido en una cuadrícula de píxeles, para armarlo con cuentas Hama o dibujarlo en papel cuadriculado. Propuesta:
  - **Tamaño de la cuadrícula:** 15×15 (chico), 29×29 (el pegboard cuadrado estándar de Hama) y 58×58 (cuatro pegboards).
  - **Colores:** reducir la imagen a pocos colores (4, 8 o 16) o a la paleta real de colores de Hama, para que el chico sepa qué cuentas usar.
  - **Fondo:** el blanco o transparente queda como espacio vacío del pegboard.
  - **Para armarlo:** líneas más marcadas cada 5 celdas, la cantidad de cuentas de cada color y tocar una celda para marcarla como hecha.
  - **Descargar o imprimir** la cuadrícula.
  - Funciona mejor con dibujos simples y con color: sugerir los filtros "Fácil" y "Con color".
  - **Técnica:** se hace en el navegador con un canvas. Pixabay permite leer los colores de sus imágenes (`access-control-allow-origin: *`, verificado); Openverse falta verificarlo y, si no lo permite, se pasan sus imágenes por el backend.

- [ ] 🟡 **"Solo contornos" en cualquier imagen.** Convertir el dibujo elegido a líneas, con detección de bordes en un canvas. Así cualquier ilustración a color se vuelve fácil de copiar. Hay que verificar que los bancos permitan leer las imágenes desde otro dominio (CORS); si no, pasarlas por el backend.
- [ ] 🟢 **Cuadrícula numerada** (A, B, C… / 1, 2, 3…), para copiar celda por celda en una hoja con la misma cuadrícula.
- [ ] 🟢 **Espejar y rotar** la imagen.
- [ ] 🟡 **Modo calcar.** Brillo al máximo, fondo blanco y toques bloqueados, para apoyar una hoja sobre la tablet y calcar.
- [ ] 🟢 **Bloqueo de pantalla.** Que un toque sin querer no saque al chico del dibujo. Se desbloquea manteniendo apretado un botón.
- [ ] 🔴 **Paso a paso** de cómo hacer el dibujo. Más adelante: el CLAUDE.md dice que no es el núcleo.

## 3. Experiencia para chicos

Comentario de Rosario (13/11/2026), después de ver a Juanchi usarla: él entiende las palabras de ahora y los filtros le sirven a la mamá, pero si la van a manejar los chicos, tiene que ser **más visual**. Propone además un perfil con edad, qué le gusta dibujar y qué no quiere que le aparezca.

### Filtros visuales

- [ ] 🟡 **Filtros con dibujos en lugar de palabras.** Cada opción muestra el mismo dibujo de ejemplo, por ejemplo un dinosaurio:
  - **Color o contornos:** el dinosaurio pintado y el mismo solo con líneas.
  - **Dificultad:** tres versiones del dinosaurio, de muy simple a detallada, o 1, 2 y 3 estrellas.
  - **Estilo:** caricatura, tierno y realista, cada uno con su ejemplo.
- [ ] 🟢 **Separar filtros de chico y de adulto.** Para el chico, solo "más fácil / más difícil" y "con color / para pintar". Los filtros completos pasan a la configuración para padres.

### Perfil del chico

- [ ] 🟡 **Perfil la primera vez que se abre la app**, en tres pantallas de toques, sin escribir nada:
  1. **Avatar:** elegir un personaje dibujado, sin foto.
  2. **Edad:** números grandes para tocar, del 3 al 12.
  3. **Qué te gusta dibujar:** tarjetas como animales, dinosaurios, autos, princesas, superhéroes, espacio o naturaleza.
  4. **Qué no querés que aparezca:** por ejemplo, cosas que dan miedo, arañas o monstruos.
- [ ] 🟢 **Qué cambia con el perfil:** la edad define la dificultad por defecto; lo que le gusta, el orden de las categorías del inicio; y lo que no quiere ver se excluye de los resultados.
- [ ] 🟢 **Varios perfiles en el mismo dispositivo**, para hermanos.
- **Decisión de diseño:** preguntar por **gustos, no por el género**. Lo que importa para mostrar dibujos es qué le gusta; preguntar el género lleva a estereotipos ("princesas para nenas") y es un dato personal más de un menor que no hace falta. El perfil se guarda solo en el dispositivo, sin nombre real.

### Principios para una app de chicos

- **Mostrar, no escribir.** Íconos y dibujos con poco texto. Cada botón importante se lee en voz alta al tocarlo.
- **Botones grandes**, de 60 px o más, con mucho espacio entre ellos: los dedos de un chico son menos precisos.
- **Pocas opciones a la vez.** Mejor dos o tres opciones grandes que diez chicas.
- **Nunca un callejón sin salida.** Si no hay resultados, mostrar sugerencias para tocar, no solo un mensaje.
- **Respuesta inmediata** a cada toque, con animación o sonido suave. Celebrar cuando guarda un favorito o termina un dibujo.
- **Nada que lo saque de la app.** Hoy el enlace "Ver original" del modo copiar abre otra página: tiene que quedar detrás de la puerta para padres.
- **Siempre el mismo botón para volver al inicio**, en el mismo lugar.

### Otras mejoras

- [x] 🟢 **Enlaces externos detrás de un gesto de adulto.** "Ver original" ahora hay que mantenerlo apretado 1,5 segundos. Cuando exista la puerta para padres, se puede pasar ahí.
- [ ] 🟢 **Más categorías, y subcategorías.** Por ejemplo, dinosaurio → T-rex, de cuello largo, con alas.
- [ ] 🟢 **Chips de "lo más pedido"** debajo del buscador.
- [ ] 🟡 **Que la app hable.** Leer en voz alta los avisos y los botones ("No encontré eso, ¿probamos con…?") con la síntesis de voz del navegador.
- [ ] 🟢 **Avisos más visuales.** Ilustraciones simples en lugar de solo texto cuando no hay resultados o hay un error.

## 4. Seguridad

- [ ] 🟡 **Revisar las imágenes, no solo los textos.** Hoy se filtran el pedido y los títulos y etiquetas de los resultados. Falta una moderación de cada imagen, hecha una sola vez y guardada en la biblioteca, para no pagarla de nuevo. Por ejemplo, con Google Cloud Vision SafeSearch o con un modelo de visión.
- [ ] 🟢 **Botón "esta imagen no está bien"** para los padres, que la oculte para todos.
- [ ] 🟢 **Ampliar la lista de palabras bloqueadas** y la de personajes con derechos, con lo que aparezca en las búsquedas medidas.
- [ ] 🟢 **Puerta para padres.** Algo que un chico chico no pueda resolver solo, como mantener apretado un botón o resolver una cuenta, antes de entrar a la configuración.
- [ ] 🟢 **Aviso de privacidad sobre la voz.** Dibuya no guarda audio, pero el reconocimiento del navegador lo procesa Google (en Chrome) o Apple (en Safari). Decirlo claro en la configuración para padres.

## 5. Biblioteca compartida y costos

- [ ] 🟡 **Base de datos para la caché compartida**, con Supabase o Upstash. Lo que un chico busca, el siguiente lo ve al instante.
- [ ] 🟡 **Copia propia de las imágenes**, en Vercel Blob, Supabase Storage o Cloudflare R2. Hace falta por dos motivos: Pixabay no permite enlazar sus imágenes de forma permanente, y así los favoritos no se rompen.
- [ ] 🟡 **Precargar la biblioteca** con los 100 a 200 pedidos más comunes.
- [ ] 🔴 **Generación con IA** en estilo de dibujo lineal, para lo que no se encuentre. Requiere un modelo de imágenes externo y límites de uso por día. Lo generado se guarda en la biblioteca.
- [ ] 🟢 **Límite de consultas por usuario** en la API, para proteger la cuota de Pixabay ante abusos.

## 6. Configuración para padres

Ya definida en el CLAUDE.md, pendiente de hacer.

- [ ] 🟡 **Fuente de imágenes:** generadas con IA · solo bancos libres · ambas.
- [ ] 🟢 **Editar el perfil del chico** (edad, gustos, qué no quiere ver): ver la sección 3.
- [ ] 🟢 **Filtros completos** de color, dificultad y estilo, para el adulto que acompaña.
- [ ] 🟢 **Idioma por defecto.**

## 7. App instalable (PWA)

- [ ] 🟡 **Instalable desde el navegador**, con ícono propio y pantalla completa sin barra de direcciones.
- [ ] 🟡 **Favoritos disponibles sin internet**, guardando sus imágenes en el dispositivo.

## 8. Calidad del código

- [ ] 🟢 **Tests de [server/query.js](server/query.js):** la limpieza del pedido, los bloqueos, los personajes con derechos y los términos de filtro. Es donde más fácil se rompe algo sin darse cuenta.
- [ ] 🟢 **ESLint** y verificación del build en cada PR, con GitHub Actions.
- [ ] 🟢 **Monitoreo de errores** en producción, con Sentry o los logs de Vercel.

## Limitaciones conocidas

- Al cambiar de idioma, la búsqueda que está en pantalla no se vuelve a lanzar.
- Los favoritos guardan la URL de la imagen, no la imagen: si el banco la cambia, el favorito queda roto. Se arregla con la copia propia de las imágenes (sección 5).
- El filtro de dificultad solo agrega una palabra a la búsqueda ("simple", "detallado"): no mide la complejidad real del dibujo.
- El reconocimiento de voz no existe en Firefox, y en iOS anda con limitaciones.
- En iPhone no hay pantalla completa real para una web; el modo copiar ocupa toda la pantalla igual.

## Pendientes fuera del código

- [ ] Probar con el sobrino: ¿lo usa solo? ¿vuelve al otro día?
- [ ] Preguntarle a la hermana si los padres pagarían, y cuánto.
- [ ] Decidir qué mostrar con los personajes con derechos. Hoy se sugiere una alternativa genérica, como "superhéroe araña".
- [ ] Nombre: buscar "Dibuya" en la base de marcas del INPI, revisar Google Play y la App Store, y registrar `dibuya.com`.
