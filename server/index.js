// Servidor local (desarrollo, o producción en cualquier host Node).
// En Vercel la API corre como función serverless en api/search.js.
// Sin dependencias: http nativo de Node.
import http from 'node:http'
import { readFile } from 'node:fs/promises'
import { extname, join } from 'node:path'
import { search, parseParams, cacheControl } from './search.js'

const PORT = Number(process.env.PORT) || 8787
const DIST = new URL('../dist/', import.meta.url).pathname

const MIME = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.svg': 'image/svg+xml', '.png': 'image/png' }

const server = http.createServer(async (req, res) => {
  const url = new URL(req.url, `http://${req.headers.host}`)
  try {
    if (url.pathname === '/api/search') {
      const body = await search(parseParams(url.searchParams))
      res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': cacheControl(body) })
      return res.end(JSON.stringify(body))
    }
    // Sirve el build del frontend (npm run build && npm start)
    const file = url.pathname === '/' ? 'index.html' : url.pathname.slice(1)
    const data = await readFile(join(DIST, file)).catch(() => readFile(join(DIST, 'index.html')))
    res.writeHead(200, { 'Content-Type': MIME[extname(file)] ?? 'text/html' })
    res.end(data)
  } catch (err) {
    console.error(err)
    res.writeHead(500, { 'Content-Type': 'application/json' })
    res.end(JSON.stringify({ error: 'Algo salió mal' }))
  }
})

server.listen(PORT, () => {
  console.log(`API en http://localhost:${PORT}  (Pixabay: ${process.env.PIXABAY_KEY ? 'sí' : 'no, falta PIXABAY_KEY'})`)
})
