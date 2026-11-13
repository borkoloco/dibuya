// Función serverless de Vercel: GET /api/search
// La clave de Pixabay se configura en Vercel → Settings → Environment Variables.
import { search, parseParams, cacheControl } from '../server/search.js'

export async function GET(request) {
  try {
    const body = await search(parseParams(new URL(request.url).searchParams))
    return Response.json(body, { headers: { 'Cache-Control': cacheControl(body) } })
  } catch (err) {
    console.error(err)
    return Response.json({ error: 'Algo salió mal' }, { status: 500, headers: { 'Cache-Control': 'no-store' } })
  }
}
