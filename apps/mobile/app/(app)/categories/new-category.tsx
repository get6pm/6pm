import { CategoryForm } from '@/components/category/category-form'
import { createCategory } from '@/mutations/category'
import { useMutation } from '@tanstack/react-query'
import { useRouter } from 'expo-router'
import { Alert, View } from 'react-native'

export default function CreateCategoryScreen() {
  const router = useRouter()
  const { mutateAsync } = useMutation({
    mutationFn: createCategory,
    onError(error) {
      Alert.alert(error.message)
    },
    onSuccess() {
      router.back()
    },
  })

  return (
    <View className="py-3 px-6 bg-card h-screen">
      <CategoryForm onSubmit={mutateAsync} />
    </View>
  )
}
