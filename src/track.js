// Estadísticas anónimas: solo contadores (ver server/stats.js). No se manda ningún
// identificador del dispositivo ni del chico. Si falla, no pasa nada.

// Los dispositivos de Santiago no se cuentan: al entrar a /?admin quedan marcados
const EXCLUDE_KEY = 'dibuya:noContar'

export function isExcluded() {
  try {
    return localStorage.getItem(EXCLUDE_KEY) === '1'
  } catch {
    return false
  }
}

export function setExcluded(on) {
  try {
    if (on) localStorage.setItem(EXCLUDE_KEY, '1')
    else localStorage.removeItem(EXCLUDE_KEY)
  } catch {
    /* sin almacenamiento */
  }
}

export function track(type, data = {}) {
  if (isExcluded()) return
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
