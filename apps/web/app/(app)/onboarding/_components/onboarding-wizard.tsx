'use client'
import { createSpace } from '@/actions/create-space'
import { SpaceForm, type SpaceFormValues } from '@/components/forms/space-form'
import { useRouter } from 'next/navigation'
import type { FC } from 'react'

const SIDEBAR_WIDTH = 400

export type OnboardingWizardProps = {
  userName: string | null
}

export const OnboardingWizard: FC<OnboardingWizardProps> = ({ userName }) => {
  const router = useRouter()

  const handleCreateSpace = async (values: SpaceFormValues) => {
    const { data: space, success, error } = await createSpace(values)
    if (!success) {
      console.error(error)
      throw new Error('Failed to create space')
    }
    router.push(`/spaces/${space.id}`)
    return space
  }

  return (
    <>
      <div
        className="fixed top-0 bottom-0 left-0 p-4"
        style={{ width: SIDEBAR_WIDTH }}
      >
        <div className="h-full w-full rounded-md border bg-gradient-to-b from-bg-300/70 to-bg-400/70 p-4 backdrop-blur">
          <h1 className="font-serif text-2xl">6pm</h1>
        </div>
      </div>
      <div className="min-h-dvh" style={{ paddingLeft: SIDEBAR_WIDTH }}>
        <div className="p-8">
          <div className="font-serif text-2xl">
            Welcome, {userName || 'Guest'}
          </div>
          <div className="mt-2 text-muted-foreground">
            Let's create your first space
          </div>
          <div className="mt-8">
            <SpaceForm
              autoFocus
              onSubmit={handleCreateSpace}
              className="max-w-sm"
              initialValues={{
                name: `${userName ? userName : 'Personal'}'s Space`,
              }}
            />
          </div>
        </div>
      </div>
    </>
  )
}
