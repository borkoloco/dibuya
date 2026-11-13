// Backend mínimo: guarda las claves, filtra pedidos/resultados y une las fuentes.
// Sin dependencias: http nativo de Node.
import http from 'node:http'
import { readFile } from 'node:fs/promises'
import { extname, join } from 'node:path'
import { cleanRequest, isBlocked, copyrightSuggestion, toEnglish, pixabayTerms, openverseTerm } from './query.js'
import { searchOpenverse, searchPixabay } from './sources.js'

const PORT = Number(process.env.PORT) || 8787
const DIST = new URL('../dist/', import.meta.url).pathname

// Caché en memoria (semilla de la "biblioteca compartida"; después va a una base de datos)
const cache = new Map()
const CACHE_TTL = 1000 * 60 * 60 * 6

// Cada fuente se consulta por separado: el frontend pide a todas en paralelo
// y muestra cada resultado apenas llega (Openverse puede tardar ~15 s).
const SOURCES = {
  pixabay: {
    enabled: () => Boolean(process.env.PIXABAY_KEY),
    run: (query, page, f, lang) => searchPixabay(query, pixabayTerms(f, lang), page, f, lang),
  },
  openverse: {
    enabled: () => true,
    run: (query, page, f) => searchOpenverse(toEnglish(query), openverseTerm(f), page),
  },
}

async function search({ source, q, page, lang, ...filters }) {
  const query = cleanRequest(q)
  const base = { query, items: [], hasMore: false }
  if (!query) return base
  if (isBlocked(query)) return { ...base, blocked: true }
  const copyright = copyrightSuggestion(query, lang)

  const src = SOURCES[source]
  if (!src?.enabled()) return { ...base, copyright, disabled: true }

  const key = JSON.stringify([source, lang, query, page, filters])
  const hit = cache.get(key)
  if (hit && Date.now() - hit.at < CACHE_TTL) return hit.value

  let list
  try {
    list = await src.run(query, page, filters, lang)
  } catch (err) {
    console.warn(`[search] ${source}: ${err.message}`)
    return { ...base, copyright, error: true }
  }

  // Volver a filtrar por seguridad sobre título/tags
  const items = list.filter((it) => !isBlocked(`${it.title} ${it.tags}`)).map(({ tags, ...rest }) => rest)
  const value = { ...base, copyright, items, hasMore: list.length >= 20 }
  cache.set(key, { at: Date.now(), value })
  return value
}

const MIME = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.svg': 'image/svg+xml', '.png': 'image/png' }

const server = http.createServer(async (req, res) => {
  const url = new URL(req.url, `http://${req.headers.host}`)
  try {
    if (url.pathname === '/api/search') {
      const p = url.searchParams
      const body = await search({
        source: p.get('source') ?? '',
        q: (p.get('q') ?? '').slice(0, 80),
        lang: p.get('lang') === 'en' ? 'en' : 'es',
        page: Math.max(1, Math.min(20, Number(p.get('page')) || 1)),
        color: p.get('color') ?? 'any',
        difficulty: p.get('difficulty') ?? 'any',
        style: p.get('style') ?? 'any',
      })
      res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' })
      return res.end(JSON.stringify(body))
    }
    // En producción sirve el build del frontend
    const file = url.pathname === '/' ? 'index.html' : url.pathname.slice(1)
    const data = await readFile(join(DIST, file)).catch(() => readFile(join(DIST, 'index.html')))
    res.writeHead(200, { 'Content-Type': MIME[extname(file)] ?? 'text/html' })
    res.end(data)
  } catch (err) {
    console.error(err)
    res.writeHead(500, { 'Content-Type': 'application/json' })
    res.end(JSON.stringify({ error: 'Algo salió mal' }))
  }
})

server.listen(PORT, () => {
  console.log(`API en http://localhost:${PORT}  (Pixabay: ${process.env.PIXABAY_KEY ? 'sí' : 'no, falta PIXABAY_KEY'})`)
})
