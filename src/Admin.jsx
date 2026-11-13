// Página para Santiago: qué pidieron los chicos y con qué palabras habilitarlo.
// Se abre con /?admin. La contraseña es ADMIN_PASSWORD (variable de entorno del backend).
import { useCallback, useEffect, useState } from 'react'

const KEY = 'dibuya:admin'

function savedPassword() {
  try {
    return sessionStorage.getItem(KEY) ?? ''
  } catch {
    return ''
  }
}

export default function Admin() {
  const [password, setPassword] = useState(savedPassword)
  const [data, setData] = useState(null)
  const [error, setError] = useState('')
  const [drafts, setDrafts] = useState({})

  const api = useCallback(
    async (method, body) => {
      const res = await fetch('/api/admin', {
        method,
        headers: { 'Content-Type': 'application/json', 'x-admin-password': password },
        body: body ? JSON.stringify(body) : undefined,
      })
      const json = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(json.error ?? `Error ${res.status}`)
      return json
    },
    [password],
  )

  const load = useCallback(async () => {
    try {
      setData(await api('GET'))
      setError('')
      try {
        sessionStorage.setItem(KEY, password)
      } catch {
        /* sin almacenamiento */
      }
    } catch (err) {
      setData(null)
      setError(err.message)
    }
  }, [api, password])

  useEffect(() => {
    if (savedPassword()) load()
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const act = async (body) => {
    try {
      await api('POST', body)
      await load()
    } catch (err) {
      setError(err.message)
    }
  }

  if (!data) {
    return (
      <form
        className="mx-auto mt-16 max-w-sm px-4"
        onSubmit={(e) => {
          e.preventDefault()
          load()
        }}
      >
        <h1 className="mb-4 text-2xl font-black text-orange-500">✏️ Dibuya · pedidos</h1>
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Contraseña"
          autoFocus
          className="w-full rounded-xl bg-white px-4 py-3 ring-2 ring-orange-200 outline-none focus:ring-orange-400"
        />
        <button className="mt-3 w-full rounded-xl bg-orange-500 py-3 font-bold text-white">Entrar</button>
        {error && <p className="mt-3 text-red-600">{error}</p>}
      </form>
    )
  }

  const { requests, aliases, store } = data
  const pending = requests.filter((r) => !aliases[r.q])
  const enabled = Object.entries(aliases).map(([q, alias]) => ({ q, alias, count: requests.find((r) => r.q === q)?.count ?? 0 }))

  return (
    <div className="mx-auto max-w-3xl px-4 py-6">
      <div className="flex items-center gap-3">
        <h1 className="text-2xl font-black text-orange-500">✏️ Dibuya · pedidos</h1>
        <button onClick={load} className="ml-auto rounded-full bg-white px-4 py-2 font-semibold ring-2 ring-orange-200">
          🔄 Actualizar
        </button>
      </div>
      {store !== 'redis' && (
        <p className="mt-3 rounded-xl bg-yellow-100 p-3 text-sm">
          Los pedidos se guardan en memoria y se pierden al reiniciar. Conectá Upstash Redis en Vercel (Storage) para guardarlos.
        </p>
      )}
      {error && <p className="mt-3 text-red-600">{error}</p>}

      <h2 className="mt-6 text-lg font-bold">Pedidos sin resolver ({pending.length})</h2>
      <p className="text-sm text-stone-500">
        Escribí con qué palabras buscarlo, mejor en inglés (por ejemplo, “bakugan” → “battle toy ball”). Se suma a la búsqueda
        normal y primero se muestran los dibujos que mencionan lo pedido.
      </p>
      <ul className="mt-3 space-y-2">
        {pending.length === 0 && <li className="text-stone-500">No hay pedidos nuevos 🎉</li>}
        {pending.map((r) => (
          <li key={r.q} className="rounded-xl bg-white p-3 ring-1 ring-orange-100">
            <div className="flex flex-wrap items-baseline gap-2">
              <span className="text-lg font-bold">{r.q}</span>
              <span className="text-sm text-stone-500">
                {r.count} {r.count === 1 ? 'vez' : 'veces'}
                {r.last ? ` · ${new Date(r.last).toLocaleDateString('es-AR')}` : ''}
              </span>
              <a href={`/?q=${encodeURIComponent(r.q)}`} target="_blank" rel="noreferrer" className="text-sm text-sky-600 underline">
                ver qué sale
              </a>
            </div>
            <form
              className="mt-2 flex gap-2"
              onSubmit={(e) => {
                e.preventDefault()
                if (drafts[r.q]?.trim()) act({ action: 'alias', q: r.q, alias: drafts[r.q] })
              }}
            >
              <input
                value={drafts[r.q] ?? ''}
                onChange={(e) => setDrafts((d) => ({ ...d, [r.q]: e.target.value }))}
                placeholder="buscar como…"
                className="min-w-0 flex-1 rounded-lg bg-orange-50 px-3 py-2 outline-none ring-1 ring-orange-200 focus:ring-orange-400"
              />
              <button className="rounded-lg bg-orange-500 px-3 py-2 font-semibold text-white">Habilitar</button>
              <button
                type="button"
                onClick={() => act({ action: 'discard', q: r.q })}
                className="rounded-lg bg-stone-100 px-3 py-2 text-stone-600"
              >
                Descartar
              </button>
            </form>
          </li>
        ))}
      </ul>

      <h2 className="mt-8 text-lg font-bold">Habilitados ({enabled.length})</h2>
      <ul className="mt-3 space-y-2">
        {enabled.map((a) => (
          <li key={a.q} className="flex flex-wrap items-center gap-2 rounded-xl bg-white p-3 ring-1 ring-green-200">
            <span className="font-bold">{a.q}</span>
            <span className="text-stone-500">→ {a.alias}</span>
            {a.count > 0 && <span className="text-sm text-stone-400">({a.count})</span>}
            <a href={`/?q=${encodeURIComponent(a.q)}`} target="_blank" rel="noreferrer" className="text-sm text-sky-600 underline">
              probar
            </a>
            <button onClick={() => act({ action: 'unalias', q: a.q })} className="ml-auto rounded-lg bg-stone-100 px-3 py-1 text-stone-600">
              Quitar
            </button>
          </li>
        ))}
      </ul>
    </div>
  )
}
