import type { FC, ReactNode } from 'react'

export type SpaceSplitLayoutProps = {
  left: ReactNode
  right: ReactNode
}

export const SpaceSplitLayout: FC<SpaceSplitLayoutProps> = ({
  left,
  right,
}) => {
  return (
    <div className="flex h-dvh overflow-hidden">
      <div className="flex-1 border-r">{left}</div>
      <div className="max-w-[650px] flex-1">{right}</div>
    </div>
  )
}
