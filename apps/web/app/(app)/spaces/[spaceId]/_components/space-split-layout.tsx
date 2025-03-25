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
    <div className="grid h-screen grid-cols-2 overflow-hidden">
      <div className="col-span-1 border-r">{left}</div>
      <div className="col-span-1">{right}</div>
    </div>
  )
}
