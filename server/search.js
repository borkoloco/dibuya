// Lógica de búsqueda compartida: la usan el servidor local (server/index.js)
// y la función serverless de Vercel (api/search.js).
import { cleanRequest, correctSpelling, isBlocked, copyrightSuggestion, toEnglish, pixabayTerms, openverseTerm } from './query.js'
import { searchOpenverse, searchPixabay } from './sources.js'

// Caché en memoria (semilla de la "biblioteca compartida"; después va a una base de datos).
// En Vercel dura lo que viva cada instancia.
const cache = new Map()
const CACHE_TTL = 1000 * 60 * 60 * 6
const CACHE_MAX = 500

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

// Caché en el CDN (Vercel): la misma búsqueda responde desde el borde, al instante
// y sin gastar cuota de Pixabay (que además pide cachear sus resultados 24 h).
// Errores y fuentes desactivadas no se cachean: así se reintenta o se toma una clave nueva.
export function cacheControl(body) {
  if (body.error || body.disabled) return 'no-store'
  return 'public, s-maxage=86400, stale-while-revalidate=604800'
}

// Valida y acota los parámetros de la URL
export function parseParams(searchParams) {
  const p = searchParams
  return {
    source: p.get('source') ?? '',
    q: (p.get('q') ?? '').slice(0, 80),
    lang: p.get('lang') === 'en' ? 'en' : 'es',
    page: Math.max(1, Math.min(20, Number(p.get('page')) || 1)),
    color: p.get('color') ?? 'any',
    difficulty: p.get('difficulty') ?? 'any',
    style: p.get('style') ?? 'any',
  }
}

export async function search({ source, q, page, lang, ...filters }) {
  const typed = cleanRequest(q)
  const query = correctSpelling(typed)
  // corrected: lo que escribió el chico, si se corrigió la ortografía
  const base = { query, items: [], hasMore: false, ...(query !== typed && { corrected: typed }) }
  if (!query) return base
  if (isBlocked(typed) || isBlocked(query)) return { ...base, blocked: true }
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
  if (cache.size >= CACHE_MAX) cache.delete(cache.keys().next().value)
  cache.set(key, { at: Date.now(), value })
  return value
}
