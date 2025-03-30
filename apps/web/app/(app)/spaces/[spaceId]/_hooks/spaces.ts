import { useAppContext } from '@/store/app-provider'
import { useParams } from 'next/navigation'

export const useSpace = () => {
  const { spaceId } = useParams<{ spaceId: string }>()
  const { spaces } = useAppContext((state) => ({
    spaces: state.spaces,
  }))
  return spaces[spaceId]!
}
