import { CategoryForm } from '@/components/category/category-form'
import { Text } from '@/components/ui/text'
import { useCategory, useUpdateCategory } from '@/stores/category/hooks'
import { useLocalSearchParams, useRouter } from 'expo-router'
import { ScrollView, View } from 'react-native'

export default function EditCategoryScreen() {
  const router = useRouter()
  const { categoryId } = useLocalSearchParams<{ categoryId: string }>()
  const { category } = useCategory(categoryId!)

  const { mutateAsync: mutateUpdate } = useUpdateCategory()

  if (!category) {
    return (
      <View className="flex-1 items-center justify-center bg-card">
        <Text className="text-muted-foreground">Category not found</Text>
      </View>
    )
  }

  return (
    <ScrollView
      className="bg-card px-6 py-3"
      keyboardShouldPersistTaps="handled"
    >
      <CategoryForm
        onSubmit={async (values) => {
          mutateUpdate({ id: category.id, data: values })
          router.back()
        }}
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
