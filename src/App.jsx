import { useCallback, useEffect, useRef, useState } from 'react'
import { useFavorites, useSpeech } from './hooks.js'
import { LANGS, useT } from './i18n.jsx'
import CopyMode from './CopyMode.jsx'

const CATEGORIES = [
  ['🦖', 'dinosaur'], ['🐶', 'dog'], ['🐱', 'cat'], ['🦄', 'unicorn'], ['🐉', 'dragon'],
  ['🚗', 'car'], ['🚀', 'rocket'], ['🤖', 'robot'], ['🏰', 'castle'], ['🧜‍♀️', 'mermaid'],
  ['🦸', 'superhero'], ['🦋', 'butterfly'], ['🦈', 'shark'], ['🌸', 'flower'], ['👻', 'ghost'],
  ['🐴', 'horse'],
]

const FILTERS = {
  color: ['any', 'color', 'outline'],
  difficulty: ['any', 'easy', 'medium', 'detailed'],
  style: ['any', 'cartoon', 'cute', 'realistic'],
}
const DEFAULT_FILTERS = { color: 'any', difficulty: 'any', style: 'any' }
const SOURCE_NAMES = ['pixabay', 'openverse'] // Pixabay primero: es la que responde rápido

export default function App() {
  const { t, lang, nextLang } = useT()
  const [input, setInput] = useState('')
  const [query, setQuery] = useState('')
  const [filters, setFilters] = useState(DEFAULT_FILTERS)
  const [items, setItems] = useState([])
  const [meta, setMeta] = useState({})
  // Estado por fuente: { page, hasMore, status: 'loading' | 'ok' | 'error' | 'disabled' }
  const [sources, setSources] = useState({})
  const [selected, setSelected] = useState(null)
  const [showFavs, setShowFavs] = useState(false)
  const [showFilters, setShowFilters] = useState(false)
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
          setMeta((m) => ({ query: data.query, blocked: data.blocked, copyright: data.copyright ?? m.copyright }))
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

  const shown = showFavs ? favs : items
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

        {query && !showFavs && (
          <button
            onClick={() => setShowFilters((v) => !v)}
            className={`mt-2 rounded-full px-4 py-1.5 text-base font-semibold sm:hidden ${
              showFilters ? 'bg-orange-500 text-white' : 'bg-white ring-1 ring-orange-200'
            }`}
          >
            ⚙️ {t('filters')}{activeFilters ? ` (${activeFilters})` : ''} {showFilters ? '▲' : '▼'}
          </button>
        )}
        {query && !showFavs && (
          <div className={`mt-2 flex-col gap-2 sm:mt-3 sm:flex ${showFilters ? 'flex' : 'hidden'}`}>
            {Object.entries(FILTERS).map(([key, values]) => (
              <div key={key} className="flex gap-2 overflow-x-auto pb-1 [scrollbar-width:none]">
                {values.map((value) => (
                  <button
                    key={value}
                    onClick={() => setFilters((f) => ({ ...f, [key]: value }))}
                    className={`shrink-0 rounded-full px-4 py-1.5 text-base font-semibold ${
                      filters[key] === value ? 'bg-orange-500 text-white' : 'bg-white ring-1 ring-orange-200'
                    }`}
                  >
                    {value === 'any' ? t('any') : t(`${key}.${value}`)}
                  </button>
                ))}
              </div>
            ))}
          </div>
        )}
      </header>

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

      {!showFavs && meta.blocked && <Notice>{t('blocked')}</Notice>}
      {!showFavs && meta.copyright && (
        <Notice>
          {t('copyright')}{' '}
          <button className="font-bold text-orange-600 underline" onClick={() => submit(meta.copyright.suggestion)}>
            {t('tryInstead', { s: meta.copyright.suggestion })}
          </button>
        </Notice>
      )}
      {!showFavs && allFailed && items.length === 0 && <Notice>{t('allFailed')}</Notice>}
      {!showFavs && query && !loading && !meta.blocked && !allFailed && items.length === 0 && (
        <Notice>{t('noResults', { q: meta.query || query })}</Notice>
      )}
      {showFavs && favs.length === 0 && <Notice>{t('noFavs')}</Notice>}

      {shown.length > 0 && (
        <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
          {shown.map((item) => (
            <div key={item.id} className="relative">
              <button
                onClick={() => setSelected(item)}
                className="block aspect-square w-full overflow-hidden rounded-3xl bg-white p-2 shadow-sm ring-2 ring-orange-100 transition active:scale-95"
              >
                <img src={item.thumb} alt={item.title} loading="lazy" className="h-full w-full object-contain" />
              </button>
              <button
                onClick={() => toggle(item)}
                aria-label={t('favorite')}
                className="absolute right-2 top-2 h-10 w-10 rounded-full bg-white/90 text-xl shadow"
              >
                {isFav(item) ? '⭐' : '☆'}
              </button>
            </div>
          ))}
        </div>
      )}

      {!showFavs && loading && (
        <p className={`mt-6 text-center ${items.length ? 'text-base text-stone-500' : 'text-xl'}`}>
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

      {selected && (
        <CopyMode item={selected} isFav={isFav(selected)} onToggleFav={toggle} onClose={() => setSelected(null)} />
      )}
    </div>
  )
}

function Notice({ children }) {
  return <div className="mt-4 rounded-2xl bg-white p-4 text-lg ring-2 ring-orange-200">{children}</div>
}
