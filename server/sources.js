// Fuentes de imágenes libres. Cada una devuelve una lista normalizada:
// { id, source, thumb, full, title, author, license, link }

const PER_PAGE = 20

function licenseLabel(license, version) {
  const l = String(license).toLowerCase()
  const name = l === 'cc0' ? 'CC0' : l === 'pdm' ? 'Public Domain Mark' : `CC ${l.toUpperCase()}`
  return [name, version].filter(Boolean).join(' ')
}

async function openverseFetch(q, page) {
  const params = new URLSearchParams({
    q,
    page: String(page),
    page_size: String(PER_PAGE),
    category: 'illustration',
    mature: 'false',
  })
  const res = await fetch(`https://api.openverse.org/v1/images/?${params}`, {
    headers: { 'User-Agent': 'Dibuya/0.1 (prototipo)' },
    signal: AbortSignal.timeout(20_000), // Openverse anónimo puede tardar ~15 s
  })
  if (!res.ok) throw new Error(`Openverse ${res.status}`)
  return res.json()
}

// Openverse exige todos los términos (AND): se prueba "tema + 1 término de estilo"
// y, si no hay resultados, solo el tema. Si falla la red, no se reintenta (es lento).
export async function searchOpenverse(subject, styleTerm, page) {
  let data = await openverseFetch(styleTerm ? `${subject} ${styleTerm}` : subject, page)
  if (!data.results?.length && styleTerm) data = await openverseFetch(subject, page)
  return (data.results ?? [])
    .filter((r) => !r.mature)
    .map((r) => ({
      id: `ov-${r.id}`,
      source: 'Openverse',
      thumb: r.thumbnail || r.url,
      full: r.url,
      title: r.title || '',
      tags: (r.tags ?? []).map((t) => t.name).join(' '),
      author: r.creator || '',
      license: licenseLabel(r.license, r.license_version),
      link: r.foreign_landing_url,
    }))
}

export async function searchPixabay(query, extraTerms, page, { color }, lang = 'es') {
  const key = process.env.PIXABAY_KEY
  if (!key) return []
  const params = new URLSearchParams({
    key,
    q: [query, ...extraTerms].join(' ').slice(0, 100),
    lang,
    image_type: 'illustration',
    safesearch: 'true',
    page: String(page),
    per_page: String(PER_PAGE),
  })
  if (color === 'outline') params.set('colors', 'grayscale')
  const res = await fetch(`https://pixabay.com/api/?${params}`, { signal: AbortSignal.timeout(10_000) })
  if (!res.ok) throw new Error(`Pixabay ${res.status}`)
  const data = await res.json()
  return (data.hits ?? []).map((h) => ({
    id: `px-${h.id}`,
    source: 'Pixabay',
    thumb: h.webformatURL,
    full: h.largeImageURL || h.webformatURL,
    title: h.tags,
    tags: h.tags,
    author: h.user,
    license: 'Pixabay Content License',
    link: h.pageURL,
  }))
}
