'use client'

import { useRouter } from 'next/navigation'
import { type FC, useEffect } from 'react'

export type RedirectProps = {
  to: string
}

export const Redirect: FC<RedirectProps> = ({ to }) => {
  const router = useRouter()
  useEffect(() => {
    router.push(to)
  }, [router, to])
  return null
}
