import { SpaceForm, type SpaceFormValues } from '@/components/forms/space-form'
import getMetadata from '@/lib/get-metadata'
import { findSpace } from '@6pm/db/services/space'
import { updateSpaceSettingsAction } from '../actions'

export const metadata = getMetadata({
  title: 'Space settings',
})

export default async function SpaceSettingsPage(props: {
  params: Promise<{ spaceId: string }>
}) {
  const { spaceId } = await props.params
  const space = await findSpace({ id: spaceId })

  const handleUpdateSpaceSettings = async (values: SpaceFormValues) => {
    'use server'
    await updateSpaceSettingsAction(spaceId, values)
  }

  return (
    <div className="w-full space-y-4 rounded-lg border p-4 md:p-8">
      <h2 className="font-bold text-xl">General</h2>
      <SpaceForm
        onSubmit={handleUpdateSpaceSettings}
        initialValues={{ name: space?.name }}
        submitButtonText="Save changes"
      />
    </div>
  )
}
