import { handleRequest } from '../server/requests.js'

export async function POST(request) {
  try {
    const { status, body } = await handleRequest(await request.json().catch(() => null))
    return Response.json(body, { status, headers: { 'Cache-Control': 'no-store' } })
  } catch (err) {
    console.error(err)
    return Response.json({ error: 'Algo salió mal' }, { status: 500, headers: { 'Cache-Control': 'no-store' } })
  }
}
