'use client'

import { useCallback, useEffect, useRef, useState } from 'react'

const LOCK_ADDRESS = process.env.NEXT_PUBLIC_UNLOCK_LOCK || ''
const NETWORK = Number(process.env.NEXT_PUBLIC_UNLOCK_NETWORK || 0)

export default function UnlockCheckoutButton({ onPurchased }) {
  const [loading, setLoading] = useState(false)
  const listenerRef = useRef(null)

  const isConfigured = Boolean(LOCK_ADDRESS && NETWORK)

  const ensureScript = useCallback(async () => {
    if (typeof window === 'undefined') return
    if (window.unlockProtocol && typeof window.unlockProtocol.loadCheckoutModal === 'function') {
      return
    }
    await new Promise((resolve, reject) => {
      const existing = document.querySelector('script[data-unlock]')
      if (existing) {
        existing.addEventListener('load', resolve, { once: true })
        if (existing.readyState === 'complete') resolve()
        return
      }
      const s = document.createElement('script')
      s.src = 'https://paywall.unlock-protocol.com/static/unlock.latest.min.js'
      s.async = true
      s.setAttribute('data-unlock', 'true')
      s.onload = resolve
      s.onerror = reject
      document.body.appendChild(s)
    })
  }, [])

  const openCheckout = useCallback(async () => {
    if (!isConfigured) return
    setLoading(true)
    try {
      await ensureScript()
      const config = {
        network: NETWORK,
        locks: {
          [LOCK_ADDRESS]: { name: 'Membership' }
        },
        title: 'Unlock Membership',
        pessimistic: true
      }
      if (window.unlockProtocol && typeof window.unlockProtocol.loadCheckoutModal === 'function') {
        window.unlockProtocol.loadCheckoutModal(config)
      }
    } finally {
      setLoading(false)
    }
  }, [ensureScript, isConfigured])

  useEffect(() => {
    if (typeof window === 'undefined') return
    const handler = (event) => {
      // Unlock posts messages on purchase/unlock status
      if (!event || !event.data) return
      const data = event.data
      if (data.type === 'unlockProtocol' && (data.status === 'unlocked' || data.name === 'account.updated')) {
        if (typeof onPurchased === 'function') {
          onPurchased()
        }
      }
    }
    listenerRef.current = handler
    window.addEventListener('message', handler)
    return () => {
      if (listenerRef.current) {
        window.removeEventListener('message', listenerRef.current)
      }
    }
  }, [onPurchased])

  return (
    <button
      type="button"
      onClick={openCheckout}
      disabled={!isConfigured || loading}
      className="btn-primary"
      title={!isConfigured ? 'Unlock is not configured' : 'Purchase membership'}
    >
      {loading ? 'Loading Checkout…' : 'Purchase Membership'}
    </button>
  )
}


