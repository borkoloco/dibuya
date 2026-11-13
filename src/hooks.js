import { useCallback, useEffect, useRef, useState } from 'react'

// --- Voz a texto ---
// Usa el reconocimiento del navegador. No grabamos ni guardamos audio:
// solo nos quedamos con el texto y lo descartamos al buscar.
const SpeechRecognition = typeof window !== 'undefined' && (window.SpeechRecognition || window.webkitSpeechRecognition)

export function useSpeech(onResult, lang = 'es-AR') {
  const [listening, setListening] = useState(false)
  const recRef = useRef(null)

  const start = useCallback(() => {
    if (!SpeechRecognition || listening) return
    const rec = new SpeechRecognition()
    rec.lang = lang
    rec.interimResults = false
    rec.maxAlternatives = 1
    rec.onresult = (e) => onResult(e.results[0][0].transcript)
    rec.onend = () => setListening(false)
    rec.onerror = () => setListening(false)
    recRef.current = rec
    rec.start()
    setListening(true)
  }, [listening, onResult, lang])

  const stop = useCallback(() => recRef.current?.stop(), [])

  return { supported: Boolean(SpeechRecognition), listening, start, stop }
}

// --- Favoritos (en el dispositivo) ---
const FAV_KEY = 'dibuya:favoritos'

function readFavs() {
  try {
    return JSON.parse(localStorage.getItem(FAV_KEY)) ?? []
  } catch {
    return []
  }
}

export function useFavorites() {
  const [favs, setFavs] = useState(readFavs)

  useEffect(() => {
    try {
      localStorage.setItem(FAV_KEY, JSON.stringify(favs))
    } catch {
      /* sin almacenamiento: los favoritos duran la sesión */
    }
  }, [favs])

  const isFav = useCallback((item) => favs.some((f) => f.id === item.id), [favs])
  const toggle = useCallback(
    (item) => setFavs((prev) => (prev.some((f) => f.id === item.id) ? prev.filter((f) => f.id !== item.id) : [item, ...prev])),
    [],
  )
  return { favs, isFav, toggle }
}

// --- Pantalla siempre encendida mientras se copia ---
export function useWakeLock(active) {
  useEffect(() => {
    if (!active || !('wakeLock' in navigator)) return
    let lock = null
    let cancelled = false
    const request = async () => {
      try {
        lock = await navigator.wakeLock.request('screen')
        if (cancelled) lock.release()
      } catch {
        /* el navegador lo rechazó (batería baja, etc.) */
      }
    }
    const onVisible = () => document.visibilityState === 'visible' && request()
    request()
    document.addEventListener('visibilitychange', onVisible)
    return () => {
      cancelled = true
      document.removeEventListener('visibilitychange', onVisible)
      lock?.release()
    }
  }, [active])
}
