import { useAppContext } from '@/store/app-provider'
import { useParams } from 'next/navigation'

export const useSpaces = () => {
  const { spaces } = useAppContext((state) => ({
    spaces: state.spaces,
  }))

  return spaces
}

export const useSpaceList = () => {
  const { spaces } = useAppContext((state) => ({
    spaces: state.spaces,
  }))

  return Object.values(spaces)
}

export const useCurrentSpaceId = () => {
  const { spaceId } = useParams<{ spaceId: string }>()
  if (!spaceId) {
    throw new Error('No spaceId found in params')
  }
  return spaceId
}

export const useCurrentSpace = () => {
  const currentSpaceId = useCurrentSpaceId()
  const { spaces } = useAppContext((state) => ({
    spaces: state.spaces,
  }))

  if (!currentSpaceId || !spaces[currentSpaceId]) {
    throw new Error('No space found')
  }

  return spaces[currentSpaceId]
}
