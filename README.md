# Dibuya · prototipo

Pedir un dibujo (voz o texto) → grilla con filtros → modo copiar. La idea completa está en [CLAUDE.md](CLAUDE.md).

## Correr

```bash
npm install
cp .env.example .env   # opcional: poner PIXABAY_KEY (gratis en pixabay.com/api/docs)
npm run dev            # web en http://localhost:5173 · API en :8787
```

Para probar en el celular, en la misma red: `npm run dev:web -- --host` y abrir la IP que muestra Vite.
(El micrófono y la pantalla siempre encendida piden HTTPS fuera de localhost.)

Producción simple: `npm run build && npm start` (el backend sirve `dist/`).

## Qué hay

- `server/`: backend Node sin dependencias. Guarda las claves, limpia el pedido ("quiero dibujar un dinosaurio" → "dinosaurio"), aplica la seguridad al pedido y a los resultados, traduce al inglés para Openverse, une las fuentes y guarda una caché en memoria.
- `src/App.jsx`: búsqueda por texto o voz, categorías, filtros, grilla, "ver más" y favoritos (en el dispositivo).
- `src/CopyMode.jsx`: pantalla completa, zoom (pellizco, rueda, botones o doble toque), cuadrícula 3×3/4×4/6×6, pantalla siempre encendida y el crédito del autor.

## Limitaciones conocidas

- **Openverse sin cuenta es lento e inestable** (~15 s por consulta, con 504 frecuentes). Con `PIXABAY_KEY` la app responde mucho mejor. Siguiente paso: registrar una app en Openverse (OAuth) para tener más cuota.
- Los filtros de color y dificultad funcionan sobre todo con Pixabay; Openverse admite un solo término extra por búsqueda.
- La voz usa el reconocimiento del navegador (en Chrome, el audio lo procesa Google). Dibuya no graba ni guarda nada, pero conviene decirlo en la configuración para padres.
- Personajes con derechos: por ahora se busca igual y se sugiere una alternativa genérica (decisión pendiente).
- Pixabay no permite enlazar sus imágenes de forma permanente: para la biblioteca compartida hay que descargarlas a almacenamiento propio.
