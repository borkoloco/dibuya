import { useEffect, useMemo, useState } from 'react'
import { useT } from './i18n.jsx'
import { loadReadableImage, pixelate, rgbCss } from './pixelate.js'

const SIZES = [15, 29, 58] // 29×29 es la placa cuadrada estándar
const COLOR_COUNTS = [4, 8, 16]
const ZOOMS = [1, 1.5, 2, 3]

// Modo Hama / píxeles (idea de Rosario): el dibujo elegido convertido en una
// cuadrícula para armar con cuentas de planchar o dibujar en papel cuadriculado.
export default function HamaMode({ item, onClose }) {
  const { t, lang } = useT()
  const [img, setImg] = useState(null)
  const [failed, setFailed] = useState(false)
  const [size, setSize] = useState(29)
  const [maxColors, setMaxColors] = useState(8)
  const [view, setView] = useState('beads') // 'beads' | 'pixels'
  const [zoom, setZoom] = useState(1)
  const [focus, setFocus] = useState(null) // color resaltado (índice de BEAD_COLORS)
  const [done, setDone] = useState(() => new Set()) // celdas marcadas como puestas

  useEffect(() => {
    let alive = true
    loadReadableImage([item.full, item.thumb])
      .then((el) => alive && setImg(el))
      .catch(() => alive && setFailed(true))
    return () => {
      alive = false
    }
  }, [item])

  const grid = useMemo(() => {
    if (!img) return null
    try {
      return pixelate(img, { size, maxColors })
    } catch {
      return 'error'
    }
  }, [img, size, maxColors])

  // Al cambiar la cuadrícula, se reinicia lo marcado
  useEffect(() => {
    setDone(new Set())
    setFocus(null)
  }, [grid])

  const name = (c) => (lang === 'en' ? c.en : c.es)

  const toggleCell = (e) => {
    if (!grid || grid === 'error') return
    const rect = e.currentTarget.getBoundingClientRect()
    const c = Math.floor(((e.clientX - rect.left) / rect.width) * grid.cols)
    const r = Math.floor(((e.clientY - rect.top) / rect.height) * grid.rows)
    const i = r * grid.cols + c
    if (grid.cells[i] < 0) return
    setDone((prev) => {
      const next = new Set(prev)
      next.has(i) ? next.delete(i) : next.add(i)
      return next
    })
  }

  const boards = size === 58 ? 4 : 1
  const error = failed || grid === 'error'

  return (
    <div className="fixed inset-0 z-[60] flex flex-col bg-orange-50">
      <header className="flex items-center gap-2 border-b-2 border-orange-100 px-3 pt-[max(.5rem,env(safe-area-inset-top))] pb-2">
        <button onClick={onClose} aria-label={t('back')} className="h-11 w-11 rounded-2xl bg-white text-xl ring-2 ring-orange-200">
          ⬅️
        </button>
        <h2 className="text-xl font-black text-orange-500">🟦 {t('hama')}</h2>
        {grid && grid !== 'error' && (
          <button
            onClick={() => downloadGrid(grid, view, name)}
            className="ml-auto rounded-full bg-sky-500 px-4 py-2 text-base font-bold text-white shadow"
          >
            ⬇️ {t('download')}
          </button>
        )}
      </header>

      <div className="flex-1 overflow-y-auto px-3 pb-[max(1rem,env(safe-area-inset-bottom))]">
        <div className="mx-auto max-w-3xl">
          <div className="mt-3 flex flex-wrap gap-x-4 gap-y-2">
            <Chips label={t('size')} options={SIZES} value={size} onChange={setSize} format={(s) => `${s}×${s}`} />
            <Chips label={t('colors')} options={COLOR_COUNTS} value={maxColors} onChange={setMaxColors} />
            <Chips
              label={t('view')}
              options={['beads', 'pixels']}
              value={view}
              onChange={setView}
              format={(v) => (v === 'beads' ? `⚪ ${t('beads')}` : `⬛ ${t('pixels')}`)}
            />
          </div>

          {error && <p className="mt-6 rounded-2xl bg-white p-4 text-lg ring-2 ring-orange-200">{t('hamaError')}</p>}
          {!error && !grid && <p className="mt-6 text-center text-xl">{t('hamaLoading')}</p>}

          {grid && grid !== 'error' && (
            <>
              <p className="mt-3 text-sm text-stone-600">{t('hamaTip')}</p>

              <div className="relative mt-2 overflow-auto rounded-2xl bg-white p-2 shadow-sm ring-2 ring-orange-100">
                <svg
                  viewBox={`0 0 ${grid.cols} ${grid.rows}`}
                  style={{ width: `${zoom * 100}%`, maxWidth: zoom === 1 ? `${grid.cols * 28}px` : 'none' }}
                  className="mx-auto block touch-manipulation select-none"
                  onClick={toggleCell}
                >
                  <Board grid={grid} view={view} focus={focus} done={done} />
                </svg>
              </div>

              <div className="mt-2 flex items-center justify-between gap-2">
                <div className="flex gap-1.5">
                  {ZOOMS.map((z) => (
                    <button
                      key={z}
                      onClick={() => setZoom(z)}
                      className={`rounded-full px-3 py-1 text-sm font-semibold ${zoom === z ? 'bg-orange-500 text-white' : 'bg-white ring-1 ring-orange-200'}`}
                    >
                      {z}×
                    </button>
                  ))}
                </div>
                <p className="text-sm font-semibold text-stone-600">
                  {done.size}/{grid.total} ✅
                </p>
              </div>

              <section className="mt-4 rounded-2xl bg-white p-3 ring-2 ring-orange-100">
                <p className="text-base font-bold">
                  {t('hamaTotal', { n: grid.total })}
                  {view === 'beads' && <span className="font-normal text-stone-600"> · {t('boards', { n: boards })}</span>}
                </p>
                <div className="mt-2 grid grid-cols-2 gap-2 sm:grid-cols-3">
                  {grid.palette.map((c) => (
                    <button
                      key={c.id}
                      onClick={() => setFocus((f) => (f === c.index ? null : c.index))}
                      className={`flex items-center gap-2 rounded-xl px-2 py-1.5 text-left ${
                        focus === c.index ? 'bg-orange-100 ring-2 ring-orange-400' : 'bg-stone-50'
                      }`}
                    >
                      <span className="h-7 w-7 shrink-0 rounded-full ring-1 ring-black/10" style={{ background: rgbCss(c.rgb) }} />
                      <span className="min-w-0 flex-1 truncate text-sm font-semibold">{name(c)}</span>
                      <span className="text-sm font-bold text-stone-600">{c.count}</span>
                    </button>
                  ))}
                </div>
              </section>
            </>
          )}
        </div>
      </div>
    </div>
  )
}

function Board({ grid, view, focus, done }) {
  const { cols, rows, cells } = grid
  const shapes = []
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const i = r * cols + c
      const k = cells[i]
      if (k < 0) {
        if (view === 'beads') shapes.push(<circle key={i} cx={c + 0.5} cy={r + 0.5} r={0.09} fill="#d6d3d1" />)
        continue
      }
      const fill = rgbCss(grid.palette.find((p) => p.index === k).rgb)
      const dim = done.has(i) || (focus !== null && focus !== k)
      const opacity = dim ? 0.18 : 1
      shapes.push(
        view === 'beads' ? (
          <g key={i} opacity={opacity}>
            <circle cx={c + 0.5} cy={r + 0.5} r={0.44} fill={fill} stroke="rgba(0,0,0,.25)" strokeWidth={0.04} />
            <circle cx={c + 0.5} cy={r + 0.5} r={0.14} fill="rgba(255,255,255,.75)" />
          </g>
        ) : (
          <rect key={i} x={c} y={r} width={1} height={1} fill={fill} opacity={opacity} />
        ),
      )
    }
  }

  // Líneas: finas en cada celda (vista píxeles) y marcadas cada 5 para contar
  const lines = []
  for (let c = 0; c <= cols; c++) {
    const major = c % 5 === 0
    if (view === 'pixels' || major)
      lines.push(<line key={`c${c}`} x1={c} y1={0} x2={c} y2={rows} stroke={major ? '#a8a29e' : '#e7e5e4'} strokeWidth={major ? 0.07 : 0.03} />)
  }
  for (let r = 0; r <= rows; r++) {
    const major = r % 5 === 0
    if (view === 'pixels' || major)
      lines.push(<line key={`r${r}`} x1={0} y1={r} x2={cols} y2={r} stroke={major ? '#a8a29e' : '#e7e5e4'} strokeWidth={major ? 0.07 : 0.03} />)
  }

  return (
    <>
      <rect width={cols} height={rows} fill="#fff" />
      {view === 'beads' ? (
        <>
          {lines}
          {shapes}
        </>
      ) : (
        <>
          {shapes}
          {lines}
        </>
      )}
    </>
  )
}

function Chips({ label, options, value, onChange, format = String }) {
  return (
    <div className="flex items-center gap-1.5">
      <span className="text-sm font-semibold text-stone-600">{label}</span>
      {options.map((o) => (
        <button
          key={o}
          onClick={() => onChange(o)}
          className={`rounded-full px-3 py-1.5 text-sm font-semibold ${value === o ? 'bg-orange-500 text-white' : 'bg-white ring-1 ring-orange-200'}`}
        >
          {format(o)}
        </button>
      ))}
    </div>
  )
}

// Descarga la cuadrícula como PNG, con la lista de colores abajo (para imprimir)
function downloadGrid(grid, view, name) {
  const cell = 24
  const pad = 24
  const legendRow = 34
  const legendCols = 3
  const legendRows = Math.ceil(grid.palette.length / legendCols)
  const width = Math.max(grid.cols * cell + pad * 2, 3 * 220 + pad * 2)
  const height = grid.rows * cell + pad * 3 + legendRows * legendRow + 30

  const canvas = document.createElement('canvas')
  canvas.width = width
  canvas.height = height
  const ctx = canvas.getContext('2d')
  ctx.fillStyle = '#fff'
  ctx.fillRect(0, 0, width, height)

  const ox = Math.round((width - grid.cols * cell) / 2)
  const oy = pad
  for (let r = 0; r < grid.rows; r++) {
    for (let c = 0; c < grid.cols; c++) {
      const k = grid.cells[r * grid.cols + c]
      const x = ox + c * cell
      const y = oy + r * cell
      if (k < 0) continue
      ctx.fillStyle = rgbCss(grid.palette.find((p) => p.index === k).rgb)
      if (view === 'beads') {
        ctx.beginPath()
        ctx.arc(x + cell / 2, y + cell / 2, cell * 0.44, 0, Math.PI * 2)
        ctx.fill()
        ctx.fillStyle = 'rgba(255,255,255,.75)'
        ctx.beginPath()
        ctx.arc(x + cell / 2, y + cell / 2, cell * 0.14, 0, Math.PI * 2)
        ctx.fill()
      } else {
        ctx.fillRect(x, y, cell, cell)
      }
    }
  }
  for (let c = 0; c <= grid.cols; c++) {
    if (view === 'beads' && c % 5) continue
    ctx.strokeStyle = c % 5 ? '#e7e5e4' : '#a8a29e'
    ctx.lineWidth = c % 5 ? 1 : 2
    ctx.beginPath()
    ctx.moveTo(ox + c * cell, oy)
    ctx.lineTo(ox + c * cell, oy + grid.rows * cell)
    ctx.stroke()
  }
  for (let r = 0; r <= grid.rows; r++) {
    if (view === 'beads' && r % 5) continue
    ctx.strokeStyle = r % 5 ? '#e7e5e4' : '#a8a29e'
    ctx.lineWidth = r % 5 ? 1 : 2
    ctx.beginPath()
    ctx.moveTo(ox, oy + r * cell)
    ctx.lineTo(ox + grid.cols * cell, oy + r * cell)
    ctx.stroke()
  }

  const ly = oy + grid.rows * cell + pad
  ctx.font = 'bold 18px system-ui, sans-serif'
  ctx.fillStyle = '#1c1917'
  ctx.fillText(`Dibuya · ${grid.cols}×${grid.rows} · ${grid.total}`, pad, ly + 4)
  ctx.font = '16px system-ui, sans-serif'
  grid.palette.forEach((p, n) => {
    const x = pad + (n % legendCols) * 220
    const y = ly + 30 + Math.floor(n / legendCols) * legendRow
    ctx.fillStyle = rgbCss(p.rgb)
    ctx.beginPath()
    ctx.arc(x + 11, y + 6, 11, 0, Math.PI * 2)
    ctx.fill()
    ctx.strokeStyle = 'rgba(0,0,0,.2)'
    ctx.lineWidth = 1
    ctx.stroke()
    ctx.fillStyle = '#1c1917'
    ctx.fillText(`${name(p)}: ${p.count}`, x + 30, y + 12)
  })

  canvas.toBlob((blob) => {
    const a = document.createElement('a')
    a.href = URL.createObjectURL(blob)
    a.download = `dibuya-${grid.cols}x${grid.rows}.png`
    a.click()
    setTimeout(() => URL.revokeObjectURL(a.href), 1000)
  })
}
