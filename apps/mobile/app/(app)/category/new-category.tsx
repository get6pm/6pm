import { CategoryForm } from '@/components/category/category-form'
import { createCategory } from '@/mutations/category'
import { categoryQueries } from '@/queries/category'
import type { CategoryTypeType } from '@6pm/validation'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useLocalSearchParams, useRouter } from 'expo-router'
import { Alert, View } from 'react-native'

export default function CreateCategoryScreen() {
  const router = useRouter()
  const { type = 'EXPENSE' } = useLocalSearchParams<{
    type?: CategoryTypeType
  }>()
  const queryClient = useQueryClient()
  const { mutateAsync } = useMutation({
    mutationFn: createCategory,
    onError(error) {
      Alert.alert(error.message)
    },
    onSuccess() {
      router.back()
    },
    async onSettled() {
      await queryClient.invalidateQueries({
        queryKey: categoryQueries.list._def,
      })
    },
  })

  return (
    <View className="py-3 px-6 bg-card h-screen">
      <CategoryForm onSubmit={mutateAsync} defaultValues={{ type }} />
    </View>
  )
}
