'use client'

import { useCallback, useEffect, useState } from 'react'
import unlockService from '../lib/unlock'

export default function useUnlock(address) {
  const [isUnlocked, setIsUnlocked] = useState(false)
  const [loading, setLoading] = useState(false)
  const [expiresAt, setExpiresAt] = useState(null)

  const refetch = useCallback(async () => {
    if (!address || !unlockService.isConfigured()) {
      setIsUnlocked(false)
      setExpiresAt(null)
      return
    }
    setLoading(true)
    try {
      const { hasKey, expiresAt: exp } = await unlockService.getMembership(address)
      setIsUnlocked(Boolean(hasKey))
      setExpiresAt(exp)
    } finally {
      setLoading(false)
    }
  }, [address])

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      if (cancelled) return
      await refetch()
    })()
    return () => { cancelled = true }
  }, [refetch])

  return { isUnlocked, loading, expiresAt, refetch }
}


