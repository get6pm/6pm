import { CategoryForm } from '@/components/category/category-form'
import { toast } from '@/components/common/toast'
import { Button } from '@/components/ui/button'
import { Text } from '@/components/ui/text'
import { useUserEntitlements } from '@/hooks/use-purchases'
import {
  useCategory,
  useDeleteCategory,
  useUpdateCategory,
} from '@/stores/category/hooks'
import { t } from '@lingui/macro'
import { useLingui } from '@lingui/react'
import { useLocalSearchParams, useNavigation, useRouter } from 'expo-router'
import { Trash2Icon } from 'lucide-react-native'
import { useEffect } from 'react'
import { Alert, ScrollView, View } from 'react-native'

export default function EditCategoryScreen() {
  const router = useRouter()
  const { categoryId } = useLocalSearchParams<{ categoryId: string }>()
  const { category } = useCategory(categoryId!)
  const navigation = useNavigation()
  const { i18n } = useLingui()
  const { isPro } = useUserEntitlements()

  const { mutateAsync: mutateUpdate } = useUpdateCategory()
  const { mutateAsync: mutateDelete } = useDeleteCategory()

  // biome-ignore lint/correctness/useExhaustiveDependencies: <explanation>
  useEffect(() => {
    navigation.setOptions({
      headerRight: () => (
        <Button
          size="icon"
          variant="ghost"
          disabled={!isPro}
          onPress={() =>
            Alert.alert(
              t(
                i18n,
              )`Are you sure you want to delete this category? This action cannot be undone.`,
              '',
              [
                {
                  text: t(i18n)`Cancel`,
                  style: 'cancel',
                },
                {
                  text: t(i18n)`Delete`,
                  style: 'destructive',
                  onPress: () => {
                    mutateDelete(categoryId as string)
                    router.back()
                    toast.success(t(i18n)`Category deleted`)
                  },
                },
              ],
            )
          }
        >
          <Trash2Icon className="size-5 text-foreground" />
        </Button>
      ),
    })
  }, [isPro])

  if (!category) {
    return (
      <View className="flex-1 items-center justify-center bg-background">
        <Text className="text-muted-foreground">Category not found</Text>
      </View>
    )
  }

  return (
    <ScrollView
      className="bg-background px-6 py-3"
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
