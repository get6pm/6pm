import { useAppContext } from '@/store/app-provider'

export const useSpaceCategories = (spaceId: string) => {
  const { spaces } = useAppContext((state) => ({
    spaces: state.spaces,
  }))

  const space = spaces[spaceId]

  if (!space) {
    return {}
  }

  return space.categories
}

export const useSpaceCategoryList = (spaceId: string) => {
  const categories = useSpaceCategories(spaceId)
  return Object.values(categories)
}
