'use client'
import { useParams } from 'next/navigation'
import { useAppContext } from './app-provider'

export const useCurrentSpaceId = () => {
  const { spaceId } = useParams<{ spaceId: string }>()
  if (!spaceId) {
    throw new Error('No spaceId found in params')
  }
  return spaceId
}

export const useSpace = (targetSpaceId?: string) => {
  const currentSpaceId = useCurrentSpaceId()
  const spaceId = targetSpaceId || currentSpaceId
  const { spaces } = useAppContext((state) => ({
    spaces: state.spaces,
  }))

  if (!spaceId || !spaces[spaceId]) {
    return null
  }

  return spaces[spaceId]
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

export const useSpaceCategories = (targetSpaceId?: string) => {
  const currentSpaceId = useCurrentSpaceId()
  const spaceId = targetSpaceId || currentSpaceId
  const { spaces } = useAppContext((state) => ({
    spaces: state.spaces,
  }))

  if (!spaceId || !spaces[spaceId]) {
    return {}
  }

  return spaces[spaceId].categories
}
