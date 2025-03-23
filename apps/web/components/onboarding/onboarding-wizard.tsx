'use client'
import type { FC } from 'react'

const SIDEBAR_WIDTH = 400

export type OnboardingWizardProps = {}

export const OnboardingWizard: FC<OnboardingWizardProps> = () => {
  return (
    <>
      <div
        className="fixed top-0 bottom-0 left-0 p-4"
        style={{ width: SIDEBAR_WIDTH }}
      >
        <div className="h-full w-full rounded-md bg-[hsl(51,16.5%,84.5%)] p-4 backdrop-blur-md">
          <h1 className="font-serif text-2xl">6pm</h1>
        </div>
      </div>
      <div className="min-h-dvh" style={{ paddingLeft: SIDEBAR_WIDTH }}>
        <div className="p-8">Onboard</div>
      </div>
    </>
  )
}
