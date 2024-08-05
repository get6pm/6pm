import { View } from 'react-native'
import { Skeleton } from '../ui/skeleton'

export function ListSkeleton() {
  return (
    <>
      <View className="mt-3 mb-5 flex-row items-center gap-5 px-6">
        <Skeleton className="h-6 w-6 rounded-full" />
        <Skeleton className="h-4 w-[40%] rounded-full" />
      </View>
      <View className="mt-3 mb-5 flex-row items-center gap-5 px-6">
        <Skeleton className="h-6 w-6 rounded-full" />
        <Skeleton className="h-4 w-[50%] rounded-full" />
      </View>
      <View className="mt-3 mb-5 flex-row items-center gap-5 px-6">
        <Skeleton className="h-6 w-6 rounded-full" />
        <Skeleton className="h-4 w-[30%] rounded-full" />
      </View>
    </>
  )
}
