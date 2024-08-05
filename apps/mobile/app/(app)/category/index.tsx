import { CategoryItem } from '@/components/category/category-item'
import { AddNewButton } from '@/components/common/add-new-button'
import { Skeleton } from '@/components/ui/skeleton'
import { Text } from '@/components/ui/text'
import { useCategoryList } from '@/stores/category/hooks'
import { t } from '@lingui/macro'
import { useLingui } from '@lingui/react'
import { useRouter } from 'expo-router'
import { SectionList } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'

export default function CategoriesScreen() {
  const { i18n } = useLingui()
  const router = useRouter()
  const { incomeCategories, expenseCategories, isRefetching, refetch } =
    useCategoryList()
  const { bottom } = useSafeAreaInsets()

  const sections = [
    { key: 'INCOME', title: t(i18n)`Incomes`, data: incomeCategories },
    { key: 'EXPENSE', title: t(i18n)`Expenses`, data: expenseCategories },
  ]

  return (
    <SectionList
      className="flex-1 bg-card"
      contentContainerStyle={{ paddingBottom: bottom }}
      refreshing={isRefetching}
      onRefresh={refetch}
      sections={sections}
      keyExtractor={(item) => item.id}
      renderItem={({ item: category }) => <CategoryItem category={category} />}
      renderSectionHeader={({ section: { title } }) => (
        <Text className="mx-6 bg-card py-2 text-muted-foreground">{title}</Text>
      )}
      renderSectionFooter={({ section }) => (
        <>
          {!section.data.length &&
            (isRefetching ? (
              <>
                <Skeleton className="mx-6 mt-3 mb-5 h-4 rounded-full" />
                <Skeleton className="mx-6 mt-3 mb-5 h-4 rounded-full" />
                <Skeleton className="mx-6 mt-3 mb-5 h-4 rounded-full" />
              </>
            ) : (
              <Text className="mt-6 mb-9 text-center font-sans text-muted-foreground">
                {t(i18n)`empty`}
              </Text>
            ))}
          <AddNewButton
            label={t(i18n)`New ${section.key.toLowerCase()}`}
            onPress={() =>
              router.push({
                pathname: '/category/new-category',
                params: { type: section.key },
              })
            }
            className="mb-6"
          />
        </>
      )}
    />
  )
}
