import type { ReactNode } from 'react'
import { SpaceMainLayout } from '../_components/space-main-layout'
import { SettingsNavbar } from './_components/settings-navbar'

export default async function SettingsLayout({
  children,
}: { children: ReactNode }) {
  return (
    <SpaceMainLayout headerTitle="Settings">
      <div className="w-1/3">
        <SettingsNavbar />
      </div>
      <div className="w-full space-y-6">{children}</div>
    </SpaceMainLayout>
  )
}
