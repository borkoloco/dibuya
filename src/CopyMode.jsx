import { useEffect, useRef, useState } from 'react'
import { useWakeLock } from './hooks.js'
import { useT } from './i18n.jsx'

const GRID_OPTIONS = [0, 3, 4, 6]
const MIN_ZOOM = 1
const MAX_ZOOM = 5

// Pantalla completa para copiar: zoom (pellizco, rueda o botones), arrastrar,
// cuadrícula opcional encima y pantalla siempre encendida.
export default function CopyMode({ item, isFav, onToggleFav, onClose }) {
  const { t } = useT()
  const rootRef = useRef(null)
  const [zoom, setZoom] = useState(1)
  const [pan, setPan] = useState({ x: 0, y: 0 })
  const [grid, setGrid] = useState(0)
  const [showInfo, setShowInfo] = useState(false)
  const pointers = useRef(new Map())
  const gesture = useRef(null)

  const onCloseRef = useRef(onClose)
  onCloseRef.current = onClose

  useWakeLock(true)

  useEffect(() => {
    rootRef.current?.requestFullscreen?.().catch(() => {})
    const onKey = (e) => e.key === 'Escape' && onCloseRef.current()
    window.addEventListener('keydown', onKey)
    return () => {
      window.removeEventListener('keydown', onKey)
      if (document.fullscreenElement) document.exitFullscreen().catch(() => {})
    }
  }, [])

  const clampZoom = (z) => Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, z))
  const setZoomSafe = (z) => {
    const next = clampZoom(z)
    setZoom(next)
    if (next === 1) setPan({ x: 0, y: 0 })
  }

  const onWheel = (e) => setZoomSafe(zoom * (e.deltaY < 0 ? 1.15 : 1 / 1.15))

  const onPointerDown = (e) => {
    e.currentTarget.setPointerCapture(e.pointerId)
    pointers.current.set(e.pointerId, { x: e.clientX, y: e.clientY })
    const pts = [...pointers.current.values()]
    if (pts.length === 2) {
      gesture.current = { type: 'pinch', dist: distance(pts), zoom }
    } else if (pts.length === 1) {
      gesture.current = { type: 'pan', start: pts[0], pan }
    }
  }

  const onPointerMove = (e) => {
    if (!pointers.current.has(e.pointerId)) return
    pointers.current.set(e.pointerId, { x: e.clientX, y: e.clientY })
    const pts = [...pointers.current.values()]
    const g = gesture.current
    if (g?.type === 'pinch' && pts.length === 2) {
      setZoomSafe(g.zoom * (distance(pts) / g.dist))
    } else if (g?.type === 'pan' && zoom > 1) {
      setPan({ x: g.pan.x + (pts[0].x - g.start.x) / zoom, y: g.pan.y + (pts[0].y - g.start.y) / zoom })
    }
  }

  const onPointerUp = (e) => {
    pointers.current.delete(e.pointerId)
    const pts = [...pointers.current.values()]
    gesture.current = pts.length === 1 ? { type: 'pan', start: pts[0], pan } : null
  }

  const nextGrid = () => setGrid(GRID_OPTIONS[(GRID_OPTIONS.indexOf(grid) + 1) % GRID_OPTIONS.length])

  return (
    <div ref={rootRef} className="fixed inset-0 z-50 flex flex-col bg-white select-none">
      <div
        className="relative flex-1 overflow-hidden touch-none flex items-center justify-center"
        onWheel={onWheel}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerUp}
        onDoubleClick={() => setZoomSafe(zoom > 1 ? 1 : 2)}
      >
        <div
          className="relative"
          style={{ transform: `scale(${zoom}) translate(${pan.x}px, ${pan.y}px)`, transformOrigin: 'center' }}
        >
          <img
            src={item.full}
            alt={item.title}
            draggable={false}
            className="block max-h-[calc(100dvh-6rem)] max-w-[100vw] object-contain"
            onError={(e) => {
              if (e.currentTarget.src !== item.thumb) e.currentTarget.src = item.thumb
            }}
          />
          {grid > 0 && (
            <div
              className="pointer-events-none absolute inset-0"
              style={{
                backgroundImage:
                  'linear-gradient(to right, rgba(239,68,68,.55) 1px, transparent 1px), linear-gradient(to bottom, rgba(239,68,68,.55) 1px, transparent 1px)',
                backgroundSize: `${100 / grid}% ${100 / grid}%`,
                boxShadow: 'inset -1px -1px 0 rgba(239,68,68,.55)',
              }}
            />
          )}
        </div>
      </div>

      <div className="flex items-center justify-between gap-1.5 border-t-2 border-orange-100 bg-orange-50 px-2 py-2 pb-[max(.5rem,env(safe-area-inset-bottom))] sm:gap-2 sm:px-3">
        <Btn onClick={onClose} label={t('back')}>⬅️</Btn>
        <div className="flex items-center gap-1.5 sm:gap-2">
          <Btn onClick={() => setZoomSafe(zoom / 1.4)} label={t('zoomOut')}>➖</Btn>
          <Btn onClick={() => setZoomSafe(zoom * 1.4)} label={t('zoomIn')}>➕</Btn>
          <Btn onClick={nextGrid} label={t('grid')} active={grid > 0}>
            <span className="text-base font-bold">{grid ? `${grid}×${grid}` : '#'}</span>
          </Btn>
          <Btn onClick={() => onToggleFav(item)} label={t('favorite')} active={isFav}>{isFav ? '⭐' : '☆'}</Btn>
          <Btn onClick={() => setShowInfo((v) => !v)} label={t('info')}>ℹ️</Btn>
        </div>
      </div>

      {showInfo && (
        <div className="absolute bottom-20 left-3 right-3 rounded-2xl bg-white/95 p-4 text-sm shadow-lg ring-1 ring-orange-200">
          <p className="font-semibold">{item.title || t('untitled')}</p>
          <p>
            {t('author')}: {item.author || t('unknownAuthor')} · {item.license} · {item.source}
          </p>
          <a href={item.link} target="_blank" rel="noreferrer" className="text-orange-600 underline">
            {t('original')}
          </a>
        </div>
      )}
    </div>
  )
}

function Btn({ children, onClick, label, active }) {
  return (
    <button
      onClick={onClick}
      aria-label={label}
      title={label}
      className={`flex h-11 min-w-11 items-center justify-center rounded-2xl px-1.5 text-xl transition active:scale-95 sm:h-12 sm:min-w-12 sm:px-2 sm:text-2xl ${
        active ? 'bg-orange-400 text-white' : 'bg-white ring-2 ring-orange-200'
      }`}
    >
      {children}
    </button>
  )
}

function distance([a, b]) {
  return Math.hypot(a.x - b.x, a.y - b.y)
}
