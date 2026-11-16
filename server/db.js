// Conexión a Upstash Redis por su API REST (sin dependencias). La usan los pedidos
// (requests.js) y las estadísticas (stats.js). Sin configurar, cada módulo guarda en memoria.
export const REDIS_URL = process.env.KV_REST_API_URL ?? process.env.UPSTASH_REDIS_REST_URL
const REDIS_TOKEN = process.env.KV_REST_API_TOKEN ?? process.env.UPSTASH_REDIS_REST_TOKEN

export const storeKind = REDIS_URL ? 'redis' : 'memoria'

// Manda varios comandos en un solo pedido (pipeline) y devuelve sus resultados
export async function redis(commands) {
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

// ['a', '1', 'b', '2'] -> { a: '1', b: '2' }
export const pairs = (flat) =>
  Object.fromEntries(Array.from({ length: (flat?.length ?? 0) / 2 }, (_, i) => [flat[2 * i], flat[2 * i + 1]]))
