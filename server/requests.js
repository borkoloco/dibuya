// Pedidos de los chicos ("no encontré lo que buscaba") y las palabras con las que
// Santiago los habilita en la búsqueda (alias: "bakugan" -> "battle toy ball").
//
// Se guarda en Upstash Redis (gratis, se conecta desde Vercel → Storage). Sin
// configurar, queda en memoria: sirve para desarrollar, pero se pierde al reiniciar.
// No se guarda nada que identifique al chico: solo el texto del pedido y cuántas veces se pidió.
import { timingSafeEqual } from 'node:crypto'
import { normalize, cleanRequest, correctSpelling, isBlocked } from './query.js'

const REDIS_URL = process.env.KV_REST_API_URL ?? process.env.UPSTASH_REDIS_REST_URL
const REDIS_TOKEN = process.env.KV_REST_API_TOKEN ?? process.env.UPSTASH_REDIS_REST_TOKEN
// Claves con prefijo: la misma base de Redis puede estar compartida con otros proyectos
const K = { requests: 'dibuya:requests', last: 'dibuya:requests:last', aliases: 'dibuya:aliases' }
const MAX_REQUESTS = 1000 // tope de pedidos distintos guardados, por si alguien abusa

// --- Almacenamiento ---

async function redis(commands) {
  const res = await fetch(`${REDIS_URL}/pipeline`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${REDIS_TOKEN}` },
    body: JSON.stringify(commands),
    signal: AbortSignal.timeout(5000),
  })
  if (!res.ok) throw new Error(`Redis ${res.status}`)
  const out = await res.json()
  return out.map((r) => {
    if (r.error) throw new Error(r.error)
    return r.result
  })
}

const pairs = (flat) => Object.fromEntries(Array.from({ length: flat.length / 2 }, (_, i) => [flat[2 * i], flat[2 * i + 1]]))

const memory = { counts: new Map(), last: new Map(), aliases: new Map() }

const store = REDIS_URL
  ? {
      async add(q) {
        const [score, size] = await redis([['ZSCORE', K.requests, q], ['ZCARD', K.requests]])
        if (score === null && size >= MAX_REQUESTS) return
        await redis([['ZINCRBY', K.requests, 1, q], ['HSET', K.last, q, Date.now()]])
      },
      async list() {
        const [ranked, last, aliases] = await redis([
          ['ZREVRANGE', K.requests, 0, 299, 'WITHSCORES'],
          ['HGETALL', K.last],
          ['HGETALL', K.aliases],
        ])
        const lastMap = pairs(last)
        const requests = Object.entries(pairs(ranked)).map(([q, n]) => ({ q, count: Number(n), last: Number(lastMap[q]) || 0 }))
        return { requests, aliases: pairs(aliases) }
      },
      setAlias: (q, alias) => redis([['HSET', K.aliases, q, alias]]),
      removeAlias: (q) => redis([['HDEL', K.aliases, q]]),
      discard: (q) => redis([['ZREM', K.requests, q], ['HDEL', K.last, q]]),
      aliases: async () => pairs((await redis([['HGETALL', K.aliases]]))[0]),
    }
  : {
      async add(q) {
        if (!memory.counts.has(q) && memory.counts.size >= MAX_REQUESTS) return
        memory.counts.set(q, (memory.counts.get(q) ?? 0) + 1)
        memory.last.set(q, Date.now())
      },
      async list() {
        const requests = [...memory.counts]
          .map(([q, count]) => ({ q, count, last: memory.last.get(q) }))
          .sort((a, b) => b.count - a.count)
        return { requests, aliases: Object.fromEntries(memory.aliases) }
      },
      setAlias: async (q, alias) => memory.aliases.set(q, alias),
      removeAlias: async (q) => memory.aliases.delete(q),
      discard: async (q) => (memory.counts.delete(q), memory.last.delete(q)),
      aliases: async () => Object.fromEntries(memory.aliases),
    }

export const storeKind = REDIS_URL ? 'redis' : 'memoria'

// --- Alias para la búsqueda (con caché corta para no consultar Redis en cada búsqueda) ---

let aliasCache = { at: 0, value: {} }
const ALIAS_TTL = 60 * 1000

export async function getAlias(query) {
  if (Date.now() - aliasCache.at > ALIAS_TTL) {
    try {
      aliasCache = { at: Date.now(), value: await store.aliases() }
    } catch (err) {
      console.warn(`[alias] ${err.message}`)
      aliasCache = { at: Date.now(), value: aliasCache.value }
    }
  }
  return aliasCache.value[query] ?? null
}

// La clave de un pedido es la misma que usa la búsqueda: limpia y con la ortografía corregida
function requestKey(text) {
  const q = correctSpelling(cleanRequest(String(text ?? '').slice(0, 80)))
  return q && q.length <= 60 && !isBlocked(q) ? q : null
}

// --- Handlers (los usan el servidor local y las funciones de Vercel) ---

// POST /api/request  { q }
export async function handleRequest(body) {
  const q = requestKey(body?.q)
  if (!q) return { status: 400, body: { error: 'Pedido inválido' } }
  await store.add(q)
  return { status: 200, body: { ok: true } }
}

function authorized(password) {
  const expected = process.env.ADMIN_PASSWORD
  if (!expected || typeof password !== 'string') return false
  const a = Buffer.from(password)
  const b = Buffer.from(expected)
  return a.length === b.length && timingSafeEqual(a, b)
}

// GET /api/admin  -> lista de pedidos y alias
// POST /api/admin { action: 'alias' | 'unalias' | 'discard', q, alias }
export async function handleAdmin(method, body, password) {
  if (!process.env.ADMIN_PASSWORD) return { status: 503, body: { error: 'Falta configurar ADMIN_PASSWORD' } }
  if (!authorized(password)) return { status: 401, body: { error: 'Contraseña incorrecta' } }

  if (method === 'GET') return { status: 200, body: { ...(await store.list()), store: storeKind } }

  const q = normalize(String(body?.q ?? '')).slice(0, 60)
  if (!q) return { status: 400, body: { error: 'Falta el pedido' } }
  if (body.action === 'alias') {
    const alias = normalize(String(body.alias ?? '')).slice(0, 60)
    if (!alias || isBlocked(alias)) return { status: 400, body: { error: 'Palabras inválidas' } }
    await store.setAlias(q, alias)
  } else if (body.action === 'unalias') {
    await store.removeAlias(q)
  } else if (body.action === 'discard') {
    await store.discard(q)
  } else {
    return { status: 400, body: { error: 'Acción desconocida' } }
  }
  aliasCache.at = 0 // que la búsqueda tome el cambio en esta instancia
  return { status: 200, body: { ok: true } }
}
