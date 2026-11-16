// Estadísticas anónimas: solo contadores (ver server/stats.js). No se manda ningún
// identificador del dispositivo ni del chico. Si falla, no pasa nada.
export function track(type, data = {}) {
  try {
    const body = JSON.stringify({ type, ...data })
    if (!navigator.sendBeacon?.('/api/event', body)) {
      fetch('/api/event', { method: 'POST', body, keepalive: true }).catch(() => {})
    }
  } catch {
    /* las estadísticas nunca rompen la app */
  }
}

// "Entré hoy": una vez por día y por dispositivo. La fecha queda en el navegador.
const VISIT_KEY = 'dibuya:ultimaVisita'

export function trackVisit() {
  try {
    const today = new Date().toLocaleDateString('en-CA') // AAAA-MM-DD local
    const last = localStorage.getItem(VISIT_KEY)
    if (last === today) return
    localStorage.setItem(VISIT_KEY, today)
    track('visit', { new: !last })
  } catch {
    /* sin almacenamiento: no se cuenta, para no inflar los números */
  }
}
