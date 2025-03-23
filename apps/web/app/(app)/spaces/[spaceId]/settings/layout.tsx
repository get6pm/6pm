import type { ReactNode } from 'react'
import { SettingsNavbar } from './_components/settings-navbar'

export default async function SettingsLayout({
  children,
}: { children: ReactNode }) {
  return (
    <>
      <header className="w-full">
        <div className="flex w-full items-center justify-between gap-4 px-3 pt-4 lg:px-11">
          <div className="font-serif text-2xl">Settings</div>
        </div>
      </header>
      <div className="mx-auto mt-8 flex w-full max-w-5xl gap-8 px-3 lg:px-11">
        <div className="w-1/3">
          <SettingsNavbar />
        </div>
        <div className="w-full space-y-6">{children}</div>
      </div>
    </>
  )
}
