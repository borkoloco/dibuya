// Convierte un dibujo en una cuadrícula de cuentas (tipo Hama) o píxeles.
// Todo corre en el navegador con un canvas: no se sube nada a ningún servidor.

// Colores aproximados de cuentas de planchar. No son los códigos oficiales de
// ninguna marca: sirven para que el chico elija qué cuenta usar.
export const BEAD_COLORS = [
  { id: 'white', es: 'Blanco', en: 'White', rgb: [236, 237, 237] },
  { id: 'cream', es: 'Crema', en: 'Cream', rgb: [240, 232, 185] },
  { id: 'yellow', es: 'Amarillo', en: 'Yellow', rgb: [240, 185, 1] },
  { id: 'lightorange', es: 'Naranja claro', en: 'Light orange', rgb: [244, 146, 38] },
  { id: 'orange', es: 'Naranja', en: 'Orange', rgb: [230, 79, 39] },
  { id: 'red', es: 'Rojo', en: 'Red', rgb: [182, 49, 54] },
  { id: 'burgundy', es: 'Bordó', en: 'Burgundy', rgb: [120, 40, 48] },
  { id: 'pink', es: 'Rosa', en: 'Pink', rgb: [225, 136, 159] },
  { id: 'skin', es: 'Piel', en: 'Skin', rgb: [240, 190, 165] },
  { id: 'purple', es: 'Violeta', en: 'Purple', rgb: [105, 74, 130] },
  { id: 'blue', es: 'Azul', en: 'Blue', rgb: [44, 70, 144] },
  { id: 'lightblue', es: 'Celeste', en: 'Light blue', rgb: [90, 150, 215] },
  { id: 'turquoise', es: 'Turquesa', en: 'Turquoise', rgb: [86, 186, 175] },
  { id: 'green', es: 'Verde', en: 'Green', rgb: [28, 117, 62] },
  { id: 'lime', es: 'Verde claro', en: 'Light green', rgb: [125, 190, 70] },
  { id: 'brown', es: 'Marrón', en: 'Brown', rgb: [83, 65, 55] },
  { id: 'lightbrown', es: 'Marrón claro', en: 'Light brown', rgb: [165, 105, 63] },
  { id: 'beige', es: 'Beige', en: 'Beige', rgb: [222, 180, 139] },
  { id: 'darkgray', es: 'Gris oscuro', en: 'Dark gray', rgb: [85, 88, 90] },
  { id: 'gray', es: 'Gris', en: 'Gray', rgb: [131, 136, 138] },
  { id: 'lightgray', es: 'Gris claro', en: 'Light gray', rgb: [190, 192, 192] },
  { id: 'black', es: 'Negro', en: 'Black', rgb: [46, 47, 49] },
]

// Carga la primera imagen que el navegador pueda leer (los bancos tienen que
// permitirlo con CORS; si no, el canvas queda "manchado" y getImageData falla).
export async function loadReadableImage(urls) {
  for (const url of urls.filter(Boolean)) {
    try {
      const img = await new Promise((resolve, reject) => {
        const el = new Image()
        el.crossOrigin = 'anonymous'
        el.onload = () => resolve(el)
        el.onerror = reject
        el.src = url
      })
      const probe = document.createElement('canvas').getContext('2d')
      probe.drawImage(img, 0, 0, 1, 1)
      probe.getImageData(0, 0, 1, 1)
      return img
    } catch {
      /* probar la siguiente */
    }
  }
  throw new Error('No se pudo leer ninguna imagen')
}

const WORK_SIZE = 480 // resolución de trabajo: suficiente detalle y rápido en celulares

export function pixelate(img, { size, maxColors }) {
  // 1. Dibujar la imagen en un canvas de trabajo
  const scale = Math.min(1, WORK_SIZE / Math.max(img.naturalWidth, img.naturalHeight))
  const W = Math.max(1, Math.round(img.naturalWidth * scale))
  const H = Math.max(1, Math.round(img.naturalHeight * scale))
  const canvas = document.createElement('canvas')
  canvas.width = W
  canvas.height = H
  const ctx = canvas.getContext('2d', { willReadFrequently: true })
  ctx.drawImage(img, 0, 0, W, H)
  const { data } = ctx.getImageData(0, 0, W, H)

  // 2. Fondo = zona del color de fondo conectada con el borde (relleno desde afuera).
  //    Así el mismo color adentro del dibujo (ojos blancos, panza) se mantiene como cuenta.
  const light = backgroundTest(data, W, H)
  const bg = new Uint8Array(W * H)
  const queue = new Int32Array(W * H)
  let head = 0
  let tail = 0
  const push = (i) => {
    if (!bg[i] && light(i)) {
      bg[i] = 1
      queue[tail++] = i
    }
  }
  for (let x = 0; x < W; x++) push(x), push((H - 1) * W + x)
  for (let y = 0; y < H; y++) push(y * W), push(y * W + W - 1)
  while (head < tail) {
    const i = queue[head++]
    const x = i % W
    if (x > 0) push(i - 1)
    if (x < W - 1) push(i + 1)
    if (i >= W) push(i - W)
    if (i < W * (H - 1)) push(i + W)
  }

  // 3. Recortar al dibujo
  let minX = W, minY = H, maxX = -1, maxY = -1
  for (let y = 0; y < H; y++) {
    for (let x = 0; x < W; x++) {
      if (!bg[y * W + x]) {
        if (x < minX) minX = x
        if (x > maxX) maxX = x
        if (y < minY) minY = y
        if (y > maxY) maxY = y
      }
    }
  }
  if (maxX < 0) throw new Error('La imagen está vacía')
  const cw = maxX - minX + 1
  const ch = maxY - minY + 1

  // 4. Tamaño de la cuadrícula manteniendo la proporción
  const cols = cw >= ch ? size : Math.max(1, Math.round((size * cw) / ch))
  const rows = ch > cw ? size : Math.max(1, Math.round((size * ch) / cw))

  // 5. Cada celda toma el color de cuenta que más ocupa (no el promedio: el promedio
  //    de un contorno negro con naranja da marrón). Vacía si es mayormente fondo.
  const labs = BEAD_COLORS.map((b) => toLab(b.rgb))
  const all = BEAD_COLORS.map((_, k) => k)
  const nearest = (lab, allowed) => {
    let best = -1
    let bestD = Infinity
    for (const k of allowed) {
      const d = dist2(lab, labs[k])
      if (d < bestD) {
        bestD = d
        best = k
      }
    }
    return best
  }
  const beadOfPixel = new Map() // caché por color (agrupado de a 4 niveles por canal)
  const pixelBead = (i) => {
    const key = ((data[i * 4] >> 2) << 12) | ((data[i * 4 + 1] >> 2) << 6) | (data[i * 4 + 2] >> 2)
    let k = beadOfPixel.get(key)
    if (k === undefined) {
      k = nearest(toLab([data[i * 4], data[i * 4 + 1], data[i * 4 + 2]]), all)
      beadOfPixel.set(key, k)
    }
    return k
  }

  const cells = new Int16Array(cols * rows).fill(-1)
  const votes = new Uint32Array(BEAD_COLORS.length)
  for (let r = 0; r < rows; r++) {
    const y0 = minY + Math.floor((r * ch) / rows)
    const y1 = minY + Math.max(Math.floor(((r + 1) * ch) / rows), Math.floor((r * ch) / rows) + 1)
    for (let c = 0; c < cols; c++) {
      const x0 = minX + Math.floor((c * cw) / cols)
      const x1 = minX + Math.max(Math.floor(((c + 1) * cw) / cols), Math.floor((c * cw) / cols) + 1)
      let n = 0, nBg = 0
      votes.fill(0)
      for (let y = y0; y < y1; y++) {
        for (let x = x0; x < x1; x++) {
          const i = y * W + x
          if (bg[i]) {
            nBg++
            continue
          }
          n++
          votes[pixelBead(i)]++
        }
      }
      if (n > 0 && n >= nBg) {
        let best = 0
        for (let k = 1; k < votes.length; k++) if (votes[k] > votes[best]) best = k
        cells[r * cols + c] = best
      }
    }
  }

  // 6. Reducir a la cantidad de colores pedida: el menos usado pasa al más parecido que quede
  const allowed = new Set(cells.filter((k) => k >= 0))
  while (allowed.size > maxColors) {
    const counts = countColors(cells)
    const least = [...allowed].sort((a, b) => (counts[a] ?? 0) - (counts[b] ?? 0))[0]
    allowed.delete(least)
    const replacement = nearest(labs[least], allowed)
    cells.forEach((k, i) => k === least && (cells[i] = replacement))
  }

  const counts = countColors(cells)
  const palette = [...allowed]
    .map((k) => ({ index: k, ...BEAD_COLORS[k], count: counts[k] ?? 0 }))
    .sort((a, b) => b.count - a.count)
  return { cols, rows, cells, palette, total: cells.filter((k) => k >= 0).length }
}

// El color de fondo es el que más se repite en el borde de la imagen: blanco,
// transparente o de color (crema, amarillo, azul noche…). Si ningún color domina
// el borde, solo se toma como fondo lo transparente o casi blanco.
function backgroundTest(data, W, H) {
  const buckets = new Map()
  const add = (i) => {
    const a = data[i * 4 + 3]
    const key = a < 128 ? 'transparent' : (data[i * 4] >> 4) * 256 + (data[i * 4 + 1] >> 4) * 16 + (data[i * 4 + 2] >> 4)
    const b = buckets.get(key) ?? { n: 0, r: 0, g: 0, b: 0 }
    b.n++
    b.r += data[i * 4]
    b.g += data[i * 4 + 1]
    b.b += data[i * 4 + 2]
    buckets.set(key, b)
  }
  for (let x = 0; x < W; x++) add(x), add((H - 1) * W + x)
  for (let y = 1; y < H - 1; y++) add(y * W), add(y * W + W - 1)
  const borderSize = 2 * W + 2 * (H - 2)

  let topKey = null
  let top = { n: 0 }
  for (const [key, b] of buckets) if (b.n > top.n) (topKey = key), (top = b)

  const transparent = (i) => data[i * 4 + 3] < 128
  const nearWhite = (i) => transparent(i) || Math.min(data[i * 4], data[i * 4 + 1], data[i * 4 + 2]) > 228
  if (topKey === 'transparent' || top.n < borderSize * 0.35) return nearWhite

  const [br, bgc, bb] = [top.r / top.n, top.g / top.n, top.b / top.n]
  const TOL = 45 ** 2 // tolerancia para degradés suaves y compresión JPG
  return (i) =>
    transparent(i) || (data[i * 4] - br) ** 2 + (data[i * 4 + 1] - bgc) ** 2 + (data[i * 4 + 2] - bb) ** 2 < TOL
}

function countColors(cells) {
  const counts = {}
  for (const k of cells) if (k >= 0) counts[k] = (counts[k] ?? 0) + 1
  return counts
}

function dist2(a, b) {
  return (a[0] - b[0]) ** 2 + (a[1] - b[1]) ** 2 + (a[2] - b[2]) ** 2
}

// sRGB -> CIELAB: la distancia en Lab se parece más a cómo vemos la diferencia de color
function toLab([r, g, b]) {
  const lin = (v) => {
    v /= 255
    return v > 0.04045 ? ((v + 0.055) / 1.055) ** 2.4 : v / 12.92
  }
  const R = lin(r), G = lin(g), B = lin(b)
  const f = (t) => (t > 216 / 24389 ? Math.cbrt(t) : (24389 / 27 * t + 16) / 116)
  const x = f((R * 0.4124 + G * 0.3576 + B * 0.1805) / 0.95047)
  const y = f(R * 0.2126 + G * 0.7152 + B * 0.0722)
  const z = f((R * 0.0193 + G * 0.1192 + B * 0.9505) / 1.08883)
  return [116 * y - 16, 500 * (x - y), 200 * (y - z)]
}

export function rgbCss([r, g, b]) {
  return `rgb(${r}, ${g}, ${b})`
}
