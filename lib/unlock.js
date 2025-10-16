// Minimal Unlock service using Locksmith API
const LOCK_ADDRESS = process.env.NEXT_PUBLIC_UNLOCK_LOCK || ''
const NETWORK = Number(process.env.NEXT_PUBLIC_UNLOCK_NETWORK || 0)

function isConfigured() {
  return Boolean(LOCK_ADDRESS && NETWORK)
}

async function getMembership(address) {
  if (!isConfigured() || !address) {
    return { hasKey: false, expiresAt: null }
  }
  try {
    const url = `https://locksmith.unlock-protocol.com/v2/locks/${LOCK_ADDRESS}/key/${address}?chain=${NETWORK}`
    const res = await fetch(url)
    if (!res.ok) return { hasKey: false, expiresAt: null }
    const data = await res.json()
    const hasKey = Boolean(data && data.valid)
    const expiresAt = typeof data?.expiration === 'number' ? data.expiration : null
    return { hasKey, expiresAt }
  } catch (err) {
    return { hasKey: false, expiresAt: null }
  }
}

export default { isConfigured, getMembership }

