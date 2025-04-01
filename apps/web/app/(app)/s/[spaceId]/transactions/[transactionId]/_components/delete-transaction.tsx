'use client'
import { useCurrentSpace } from '@/hooks/spaces'
import { Button } from '@6pm/ui/components/button'
import { cn } from '@6pm/ui/lib/utils'
import { Trash2Icon } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { type FC, useRef, useState } from 'react'

export type DeleteTransactionProps = {}

export const DeleteTransaction: FC<DeleteTransactionProps> = () => {
  const [confirm, setConfirm] = useState(false)
  const [hover, setHover] = useState(false)
  const router = useRouter()
  const space = useCurrentSpace()
  const timeoutRef = useRef<NodeJS.Timeout>(null)

  const handleClick = () => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current)
    }

    if (!confirm) {
      setConfirm(true)
      return
    }

    router.replace(`/s/${space.id}/transactions`)
  }
  const handleMouseLeave = () => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current)
    }

    timeoutRef.current = setTimeout(() => {
      setHover(false)
      if (confirm) {
        setConfirm(false)
      }
    }, 500)
  }

  const handleMouseEnter = () => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current)
    }
    setHover(true)
  }

  return (
    <>
      <Button
        variant="outline"
        className={cn(
          'group !px-[9px] absolute top-4 right-4 gap-0 overflow-hidden transition-all duration-500',
          confirm
            ? '!text-white !border-destructive !bg-destructive'
            : '!text-destructive hover:border-destructive hover:bg-destructive/10',
        )}
        style={{ width: confirm ? 138 : hover ? 88 : 36 }}
        onClick={handleClick}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
      >
        <Trash2Icon />
        {confirm ? (
          <span className="ml-2">Are you sure?</span>
        ) : (
          <span className="!text-destructive ml-0 max-w-0 overflow-hidden opacity-0 transition-all delay-300 duration-500 ease-in-out group-hover:ml-2 group-hover:max-w-[60px] group-hover:opacity-100">
            <span className="!text-destructive transition-none">Delete</span>
          </span>
        )}
      </Button>
    </>
  )
}
