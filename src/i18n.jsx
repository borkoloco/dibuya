// Traducciones: un diccionario por idioma y un hook useT().
// Para sumar un idioma: agregar su objeto acá (mismas claves) y su código en LANGS.
import { createContext, useCallback, useContext, useEffect, useState } from 'react'

export const LANGS = [
  { code: 'es', label: 'ES', speech: 'es-AR' },
  { code: 'en', label: 'EN', speech: 'en-US' },
]

const MESSAGES = {
  es: {
    placeholder: '¿Qué querés dibujar?',
    speak: 'Hablar',
    search: 'Buscar',
    listening: 'Te escucho… decí qué querés dibujar',
    filters: 'Filtros',
    pickOne: 'O elegí uno:',
    any: 'Todo',
    'color.color': '🎨 Con color',
    'color.outline': '✏️ Contornos',
    'difficulty.easy': '🙂 Fácil',
    'difficulty.medium': '😎 Media',
    'difficulty.detailed': '🤓 Detallada',
    'style.cartoon': 'Caricatura',
    'style.cute': 'Tierno',
    'style.realistic': 'Realista',
    hama: 'Hama / píxeles',
    size: 'Tamaño',
    colors: 'Colores',
    view: 'Ver',
    beads: 'Cuentas',
    pixels: 'Píxeles',
    download: 'Descargar',
    hamaLoading: 'Armando la cuadrícula… 🟦',
    hamaError: 'No pudimos convertir este dibujo. Probá con otro: los dibujos simples y con color salen mejor.',
    hamaTip: 'Tocá un color para ver solo ese. Tocá una cuenta para marcarla como puesta.',
    hamaTotal: '{n} cuentas',
    boards: '{n} placa(s) de 29×29',
    searchedAs: '🔎 Buscamos “{q}”',
    holdToOpen: 'Mantené apretado para abrir (adultos)',
    blocked: '🙈 Eso no lo podemos buscar. ¡Probá con un animal, un auto o un castillo!',
    copyright: 'Ese personaje es de una marca y casi no hay dibujos libres.',
    tryInstead: '¿Probamos con “{s}”?',
    allFailed: '😵 Los bancos de imágenes no responden. Probá de nuevo en un ratito.',
    noResults: 'No encontramos dibujos de “{q}”. Probá con otra palabra o sacá algún filtro.',
    noFavs: 'Todavía no tenés favoritos. Tocá la ☆ en un dibujo para guardarlo.',
    favorite: 'Favorito',
    loading: 'Buscando dibujos… ✏️',
    loadingMore: 'Buscando más dibujos…',
    more: 'Ver más',
    back: 'Volver',
    zoomOut: 'Alejar',
    zoomIn: 'Acercar',
    grid: 'Cuadrícula',
    info: 'De dónde es',
    untitled: 'Sin título',
    author: 'Autor',
    unknownAuthor: 'Autor desconocido',
    original: 'Ver original',
    language: 'Idioma',
    'cat.dinosaur': 'dinosaurio', 'cat.dog': 'perro', 'cat.cat': 'gato', 'cat.unicorn': 'unicornio',
    'cat.dragon': 'dragón', 'cat.car': 'auto', 'cat.rocket': 'cohete', 'cat.robot': 'robot',
    'cat.castle': 'castillo', 'cat.mermaid': 'sirena', 'cat.superhero': 'superhéroe',
    'cat.butterfly': 'mariposa', 'cat.shark': 'tiburón', 'cat.flower': 'flor', 'cat.ghost': 'fantasma',
    'cat.horse': 'caballo',
  },
  en: {
    placeholder: 'What do you want to draw?',
    speak: 'Speak',
    search: 'Search',
    listening: "I'm listening… say what you want to draw",
    filters: 'Filters',
    pickOne: 'Or pick one:',
    any: 'All',
    'color.color': '🎨 Color',
    'color.outline': '✏️ Outlines',
    'difficulty.easy': '🙂 Easy',
    'difficulty.medium': '😎 Medium',
    'difficulty.detailed': '🤓 Detailed',
    'style.cartoon': 'Cartoon',
    'style.cute': 'Cute',
    'style.realistic': 'Realistic',
    hama: 'Beads / pixels',
    size: 'Size',
    colors: 'Colors',
    view: 'View',
    beads: 'Beads',
    pixels: 'Pixels',
    download: 'Download',
    hamaLoading: 'Making the grid… 🟦',
    hamaError: "We couldn't convert this drawing. Try another one: simple, colorful drawings work best.",
    hamaTip: 'Tap a color to see only that one. Tap a bead to mark it as placed.',
    hamaTotal: '{n} beads',
    boards: '{n} 29×29 board(s)',
    searchedAs: '🔎 We searched for “{q}”',
    holdToOpen: 'Press and hold to open (grown-ups)',
    blocked: "🙈 We can't search for that. Try an animal, a car or a castle!",
    copyright: 'That character belongs to a brand, so there are almost no free drawings of it.',
    tryInstead: 'How about “{s}”?',
    allFailed: "😵 The image libraries aren't answering. Try again in a little while.",
    noResults: "We couldn't find drawings of “{q}”. Try another word or remove a filter.",
    noFavs: "You don't have favorites yet. Tap the ☆ on a drawing to save it.",
    favorite: 'Favorite',
    loading: 'Looking for drawings… ✏️',
    loadingMore: 'Looking for more drawings…',
    more: 'Show more',
    back: 'Back',
    zoomOut: 'Zoom out',
    zoomIn: 'Zoom in',
    grid: 'Grid',
    info: 'Where it comes from',
    untitled: 'Untitled',
    author: 'Author',
    unknownAuthor: 'Unknown author',
    original: 'See original',
    language: 'Language',
    'cat.dinosaur': 'dinosaur', 'cat.dog': 'dog', 'cat.cat': 'cat', 'cat.unicorn': 'unicorn',
    'cat.dragon': 'dragon', 'cat.car': 'car', 'cat.rocket': 'rocket', 'cat.robot': 'robot',
    'cat.castle': 'castle', 'cat.mermaid': 'mermaid', 'cat.superhero': 'superhero',
    'cat.butterfly': 'butterfly', 'cat.shark': 'shark', 'cat.flower': 'flower', 'cat.ghost': 'ghost',
    'cat.horse': 'horse',
  },
}

const STORAGE_KEY = 'dibuya:idioma'

function initialLang() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY)
    if (MESSAGES[saved]) return saved
  } catch {
    /* sin almacenamiento */
  }
  const browser = (navigator.language || 'es').slice(0, 2)
  return MESSAGES[browser] ? browser : 'es'
}

const I18nContext = createContext(null)

export function I18nProvider({ children }) {
  const [lang, setLang] = useState(initialLang)

  useEffect(() => {
    document.documentElement.lang = lang
    try {
      localStorage.setItem(STORAGE_KEY, lang)
    } catch {
      /* sin almacenamiento: el idioma dura la sesión */
    }
  }, [lang])

  // t('noResults', { q: 'gato' }) -> reemplaza {q}
  const t = useCallback(
    (key, vars) => {
      const text = MESSAGES[lang][key] ?? MESSAGES.es[key] ?? key
      return vars ? text.replace(/\{(\w+)\}/g, (_, k) => vars[k] ?? '') : text
    },
    [lang],
  )

  const nextLang = useCallback(() => {
    setLang((l) => LANGS[(LANGS.findIndex((x) => x.code === l) + 1) % LANGS.length].code)
  }, [])

  return <I18nContext.Provider value={{ lang, setLang, nextLang, t }}>{children}</I18nContext.Provider>
}

export function useT() {
  return useContext(I18nContext)
}
