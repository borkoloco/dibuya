import { useCallback, useEffect, useRef, useState } from 'react'
import { useFavorites, useSpeech } from './hooks.js'
import { LANGS, useT } from './i18n.jsx'
import CopyMode from './CopyMode.jsx'

const CATEGORIES = [
  ['🦖', 'dinosaur'], ['🐶', 'dog'], ['🐱', 'cat'], ['🦄', 'unicorn'], ['🐉', 'dragon'],
  ['🚗', 'car'], ['🚀', 'rocket'], ['🤖', 'robot'], ['🏰', 'castle'], ['🧜‍♀️', 'mermaid'],
  ['🦸', 'superhero'], ['🦋', 'butterfly'], ['🦈', 'shark'], ['🌸', 'flower'], ['👻', 'ghost'],
  ['🐴', 'horse'], ['👸', 'princess'], ['🧑‍🚀', 'astronaut'], ['🦁', 'lion'], ['🐼', 'panda'],
  ['🐢', 'turtle'], ['✈️', 'airplane'], ['🚂', 'train'], ['🏴‍☠️', 'pirate'],
]

// Filtros con íconos grandes: tocar uno lo activa, tocarlo de nuevo lo saca
const FILTERS = {
  color: [['color', '🎨'], ['outline', '✏️']],
  difficulty: [['easy', '⭐'], ['medium', '⭐⭐'], ['detailed', '⭐⭐⭐']],
  style: [['cartoon', '🤪'], ['cute', '🥰'], ['realistic', '📷']],
}
const DEFAULT_FILTERS = { color: 'any', difficulty: 'any', style: 'any' }
const SOURCE_NAMES = ['pixabay', 'openverse'] // Pixabay primero: es la que responde rápido

export default function App() {
  const { t, lang, nextLang } = useT()
  // /?q=dinosaurio abre la app con esa búsqueda (lo usan los links de la página de pedidos)
  const [input, setInput] = useState(() => new URLSearchParams(location.search).get('q')?.slice(0, 80) ?? '')
  const [query, setQuery] = useState(input)
  const [filters, setFilters] = useState(DEFAULT_FILTERS)
  const [items, setItems] = useState([])
  const [meta, setMeta] = useState({})
  // Estado por fuente: { page, hasMore, status: 'loading' | 'ok' | 'error' | 'disabled' }
  const [sources, setSources] = useState({})
  const [selected, setSelected] = useState(null)
  const [showFavs, setShowFavs] = useState(false)
  const [requested, setRequested] = useState(() => new Set()) // pedidos ya enviados en esta sesión
  const activeFilters = Object.values(filters).filter((v) => v !== 'any').length
  const reqId = useRef(0)
  const sourcesRef = useRef({})
  // El idioma de búsqueda se lee de una ref: cambiar de idioma no relanza la búsqueda actual
  const langRef = useRef(lang)
  langRef.current = lang
  const { favs, isFav, toggle } = useFavorites()

  const updateSource = (name, patch) => {
    sourcesRef.current = { ...sourcesRef.current, [name]: { ...sourcesRef.current[name], ...patch } }
    setSources(sourcesRef.current)
  }

  // Pide a cada fuente por separado y suma sus dibujos apenas llegan,
  // al final de la grilla (así no se reordena lo que el chico ya está mirando).
  const runSearch = useCallback((q, f, reset) => {
    if (!q.trim()) return
    if (reset) {
      reqId.current++
      sourcesRef.current = Object.fromEntries(SOURCE_NAMES.map((n) => [n, { page: 0, hasMore: true }]))
      setItems([])
      setMeta({})
    }
    const id = reqId.current
    for (const name of SOURCE_NAMES) {
      const s = sourcesRef.current[name]
      if (!s.hasMore || s.status === 'loading') continue
      const page = s.page + 1
      updateSource(name, { status: 'loading' })
      const params = new URLSearchParams({ source: name, q, page: String(page), lang: langRef.current, ...f })
      fetch(`/api/search?${params}`)
        .then((res) => res.json())
        .then((data) => {
          if (id !== reqId.current) return
          setMeta((m) => ({
            query: data.query,
            corrected: data.corrected,
            blocked: data.blocked,
            copyright: data.copyright ?? m.copyright,
          }))
          setItems((prev) => {
            const ids = new Set(prev.map((i) => i.id))
            return [...prev, ...(data.items ?? []).filter((i) => !ids.has(i.id))]
          })
          updateSource(name, {
            page,
            hasMore: data.hasMore,
            status: data.disabled ? 'disabled' : data.error ? 'error' : 'ok',
          })
        })
        .catch(() => id === reqId.current && updateSource(name, { status: 'error' }))
    }
  }, [])

  useEffect(() => {
    if (query) runSearch(query, filters, true)
  }, [query, filters, runSearch])

  const active = Object.values(sources).filter((s) => s.status !== 'disabled')
  const loading = active.some((s) => s.status === 'loading')
  const allFailed = active.length > 0 && active.every((s) => s.status === 'error')
  // "Ver más" aparece apenas una fuente terminó y tiene más páginas, aunque otra siga cargando
  const canLoadMore = active.some((s) => s.hasMore && s.status === 'ok')

  const submit = (text) => {
    const q = text.trim()
    if (!q) return
    setInput(q)
    setShowFavs(false)
    if (q === query) runSearch(q, filters, true)
    else setQuery(q)
  }

  const speechLang = LANGS.find((l) => l.code === lang)?.speech
  const speech = useSpeech(useCallback((text) => submit(text), [query, filters]), speechLang) // eslint-disable-line react-hooks/exhaustive-deps

  const loadMore = () => runSearch(query, filters, false)

  const goHome = () => {
    reqId.current++
    sourcesRef.current = {}
    setSources({})
    setQuery('')
    setInput('')
    setItems([])
    setMeta({})
    setShowFavs(false)
  }

  // Imágenes que no cargan (Openverse a veces devuelve 424 en las miniaturas): se ocultan
  const [broken, setBroken] = useState(() => new Set())
  const markBroken = useCallback((item) => setBroken((prev) => new Set(prev).add(item.id)), [])

  const shown = (showFavs ? favs : items).filter((item) => !broken.has(item.id))
  const nextLabel = LANGS[(LANGS.findIndex((l) => l.code === lang) + 1) % LANGS.length].label

  return (
    <div className="mx-auto max-w-6xl px-4 pb-16">
      <header className="sticky top-0 z-10 -mx-4 bg-orange-50/95 px-4 pt-[max(.75rem,env(safe-area-inset-top))] pb-3 backdrop-blur">
        <div className="flex items-center gap-2">
          <button onClick={goHome} className="text-2xl font-black tracking-tight text-orange-500 sm:text-3xl">
            ✏️ Dibuya
          </button>
          <button
            onClick={nextLang}
            aria-label={`${t('language')}: ${nextLabel}`}
            title={t('language')}
            className="ml-auto rounded-full bg-white px-3 py-2 text-base font-bold ring-2 ring-orange-200"
          >
            🌐 {LANGS.find((l) => l.code === lang)?.label}
          </button>
          <button
            onClick={() => setShowFavs((v) => !v)}
            className={`rounded-full px-4 py-2 text-lg font-bold ${showFavs ? 'bg-yellow-300' : 'bg-white ring-2 ring-orange-200'}`}
          >
            ⭐ {favs.length}
          </button>
        </div>

        <form
          className="mt-3 flex gap-2"
          onSubmit={(e) => {
            e.preventDefault()
            submit(input)
          }}
        >
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={t('placeholder')}
            enterKeyHint="search"
            className="min-w-0 flex-1 rounded-full bg-white px-4 py-3 text-lg ring-2 ring-orange-200 outline-none focus:ring-orange-400 sm:px-5 sm:text-xl"
          />
          {speech.supported && (
            <button
              type="button"
              onClick={speech.listening ? speech.stop : speech.start}
              aria-label={t('speak')}
              className={`h-12 w-12 shrink-0 rounded-full text-2xl text-white shadow sm:h-14 sm:w-14 ${speech.listening ? 'animate-pulse bg-red-500' : 'bg-orange-500'}`}
            >
              🎤
            </button>
          )}
          <button type="submit" aria-label={t('search')} className="h-12 w-12 shrink-0 rounded-full bg-sky-500 text-2xl text-white shadow sm:h-14 sm:w-14">
            🔍
          </button>
        </form>
        {speech.listening && <p className="mt-2 text-center text-lg font-semibold text-red-500">{t('listening')}</p>}
      </header>

      {/* Fuera del encabezado fijo: al bajar por la grilla, los filtros no tapan los dibujos */}
      {query && !showFavs && (
        <div className="mt-1 flex flex-wrap gap-2" role="group" aria-label={t('filters')}>
          {Object.entries(FILTERS).map(([key, options]) => (
            <div key={key} className="flex gap-1 rounded-3xl bg-white p-1 ring-2 ring-orange-100">
              {options.map(([value, icon]) => {
                const on = filters[key] === value
                return (
                  <button
                    key={value}
                    aria-pressed={on}
                    onClick={() => setFilters((f) => ({ ...f, [key]: on ? 'any' : value }))}
                    className={`flex h-16 min-w-14 flex-col items-center justify-center rounded-2xl px-1.5 transition active:scale-90 ${
                      on ? 'bg-orange-500 text-white shadow' : ''
                    }`}
                  >
                    <span className={`leading-none ${key === 'difficulty' ? 'text-base' : 'text-2xl'}`}>{icon}</span>
                    <span className="mt-1 text-[11px] leading-none font-bold">{t(`${key}.${value}`)}</span>
                  </button>
                )
              })}
            </div>
          ))}
        </div>
      )}

      {!query && !showFavs && (
        <section className="mt-4">
          <h2 className="mb-3 text-xl font-bold">{t('pickOne')}</h2>
          <div className="grid grid-cols-3 gap-3 sm:grid-cols-4 lg:grid-cols-8">
            {CATEGORIES.map(([emoji, id]) => (
              <button
                key={id}
                onClick={() => submit(t(`cat.${id}`))}
                className="flex aspect-square flex-col items-center justify-center rounded-3xl bg-white shadow-sm ring-2 ring-orange-100 transition active:scale-95"
              >
                <span className="text-5xl">{emoji}</span>
                <span className="mt-1 text-sm font-semibold capitalize">{t(`cat.${id}`)}</span>
              </button>
            ))}
          </div>
        </section>
      )}

      {!showFavs && meta.corrected && !meta.blocked && (
        <p className="mt-3 text-base text-stone-600">{t('searchedAs', { q: meta.query })}</p>
      )}
      {!showFavs && meta.blocked && (
        <Notice emoji="🙈">
          {t('blocked')}
          <Suggestions seed={query} onPick={submit} />
        </Notice>
      )}
      {!showFavs && meta.copyright && (
        <Notice emoji="🦸">
          {t('copyright')}{' '}
          <button className="font-bold text-orange-600 underline" onClick={() => submit(meta.copyright.suggestion)}>
            {t('tryInstead', { s: meta.copyright.suggestion })}
          </button>
        </Notice>
      )}
      {!showFavs && allFailed && items.length === 0 && (
        <Notice emoji="😵">
          {t('allFailed')}
          <div>
            <button onClick={() => runSearch(query, filters, true)} className="mt-3 rounded-full bg-orange-500 px-6 py-3 font-bold text-white shadow active:scale-95">
              {t('retry')}
            </button>
          </div>
        </Notice>
      )}
      {!showFavs && query && !loading && !meta.blocked && !allFailed && items.length === 0 && (
        <Notice emoji="🤔">
          {t('noResults', { q: meta.query || query })}
          {activeFilters > 0 && (
            <div>
              <button onClick={() => setFilters(DEFAULT_FILTERS)} className="mt-3 rounded-full bg-orange-500 px-6 py-3 font-bold text-white shadow active:scale-95">
                {t('removeFilters')}
              </button>
            </div>
          )}
          <RequestButton q={meta.query || query} requested={requested} setRequested={setRequested} big />
          <Suggestions seed={query} onPick={submit} />
        </Notice>
      )}
      {showFavs && favs.length === 0 && <Notice emoji="⭐">{t('noFavs')}</Notice>}

      {shown.length > 0 && (
        <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
          {shown.map((item) => (
            <div key={item.id} className="relative">
              <button
                onClick={() => setSelected(item)}
                aria-label={item.title}
                className="block aspect-square w-full overflow-hidden rounded-3xl bg-white p-2 shadow-sm ring-2 ring-orange-100 transition active:scale-95"
              >
                <Thumb item={item} onBroken={markBroken} />
              </button>
              <button
                onClick={() => toggle(item)}
                aria-label={t('favorite')}
                className="absolute right-2 top-2 h-12 w-12 rounded-full bg-white/90 text-2xl shadow active:scale-90"
              >
                <span key={isFav(item) ? 'on' : 'off'} className={isFav(item) ? 'pop inline-block' : 'inline-block'}>
                  {isFav(item) ? '⭐' : '☆'}
                </span>
              </button>
            </div>
          ))}
        </div>
      )}

      {!showFavs && loading && (
        <p className={`mt-6 text-center ${items.length ? 'text-base text-stone-500' : 'text-xl'}`}>
          {!items.length && <span className="mb-2 block animate-bounce text-5xl">✏️</span>}
          {items.length ? t('loadingMore') : t('loading')}
        </p>
      )}

      {!showFavs && canLoadMore && items.length > 0 && (
        <div className="mt-6 text-center">
          <button onClick={loadMore} className="rounded-full bg-orange-500 px-8 py-4 text-xl font-bold text-white shadow active:scale-95">
            {t('more')}
          </button>
        </div>
      )}

      {!showFavs && !loading && items.length > 0 && (
        <div className="mt-8 text-center text-base text-stone-600">
          {t('requestAsk')} <RequestButton q={meta.query || query} requested={requested} setRequested={setRequested} />
        </div>
      )}

      {selected && (
        <CopyMode item={selected} isFav={isFav(selected)} onToggleFav={toggle} onClose={() => setSelected(null)} />
      )}
    </div>
  )
}

// Miniatura prolija: fondo suave mientras carga (nunca el texto alternativo ni el
// ícono roto); si falla, prueba la imagen completa y, si tampoco anda, avisa para ocultarla.
function Thumb({ item, onBroken }) {
  const [src, setSrc] = useState(item.thumb)
  const [loaded, setLoaded] = useState(false)

  const onError = () => {
    if (item.full && src !== item.full) setSrc(item.full)
    else onBroken(item)
  }

  return (
    <span className={`block h-full w-full rounded-2xl ${loaded ? '' : 'animate-pulse bg-orange-50'}`}>
      <img
        src={src}
        alt=""
        loading="lazy"
        onLoad={() => setLoaded(true)}
        onError={onError}
        className={`h-full w-full object-contain transition-opacity duration-300 ${loaded ? 'opacity-100' : 'opacity-0'}`}
      />
    </span>
  )
}

// Avisos con un dibujo grande: el chico entiende qué pasa aunque no lea todo
function Notice({ emoji, children }) {
  return (
    <div className="mt-4 rounded-3xl bg-white p-5 text-center text-lg ring-2 ring-orange-200">
      {emoji && <div className="mb-2 text-6xl">{emoji}</div>}
      {children}
    </div>
  )
}

// Nunca un callejón sin salida: categorías para tocar cuando no hay resultados
function Suggestions({ seed, onPick }) {
  const { t } = useT()
  // Siempre las mismas 4 para el mismo pedido (no cambian en cada render)
  let h = 0
  for (const ch of seed) h = (h * 31 + ch.charCodeAt(0)) >>> 0
  const picks = Array.from({ length: 4 }, (_, i) => CATEGORIES[(h + i * 7) % CATEGORIES.length])
  return (
    <div className="mt-4">
      <p className="mb-2 text-base text-stone-500">{t('tryThese')}</p>
      <div className="grid grid-cols-4 gap-2">
        {picks.map(([emoji, id]) => (
          <button
            key={id}
            onClick={() => onPick(t(`cat.${id}`))}
            className="flex aspect-square flex-col items-center justify-center rounded-2xl bg-orange-50 ring-2 ring-orange-100 active:scale-95"
          >
            <span className="text-4xl">{emoji}</span>
            <span className="mt-1 text-xs font-semibold capitalize">{t(`cat.${id}`)}</span>
          </button>
        ))}
      </div>
    </div>
  )
}

// "No encontré lo que buscaba": manda el pedido para que Santiago lo habilite
function RequestButton({ q, requested, setRequested, big }) {
  const { t } = useT()
  const [status, setStatus] = useState('idle') // idle | sending | error
  const sent = requested.has(q)

  const send = async () => {
    setStatus('sending')
    try {
      const res = await fetch('/api/request', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ q }),
      })
      if (!res.ok) throw new Error(res.status)
      setRequested((prev) => new Set(prev).add(q))
      setStatus('idle')
    } catch {
      setStatus('error')
    }
  }

  if (sent) return <p className={`font-bold text-green-600 ${big ? 'mt-4 text-xl' : 'mt-2'}`}>{t('requestSent')}</p>
  return (
    <span className={big ? 'mt-4 block' : 'inline-block'}>
      {big && <span className="mb-2 block text-base text-stone-600">{t('requestAsk')}</span>}
      <button
        onClick={send}
        disabled={status === 'sending'}
        className={`rounded-full font-bold shadow active:scale-95 disabled:opacity-60 ${
          big ? 'bg-sky-500 px-8 py-4 text-xl text-white' : 'bg-white px-5 py-2 text-base ring-2 ring-sky-300'
        }`}
      >
        {t('requestBtn')}
      </button>
      {status === 'error' && <span className="mt-2 block text-base text-red-500">{t('requestError')}</span>}
    </span>
  )
}
