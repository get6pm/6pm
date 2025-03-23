'use client'
import type { createSpaceAction } from '@/app/(app)/onboarding/actions'
import type { User } from '@6pm/db'
import { useRouter } from 'next/navigation'
import type { FC } from 'react'
import {
  CreateSpaceForm,
  type CreateSpaceFormValues,
} from './create-space-form'

const SIDEBAR_WIDTH = 400

export type OnboardingWizardProps = {
  user: User
  createSpace: typeof createSpaceAction
}

export const OnboardingWizard: FC<OnboardingWizardProps> = ({
  user,
  createSpace,
}) => {
  const router = useRouter()

  const handleCreateSpace = async (values: CreateSpaceFormValues) => {
    const space = await createSpace(values)
    router.push(`/spaces/${space.id}`)
  }

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
        <div className="p-8">
          <div className="font-serif text-2xl">Welcome, {user.firstName}</div>
          <div className="mt-2 text-muted-foreground">
            Let's create your first space
          </div>
          <div className="mt-8">
            <CreateSpaceForm
              autoFocus
              onSubmit={handleCreateSpace}
              className="max-w-sm"
              initialValues={{ name: `${user.firstName}'s Space` }}
            />
          </div>
        </div>
      </div>
    </>
  )
}
