'use client'

import type { PropsWithChildren } from 'react'
import { NavBar } from './_components/nav-bar'

export default function SpaceIdLayoutPage({ children }: PropsWithChildren) {
  return (
    <div className="pb-20">
      {children}
      <NavBar />
    </div>
  )
}
