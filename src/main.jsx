import { StrictMode, Suspense, lazy } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import { I18nProvider } from './i18n.jsx'

// /?admin: página de pedidos para Santiago (se carga aparte, no pesa en la app de los chicos)
const Admin = lazy(() => import('./Admin.jsx'))
const isAdmin = new URLSearchParams(location.search).has('admin')

createRoot(document.getElementById('root')).render(
  <StrictMode>
    {isAdmin ? (
      <Suspense fallback={null}>
        <Admin />
      </Suspense>
    ) : (
      <I18nProvider>
        <App />
      </I18nProvider>
    )}
  </StrictMode>,
)
