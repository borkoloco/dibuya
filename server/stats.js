// Estadísticas de uso para la página de admin, sin datos personales ni cookies:
// - Cada dispositivo avisa "entré hoy" una sola vez por día (lo decide el navegador
//   con una fecha en localStorage). No se manda ningún identificador.
// - Se cuentan búsquedas, dibujos abiertos, modo Hama y favoritos por día.
// - Lo más buscado del mes, con el texto limpio (mismo filtro que los pedidos).
// Las claves vencen solas a los 400 días.
import { REDIS_URL, redis, pairs } from './db.js'
import { requestKey } from './query.js'

export const EVENTS = ['visit', 'search', 'copy', 'hama', 'fav']
const TTL = 60 * 60 * 24 * 400
const DAYS = 30

// Fecha en Buenos Aires (el "hoy" del admin), como AAAA-MM-DD
function day(date = new Date()) {
  return new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Argentina/Buenos_Aires' }).format(date)
}
const dayKey = (d) => `dibuya:stats:${d}`
const topKey = (d) => `dibuya:top:${d.slice(0, 7)}`

const memory = { days: new Map(), top: new Map() }

// POST /api/event { type, q?, new? }
export async function handleEvent(body) {
  const type = body?.type
  if (!EVENTS.includes(type)) return { status: 400, body: { error: 'Evento desconocido' } }
  const today = day()
  const fields = [type]
  if (type === 'visit' && body.new === true) fields.push('new')
  const q = type === 'search' ? requestKey(body.q) : null

  if (REDIS_URL) {
    const commands = fields.map((f) => ['HINCRBY', dayKey(today), f, 1])
    if (q) commands.push(['ZINCRBY', topKey(today), 1, q])
    // El vencimiento se renueva una vez por visita (no en cada evento: ahorra comandos)
    if (type === 'visit') commands.push(['EXPIRE', dayKey(today), TTL], ['EXPIRE', topKey(today), TTL])
    await redis(commands)
  } else {
    const counts = memory.days.get(today) ?? {}
    for (const f of fields) counts[f] = (counts[f] ?? 0) + 1
    memory.days.set(today, counts)
    if (q) memory.top.set(q, (memory.top.get(q) ?? 0) + 1)
  }
  return { status: 200, body: { ok: true } }
}

// Para el admin: los últimos 30 días (de más viejo a hoy) y lo más buscado del mes
export async function getStats() {
  const days = Array.from({ length: DAYS }, (_, i) => day(new Date(Date.now() - (DAYS - 1 - i) * 86400000)))
  let counts
  let top
  if (REDIS_URL) {
    const out = await redis([...days.map((d) => ['HGETALL', dayKey(d)]), ['ZREVRANGE', topKey(days.at(-1)), 0, 19, 'WITHSCORES']])
    counts = out.slice(0, DAYS).map(pairs)
    top = Object.entries(pairs(out.at(-1)))
  } else {
    counts = days.map((d) => memory.days.get(d) ?? {})
    top = [...memory.top].sort((a, b) => b[1] - a[1]).slice(0, 20)
  }
  return {
    days: days.map((date, i) => ({
      date,
      ...Object.fromEntries([...EVENTS, 'new'].map((e) => [e, Number(counts[i][e]) || 0])),
    })),
    top: top.map(([q, n]) => ({ q, count: Number(n) })),
  }
}
