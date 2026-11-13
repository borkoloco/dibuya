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
    letsDraw: '¡A dibujar! ✏️',
    about: '👋 ¿Qué es {name}?',
    close: 'Cerrar',
    welcome:
      '¡Bienvenidos a {name}!\n\n¿Tienes ganas de dibujar, pero no sabes por dónde empezar? ¡Este es tu lugar!\n\nViaja por un mundo lleno de dibujos, descubre animales, personajes, lugares, objetos y criaturas increíbles de diferentes rincones del mundo.\n\nBusca tus favoritos, encuentra nuevas ideas, copia los que más te gusten o deja volar tu imaginación para crear tu propia versión.\n\n¡Mira, descubre, inspírate y dibuja! Porque las mejores creaciones empiezan con una idea.',
    speak: 'Hablar',
    search: 'Buscar',
    listening: 'Te escucho… decí qué querés dibujar',
    filters: 'Filtros',
    pickOne: 'O elegí uno:',
    any: 'Todo',
    'color.color': 'Con color',
    'color.outline': 'Solo líneas',
    'difficulty.easy': 'Fácil',
    'difficulty.medium': 'Media',
    'difficulty.detailed': 'Difícil',
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
    blocked: 'Eso no lo podemos buscar. ¡Probá con otra cosa!',
    copyright: 'Ese personaje es de una marca y hay pocos dibujos libres: te mostramos también dibujos parecidos.',
    tryInstead: '¿Probamos con “{s}”?',
    allFailed: 'Los bancos de imágenes no responden. Probá de nuevo en un ratito.',
    retry: '🔄 Probar de nuevo',
    tryThese: 'Probá con:',
    requestAsk: '¿No está lo que buscabas?',
    requestBtn: '📮 Pedilo',
    requestSent: '🙌 ¡Listo! Lo vamos a buscar.',
    requestError: 'No se pudo enviar. Probá de nuevo.',
    noResults: 'No encontramos dibujos de “{q}”.',
    removeFilters: 'Sacar los filtros',
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
    'cat.horse': 'caballo', 'cat.princess': 'princesa', 'cat.astronaut': 'astronauta', 'cat.lion': 'león',
    'cat.panda': 'panda', 'cat.turtle': 'tortuga', 'cat.airplane': 'avión', 'cat.train': 'tren', 'cat.pirate': 'pirata',
  },
  en: {
    placeholder: 'What do you want to draw?',
    letsDraw: "Let's draw! ✏️",
    about: '👋 What is {name}?',
    close: 'Close',
    welcome:
      "Welcome to {name}!\n\nDo you feel like drawing but don't know where to start? This is your place!\n\nTravel through a world full of drawings and discover amazing animals, characters, places, objects and creatures from every corner of the world.\n\nFind your favorites, get new ideas, copy the ones you like best or let your imagination fly and create your own version.\n\nLook, discover, get inspired and draw! Because the best creations start with an idea.",
    speak: 'Speak',
    search: 'Search',
    listening: "I'm listening… say what you want to draw",
    filters: 'Filters',
    pickOne: 'Or pick one:',
    any: 'All',
    'color.color': 'Color',
    'color.outline': 'Just lines',
    'difficulty.easy': 'Easy',
    'difficulty.medium': 'Medium',
    'difficulty.detailed': 'Hard',
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
    blocked: "We can't search for that. Try something else!",
    copyright: "That character belongs to a brand, so there are few free drawings of it: we're also showing similar ones.",
    tryInstead: 'How about “{s}”?',
    allFailed: "The image libraries aren't answering. Try again in a little while.",
    retry: '🔄 Try again',
    tryThese: 'Try:',
    requestAsk: "Can't find what you wanted?",
    requestBtn: '📮 Ask for it',
    requestSent: "🙌 Done! We'll look for it.",
    requestError: "Couldn't send it. Try again.",
    noResults: "We couldn't find drawings of “{q}”.",
    removeFilters: 'Remove filters',
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
    'cat.horse': 'horse', 'cat.princess': 'princess', 'cat.astronaut': 'astronaut', 'cat.lion': 'lion',
    'cat.panda': 'panda', 'cat.turtle': 'turtle', 'cat.airplane': 'airplane', 'cat.train': 'train', 'cat.pirate': 'pirate',
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
