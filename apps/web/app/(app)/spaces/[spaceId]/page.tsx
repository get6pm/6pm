import { SyncLastVisitedSpace } from './_components/sync-last-visited-space'

export default async function SpaceIdPage(props: {
  params: Promise<{ spaceId: string }>
}) {
  const { spaceId } = await props.params

  return (
    <>
      <SyncLastVisitedSpace spaceId={spaceId} />
      SpaceId {spaceId}
    </>
  )
}
