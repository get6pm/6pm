import type { FC, ReactNode } from 'react'

export type SpaceMainLayoutProps = {
  children: ReactNode
  headerTitle: string
  toolbar?: ReactNode
}

export const SpaceMainLayout: FC<SpaceMainLayoutProps> = ({
  children,
  headerTitle,
  toolbar,
}) => {
  return (
    <>
      <header className="w-full">
        <div className="flex w-full items-center gap-4 px-3 pt-4 lg:px-11">
          <div className="font-serif text-2xl">{headerTitle}</div>
          {toolbar}
        </div>
      </header>
      <div className="mx-auto mt-8 flex w-full max-w-5xl gap-8 px-3 lg:px-11">
        {children}
      </div>
    </>
  )
}
