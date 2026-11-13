# Mejoras posibles

Lista viva de mejoras para Dibuya. Se ordena por lo que más ayuda a **validar la idea con el sobrino de Santiago** antes de invertir más tiempo.

**Esfuerzo:** 🟢 horas · 🟡 uno o dos días · 🔴 una semana o más.
**Estado:** `[ ]` pendiente · `[x]` hecho · `[~]` en curso o decidido no hacer.

---

## 1. Antes de la prueba con el sobrino

Lo mínimo para que la prueba sea justa: que encuentre lo que pide, rápido, y que no se frustre.

- [ ] 🟢 **Caché en el CDN de Vercel.** Agregar `Cache-Control: s-maxage` a `/api/search`. Las búsquedas repetidas responden al instante desde el borde y no gastan cuota de Pixabay. Hoy la caché en memoria casi no sirve en serverless.
- [ ] 🟢 **Clave propia de Pixabay.** Hoy se comparte con PAM: son 100 consultas por minuto entre las dos apps.
- [ ] 🟢 **Sumar vectores de Pixabay** (`image_type=vector`) además de ilustraciones. Suelen ser dibujos más limpios y con mejores contornos, ideales para copiar.
- [ ] 🟢 **Tolerancia a errores de ortografía.** "dinosaurrio" o "unicornyo" deberían encontrar algo. Se puede hacer con una búsqueda aproximada contra el diccionario de [server/query.js](server/query.js).
- [ ] 🟡 **Registrar Dibuya en Openverse (OAuth).** Da más cuota que el acceso anónimo. Hay que probar si además baja los 504 y los ~15 segundos por consulta; si no, evaluar reemplazar Openverse.
- [ ] 🟡 **Medir qué se busca**, de forma anónima: el texto del pedido, si dio resultados y qué dibujo se eligió, sin datos del chico. Sirve para ver qué falla en la prueba y para armar la biblioteca inicial con los pedidos más comunes. Vercel Analytics no usa cookies.

## 2. Modo copiar

Es el núcleo de la app: donde más valor se puede sumar.

- [ ] 🟡 **"Solo contornos" en cualquier imagen.** Convertir el dibujo elegido a líneas, con detección de bordes en un canvas. Así cualquier ilustración a color se vuelve fácil de copiar. Hay que verificar que los bancos permitan leer las imágenes desde otro dominio (CORS); si no, pasarlas por el backend.
- [ ] 🟢 **Cuadrícula numerada** (A, B, C… / 1, 2, 3…), para copiar celda por celda en una hoja con la misma cuadrícula.
- [ ] 🟢 **Espejar y rotar** la imagen.
- [ ] 🟡 **Modo calcar.** Brillo al máximo, fondo blanco y toques bloqueados, para apoyar una hoja sobre la tablet y calcar.
- [ ] 🟢 **Bloqueo de pantalla.** Que un toque sin querer no saque al chico del dibujo. Se desbloquea manteniendo apretado un botón.
- [ ] 🔴 **Paso a paso** de cómo hacer el dibujo. Más adelante: el CLAUDE.md dice que no es el núcleo.

## 3. Para chicos que todavía no leen bien

- [ ] 🟢 **Más categorías, y subcategorías.** Por ejemplo, dinosaurio → T-rex, de cuello largo, con alas.
- [ ] 🟢 **Chips de "lo más pedido"** debajo del buscador.
- [ ] 🟡 **Que la app hable.** Leer en voz alta los avisos ("No encontré eso, ¿probamos con…?") con la síntesis de voz del navegador.
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
- [ ] 🟢 **Edad del chico**, para elegir la dificultad por defecto.
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
