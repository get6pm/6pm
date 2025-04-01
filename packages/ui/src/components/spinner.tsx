'use client'
import { cn } from '@6pm/ui/lib/utils'
import { type FC, useEffect, useState } from 'react'

export type SpinnerProps = {
  className?: string
  delay?: number
}

export const Spinner: FC<SpinnerProps> = ({ className, delay = 500 }) => {
  const [show, setShow] = useState(false)

  useEffect(() => {
    const timer = setTimeout(() => setShow(true), delay)
    return () => clearTimeout(timer)
  }, [delay])

  return (
    <div
      className={cn(
        'inline-block size-6 animate-spin rounded-full border-3 border-primary border-t-muted-foreground/20 opacity-0 transition-opacity',
        show && 'opacity-100',
        className,
      )}
      role="status"
      aria-label="loading spinner"
      aria-live="polite"
    />
  )
}
