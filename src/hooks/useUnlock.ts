'use client'

import { useCallback, useEffect, useState } from 'react'
import unlock from '@/lib/unlock'

export default function useUnlock(address?: string) {
  const [isUnlocked, setIsUnlocked] = useState(false)
  const [loading, setLoading] = useState(false)
  const [expiresAt, setExpiresAt] = useState<number | null>(null)

  const refetch = useCallback(async () => {
    if (!address || !unlock.isConfigured()) {
      setIsUnlocked(false)
      setExpiresAt(null)
      return
    }
    setLoading(true)
    try {
      const { hasKey, expiresAt } = await unlock.getMembership(address)
      setIsUnlocked(Boolean(hasKey))
      setExpiresAt(expiresAt)
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


