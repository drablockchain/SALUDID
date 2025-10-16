const LOCK_ADDRESS: string = process.env.NEXT_PUBLIC_UNLOCK_LOCK || ''
const NETWORK: number = Number(process.env.NEXT_PUBLIC_UNLOCK_NETWORK || 0)

export function isConfigured(): boolean {
  return Boolean(LOCK_ADDRESS && NETWORK)
}

export async function getMembership(address: string): Promise<{ hasKey: boolean; expiresAt: number | null }> {
  if (!address || !isConfigured()) return { hasKey: false, expiresAt: null }
  try {
    const url = `https://locksmith.unlock-protocol.com/v2/locks/${LOCK_ADDRESS}/key/${address}?chain=${NETWORK}`
    const res = await fetch(url)
    if (!res.ok) return { hasKey: false, expiresAt: null }
    const data = await res.json() as { valid?: boolean; expiration?: number }
    return { hasKey: !!data?.valid, expiresAt: typeof data?.expiration === 'number' ? data.expiration : null }
  } catch {
    return { hasKey: false, expiresAt: null }
  }
}

export default { isConfigured, getMembership }


