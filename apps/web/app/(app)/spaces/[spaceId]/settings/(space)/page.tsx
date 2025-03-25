import { updateSpace } from '@/actions/update-space'
import { SpaceForm, type SpaceFormValues } from '@/components/forms/space-form'
import getMetadata from '@/lib/get-metadata'
import { prisma } from '@6pm/db'

export const metadata = getMetadata({
  title: 'Space settings',
})

export default async function SpaceSettingsPage(props: {
  params: Promise<{ spaceId: string }>
}) {
  const { spaceId } = await props.params
  const space = await prisma.space.findUnique({ where: { id: spaceId } })

  const handleUpdateSpaceSettings = async (values: SpaceFormValues) => {
    'use server'
    const { success, data } = await updateSpace({ spaceId, data: values })
    if (!success) {
      throw new Error('Failed to update space settings')
    }
    return data
  }

  return (
    <div className="w-full space-y-4 rounded-lg border p-4 md:p-8">
      <h2 className="font-bold text-xl">General</h2>
      <SpaceForm
        onSubmit={handleUpdateSpaceSettings}
        initialValues={{
          name: space?.name,
          baseCurrencyCode: space?.baseCurrencyCode,
        }}
        submitButtonText="Save changes"
      />
    </div>
  )
}
