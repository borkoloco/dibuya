import { useRef, useState } from 'react'

// Enlace externo "para adultos": hay que mantenerlo apretado 1,5 s, así un chico
// no sale de la app con un toque sin querer. Se abre al soltar (cuenta como gesto
// del usuario, así el navegador no lo bloquea como ventana emergente).
const HOLD_MS = 1500

export default function HoldToOpen({ href, label, hint, className = 'text-left' }) {
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
      className={`relative mt-2 w-full touch-none overflow-hidden rounded-xl bg-orange-50 px-3 py-2 ring-1 ring-orange-200 select-none ${className}`}
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
