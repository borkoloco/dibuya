# Dibuya · App de dibujos para copiar

## La idea

Una app para **chicos que aprenden a dibujar copiando**. El chico pide lo que quiere dibujar (por voz o tocando), ve **muchas opciones** de ese dibujo o personaje, elige una y la tiene en pantalla para **copiarla**.

Surgió de la hermana de Santiago: su hijo empieza a dibujar copiando, y hoy tiene que buscar las imágenes en Google o en una IA.

**No es** una app de "cómo dibujar" ni un generador de dibujos para colorear: es **un buscador de referencias para copiar, hecho para chicos**. El paso a paso de cómo hacer el dibujo puede sumarse más adelante, pero no es el núcleo.

## Flujo principal

1. El chico pide el dibujo: **por voz** (por ejemplo, "quiero dibujar un dinosaurio") o con botones o categorías.
2. Ve una **grilla grande de opciones**, con **"ver más"** para seguir cargando.
3. **Filtros:** con color o solo contornos · dificultad (fácil, media o detallada) · estilo (caricatura, tierno, realista) · pose o versión.
4. Elige una y entra en **modo copiar**: pantalla completa, zoom, pantalla siempre encendida y **cuadrícula opcional** encima.
5. Puede guardar **favoritos**.

## De dónde salen las imágenes

- **Bancos de imágenes con licencia libre**, con API: **Openverse** (Creative Commons), **Pixabay** (ilustraciones y vectores, con `safesearch`) y **Wikimedia Commons**. Son gratis.
- **Generación con IA**, en estilo de dibujo lineal simple, para lo que no se encuentre o para dar más variedad.
- **Biblioteca que crece sola (caché compartida):** lo que se genera o se encuentra para un pedido queda guardado, y el próximo chico que pida lo mismo lo ve al instante y sin costo. Para arrancar, se puede generar de antemano una biblioteca con los 100 a 200 pedidos más comunes.
- **No usar resultados de Google Imágenes:** la mayoría tiene derechos de autor.

## Configuración para padres

- **Fuente de imágenes:** "Generadas con IA" · "Solo bancos libres de derechos" · "Ambas". Con "solo libres de derechos" no aparecen personajes registrados.
- Edad del chico, para ajustar la dificultad.

## Decisiones tomadas

- **La seguridad para chicos está siempre activa**, no es opcional: se filtran los pedidos y las imágenes, vengan de donde vengan.
- **No se guardan grabaciones de voz** del chico: es un dato sensible de un menor. Se pasa la voz a texto y se descarta.
- **Personajes con derechos de autor** (Spider-Man, Pikachu, etc.): es lo primero que van a pedir. Falta decidir qué mostrar en esos casos (por ejemplo, ofrecer "un superhéroe con capa roja").
- **El costo de la IA se controla** con la biblioteca compartida, priorizando los bancos libres y con límites de uso.

## Cómo seguir

- **Primero, un prototipo simple:** pedir por voz o texto → grilla con filtros (empezando por Pixabay y Openverse) → modo copiar.
- **Validar con el sobrino de Santiago:** si lo usa solo y vuelve al otro día, la idea tiene algo. Preguntarle a la hermana si los padres pagarían y cuánto.
- Stack sugerido, el mismo que usa Santiago: React + Vite + Tailwind. Las claves de las APIs van en un backend o en funciones serverless, nunca en el frontend.

## Nombre

**Dibuya** ("dibujá ya"). El 13/11/2026 no aparecía como app y `dibuya.com` estaba libre. Pendiente: buscarlo en la base de marcas del INPI, revisar Google Play y la App Store, y registrar el dominio.

## Contexto de Santiago

Desarrollador full stack (React, Node), en Buenos Aires. En paralelo tiene una búsqueda laboral activa y otros proyectos (PAM, una web de servicios), así que conviene avanzar con prototipos chicos y validar antes de invertir mucho tiempo.
