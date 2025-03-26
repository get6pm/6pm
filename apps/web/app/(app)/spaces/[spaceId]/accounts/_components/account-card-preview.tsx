'use client'
import { getColorValue } from '@/lib/get-color-value'
import type { FC } from 'react'

const BASE_SCALE = 2
const BASE_WIDTH = BASE_SCALE * 85.6
const BASE_HEIGHT = BASE_SCALE * 53.98
const BASE_RADIUS = BASE_SCALE * 3.18 * 2

export type AccountCardPreviewProps = {
  accountName?: string
  institutionName?: string
  lastDigits?: string
  color?: string
  scale?: number
  className?: string
}

export const AccountCardPreview: FC<AccountCardPreviewProps> = ({
  accountName,
  institutionName,
  lastDigits,
  color,
  scale = 1,
  className,
}) => {
  return (
    <div
      className={`relative overflow-hidden rounded-lg bg-gray-100 transition-colors ${className}`}
      style={{
        width: `${BASE_WIDTH * scale}px`,
        height: `${BASE_HEIGHT * scale}px`,
        borderRadius: `${BASE_RADIUS * scale}px`,
        fontSize: `${14 * scale}px`,
        padding: `${8 * scale}px ${12 * scale}px`,
        backgroundColor: getColorValue(color),
        color: 'white',
      }}
    >
      <div className="flex h-full flex-col justify-between font-bold">
        <div>{institutionName}</div>
        <div className="flex w-full flex-nowrap items-center justify-between overflow-hidden">
          <div className="flex-1 truncate">{accountName}</div>
          <div className="min-w-1/3 shrink-0 truncate text-right">
            ••{lastDigits}
          </div>
        </div>
      </div>
    </div>
  )
}
