export async function POST(request) {
  try {
    const body = await request.json()
    const address = body?.address
    const LOCK_ADDRESS = process.env.NEXT_PUBLIC_UNLOCK_LOCK || ''
    const NETWORK = Number(process.env.NEXT_PUBLIC_UNLOCK_NETWORK || 0)

    if (!address || !LOCK_ADDRESS || !NETWORK) {
      return new Response(JSON.stringify({ ok: false, error: 'Missing parameters' }), { status: 400 })
    }

    const url = `https://locksmith.unlock-protocol.com/v2/locks/${LOCK_ADDRESS}/key/${address}?chain=${NETWORK}`
    const res = await fetch(url)
    if (!res.ok) {
      return new Response(JSON.stringify({ ok: false, error: 'Locksmith error' }), { status: 502 })
    }
    const data = await res.json()
    const hasKey = Boolean(data && data.valid)
    const expiresAt = typeof data?.expiration === 'number' ? data.expiration : null
    return new Response(JSON.stringify({ ok: true, hasKey, expiresAt }), { status: 200 })
  } catch (err) {
    return new Response(JSON.stringify({ ok: false, error: 'Server error' }), { status: 500 })
  }
}


