'use client'

import useUnlock from '@/hooks/useUnlock'

type GateProps = {
  address?: string
}

export default function Gate({ address }: GateProps) {
  const { isUnlocked, loading } = useUnlock(address)

  if (loading) {
    return <div>Checking membership…</div>
  }

  if (!isUnlocked) {
    return <div>No membership key. Access denied.</div>
  }

  return <div>Access granted. You have a valid key.</div>
}


