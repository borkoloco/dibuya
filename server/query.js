// Interpreta el pedido del chico: limpia la frase, chequea seguridad,
// detecta personajes con derechos y traduce al inglés para Openverse.

export function normalize(text) {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9ñ\s-]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

// "quiero dibujar un dinosaurio" / "I want to draw a dinosaur" -> "dinosaurio" / "dinosaur"
const FILLER = [
  'quiero dibujar', 'quiero hacer', 'quiero', 'dibujame', 'dibujar', 'dibujo de', 'dibujo',
  'mostrame', 'busca', 'buscame', 'me gustaria', 'podes', 'por favor', 'porfa',
  'i want to draw', 'i wanna draw', 'i want to make', 'i want', 'i would like to draw', 'i would like',
  'can you', 'draw me', 'draw', 'drawing of', 'drawings of', 'show me', 'search for', 'search', 'please',
]
const ARTICLES = new Set(['un', 'una', 'unos', 'unas', 'el', 'la', 'los', 'las', 'de', 'del', 'a', 'an', 'the', 'some', 'of'])

export function cleanRequest(text) {
  let q = normalize(text)
  for (const f of FILLER) q = q.replace(new RegExp(`\\b${f}\\b`, 'g'), ' ')
  const words = q.split(' ').filter(Boolean)
  while (words.length > 1 && ARTICLES.has(words[0])) words.shift()
  return words.join(' ').trim()
}

// --- Seguridad (siempre activa) ---
// Lista inicial, conservadora. Se aplica al pedido y a los títulos/tags de los resultados.
const BLOCKED = [
  'sexo', 'sex', 'sexy', 'porno', 'porn', 'desnud', 'nude', 'naked', 'nsfw', 'erotic', 'erotica',
  'lenceria', 'lingerie', 'bikini', 'tetas', 'boobs', 'pene', 'vagina', 'hentai',
  'gore', 'sangre', 'blood', 'cadaver', 'corpse', 'suicid', 'tortura', 'torture', 'decapit',
  'droga', 'drug', 'cocaina', 'cocaine', 'marihuana', 'marijuana', 'cannabis', 'porro',
  'nazi', 'swastika', 'esvastica', 'terroris',
]

export function isBlocked(text) {
  const t = normalize(text)
  return BLOCKED.some((w) => t.includes(w))
}

// --- Personajes con derechos (decisión pendiente en CLAUDE.md) ---
// Provisorio: igual se busca en los bancos (casi no tienen estos personajes)
// y se sugiere una alternativa genérica.
const SPIDER = { es: 'superhéroe araña', en: 'spider superhero' }
const ICE_PRINCESS = { es: 'princesa de hielo', en: 'ice princess' }
const COPYRIGHTED = {
  spiderman: SPIDER,
  'spider man': SPIDER,
  'hombre arana': SPIDER,
  batman: { es: 'superhéroe murciélago', en: 'bat superhero' },
  superman: { es: 'superhéroe con capa', en: 'superhero with cape' },
  pikachu: { es: 'ratón amarillo tierno', en: 'cute yellow mouse' },
  pokemon: { es: 'monstruo tierno', en: 'cute monster' },
  mario: { es: 'plomero con gorra', en: 'plumber with cap' },
  sonic: { es: 'erizo azul', en: 'blue hedgehog' },
  elsa: ICE_PRINCESS,
  frozen: ICE_PRINCESS,
  mickey: { es: 'ratón de caricatura', en: 'cartoon mouse' },
  minecraft: { es: 'personaje de cubos', en: 'blocky character' },
  stitch: { es: 'extraterrestre azul tierno', en: 'cute blue alien' },
  goku: { es: 'guerrero de anime', en: 'anime warrior' },
  hulk: { es: 'superhéroe verde', en: 'green superhero' },
  'paw patrol': { es: 'perrito rescatista', en: 'rescue puppy' },
  bluey: { es: 'perrita de caricatura', en: 'cartoon puppy' },
  'hello kitty': { es: 'gatita tierna', en: 'cute kitty' },
}

export function copyrightSuggestion(q, lang = 'es') {
  for (const [name, alt] of Object.entries(COPYRIGHTED)) {
    if (new RegExp(`\\b${name}\\b`).test(q)) return { character: name, suggestion: alt[lang] ?? alt.es }
  }
  return null
}

// --- Traducción mínima es -> en (Openverse indexa casi todo en inglés) ---
const ES_EN = {
  dinosaurio: 'dinosaur', dinosaurios: 'dinosaurs', perro: 'dog', perrito: 'puppy', gato: 'cat',
  gatito: 'kitten', caballo: 'horse', unicornio: 'unicorn', dragon: 'dragon', leon: 'lion',
  tigre: 'tiger', elefante: 'elephant', jirafa: 'giraffe', mono: 'monkey', oso: 'bear',
  conejo: 'rabbit', pajaro: 'bird', pez: 'fish', tiburon: 'shark', ballena: 'whale',
  delfin: 'dolphin', mariposa: 'butterfly', tortuga: 'turtle', pinguino: 'penguin', buho: 'owl',
  vaca: 'cow', cerdo: 'pig', chancho: 'pig', pato: 'duck', gallina: 'chicken', zorro: 'fox',
  lobo: 'wolf', rana: 'frog', serpiente: 'snake', arana: 'spider', abeja: 'bee', panda: 'panda',
  auto: 'car', coche: 'car', camion: 'truck', avion: 'airplane', barco: 'ship', tren: 'train',
  cohete: 'rocket', moto: 'motorcycle', bicicleta: 'bicycle', helicoptero: 'helicopter',
  robot: 'robot', casa: 'house', castillo: 'castle', flor: 'flower', flores: 'flowers',
  arbol: 'tree', sol: 'sun', luna: 'moon', estrella: 'star', nube: 'cloud', arcoiris: 'rainbow',
  montana: 'mountain', playa: 'beach', princesa: 'princess', principe: 'prince', hada: 'fairy',
  sirena: 'mermaid', pirata: 'pirate', caballero: 'knight', bruja: 'witch', mago: 'wizard',
  superheroe: 'superhero', astronauta: 'astronaut', extraterrestre: 'alien', monstruo: 'monster',
  fantasma: 'ghost', calabaza: 'pumpkin', corazon: 'heart', pelota: 'ball', futbol: 'soccer',
  nena: 'girl', nene: 'boy', chica: 'girl', chico: 'boy', familia: 'family', cara: 'face',
  manzana: 'apple', helado: 'ice cream', torta: 'cake', pizza: 'pizza', banana: 'banana',
  capa: 'cape', roja: 'red', rojo: 'red', azul: 'blue', verde: 'green', amarillo: 'yellow',
  tierno: 'cute', tierna: 'cute', con: 'with', ninja: 'ninja', vaquero: 'cowboy',
  bombero: 'firefighter', policia: 'police', medico: 'doctor', payaso: 'clown',
}

export function toEnglish(q) {
  return q
    .split(' ')
    .filter((w) => !ARTICLES.has(w))
    .map((w) => ES_EN[w] ?? w)
    .join(' ')
}

// Pixabay: los términos tienen que estar en el mismo idioma que `lang`.
// Mezclar ("dinosaurio line art" con lang=es) desplaza al tema: aparecen brújulas o rosas.
const PIXABAY_TERMS = {
  es: { outline: 'contorno', cartoon: 'caricatura', cute: 'tierno', realistic: 'realista', easy: 'simple', detailed: 'detallado' },
  en: { outline: 'outline', cartoon: 'cartoon', cute: 'cute', realistic: 'realistic', easy: 'simple', detailed: 'detailed' },
}

export function pixabayTerms({ color, difficulty, style }, lang = 'es') {
  const words = PIXABAY_TERMS[lang] ?? PIXABAY_TERMS.es
  return [color === 'outline' && 'outline', style, difficulty]
    .map((k) => words[k])
    .filter(Boolean)
    .slice(0, 2)
}

// Openverse: un solo término (más términos = casi siempre 0 resultados)
export function openverseTerm({ color, style }) {
  if (style === 'cartoon') return 'cartoon'
  if (style === 'cute') return 'cute'
  if (style === 'realistic') return null
  if (color === 'outline') return 'line drawing'
  return 'clipart'
}
