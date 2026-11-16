import { handleEvent } from '../server/stats.js'

export async function POST(request) {
  try {
    // sendBeacon manda el cuerpo como texto: se lee como texto y se interpreta como JSON
    const text = await request.text()
    let body = null
    try {
      body = JSON.parse(text.slice(0, 2000))
    } catch {
      /* cuerpo inválido */
    }
    const { status, body: out } = await handleEvent(body)
    return Response.json(out, { status, headers: { 'Cache-Control': 'no-store' } })
  } catch (err) {
    console.error(err)
    return Response.json({ error: 'Algo salió mal' }, { status: 500, headers: { 'Cache-Control': 'no-store' } })
  }
}
