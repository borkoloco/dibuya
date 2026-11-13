import { handleAdmin } from '../server/requests.js'

async function handle(request) {
  try {
    const body = request.method === 'POST' ? await request.json().catch(() => null) : null
    const result = await handleAdmin(request.method, body, request.headers.get('x-admin-password'))
    return Response.json(result.body, { status: result.status, headers: { 'Cache-Control': 'no-store' } })
  } catch (err) {
    console.error(err)
    return Response.json({ error: 'Algo salió mal' }, { status: 500, headers: { 'Cache-Control': 'no-store' } })
  }
}

export const GET = handle
export const POST = handle
