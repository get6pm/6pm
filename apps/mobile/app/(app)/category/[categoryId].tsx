import { CategoryForm } from '@/components/category/category-form'
import { Text } from '@/components/ui/text'
import { updateCategory } from '@/mutations/category'
import { categoryQueries, useCategories } from '@/queries/category'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useLocalSearchParams, useRouter } from 'expo-router'
import { Alert, ScrollView, View } from 'react-native'

export default function EditCategoryScreen() {
  const { categoryId } = useLocalSearchParams<{ categoryId: string }>()
  const { data: categories = [] } = useCategories()
  const queryClient = useQueryClient()
  const router = useRouter()

  const { mutateAsync: mutateUpdate } = useMutation({
    mutationFn: updateCategory,
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
    throwOnError: true,
  })

  const category = categories.find((category) => category.id === categoryId)

  if (!category) {
    return (
      <View className="flex-1 bg-card items-center justify-center">
        <Text className="text-muted-foreground">Category not found</Text>
      </View>
    )
  }

  return (
    <ScrollView className="bg-card px-6 py-3">
      <CategoryForm
        onSubmit={(values) => mutateUpdate({ id: category.id, data: values })}
        hiddenFields={['type']}
        defaultValues={{
          name: category?.name,
          icon: category?.icon!,
          type: category?.type,
        }}
      />
    </ScrollView>
  )
}
