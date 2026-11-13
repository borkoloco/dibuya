import { useEffect, useRef, useState } from 'react'
import { useWakeLock } from './hooks.js'
import { useT } from './i18n.jsx'
import HamaMode from './HamaMode.jsx'

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
  const [showHama, setShowHama] = useState(false)
  const showHamaRef = useRef(false)
  showHamaRef.current = showHama
  const pointers = useRef(new Map())
  const gesture = useRef(null)

  const onCloseRef = useRef(onClose)
  onCloseRef.current = onClose

  useWakeLock(true)

  useEffect(() => {
    rootRef.current?.requestFullscreen?.().catch(() => {})
    // Escape cierra primero el modo Hama, si está abierto
    const onKey = (e) => {
      if (e.key !== 'Escape') return
      if (showHamaRef.current) setShowHama(false)
      else onCloseRef.current()
    }
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
          {/* En el celular se hace zoom pellizcando: los botones quedan para tablet y compu */}
          <Btn onClick={() => setZoomSafe(zoom / 1.4)} label={t('zoomOut')} className="hidden sm:flex">➖</Btn>
          <Btn onClick={() => setZoomSafe(zoom * 1.4)} label={t('zoomIn')} className="hidden sm:flex">➕</Btn>
          <Btn onClick={nextGrid} label={t('grid')} active={grid > 0}>
            <span className="text-base font-bold">{grid ? `${grid}×${grid}` : '#'}</span>
          </Btn>
          <Btn onClick={() => setShowHama(true)} label={t('hama')}>🟦</Btn>
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
          {item.link && <HoldToOpen href={item.link} label={t('original')} hint={t('holdToOpen')} />}
        </div>
      )}

      {showHama && <HamaMode item={item} onClose={() => setShowHama(false)} />}
    </div>
  )
}

// Enlace externo "para adultos": hay que mantenerlo apretado 1,5 s, así un chico
// no sale de la app con un toque sin querer. Se abre al soltar (cuenta como gesto
// del usuario, así el navegador no lo bloquea como ventana emergente).
const HOLD_MS = 1500

function HoldToOpen({ href, label, hint }) {
  const [holding, setHolding] = useState(false)
  const [ready, setReady] = useState(false)
  const timer = useRef(null)

  const start = () => {
    setHolding(true)
    timer.current = setTimeout(() => setReady(true), HOLD_MS)
  }
  const end = (open) => {
    clearTimeout(timer.current)
    if (open && ready) window.open(href, '_blank', 'noopener,noreferrer')
    setHolding(false)
    setReady(false)
  }

  return (
    <button
      onPointerDown={start}
      onPointerUp={() => end(true)}
      onPointerLeave={() => end(false)}
      onPointerCancel={() => end(false)}
      onContextMenu={(e) => e.preventDefault()}
      className="relative mt-2 w-full touch-none overflow-hidden rounded-xl bg-orange-50 px-3 py-2 text-left ring-1 ring-orange-200 select-none"
    >
      <span
        className="absolute inset-y-0 left-0 bg-orange-200"
        style={{ width: holding ? '100%' : '0%', transition: holding ? `width ${HOLD_MS}ms linear` : 'none' }}
      />
      <span className="relative block font-semibold text-orange-700">{ready ? `↗ ${label}` : label}</span>
      <span className="relative block text-xs text-stone-500">{hint}</span>
    </button>
  )
}

function Btn({ children, onClick, label, active, className = 'flex' }) {
  return (
    <button
      onClick={onClick}
      aria-label={label}
      title={label}
      className={`${className} h-11 min-w-11 items-center justify-center rounded-2xl px-1.5 text-xl transition active:scale-95 sm:h-12 sm:min-w-12 sm:px-2 sm:text-2xl ${
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
