import { CategoryItem } from '@/components/category/category-item'
import { AddNewButton } from '@/components/common/add-new-button'
import { Skeleton } from '@/components/ui/skeleton'
import { Text } from '@/components/ui/text'
import { useCategories } from '@/queries/category'
import { t } from '@lingui/macro'
import { useLingui } from '@lingui/react'
import { useRouter } from 'expo-router'
import { SectionList } from 'react-native'

export default function CategoriesScreen() {
  const { i18n } = useLingui()
  const router = useRouter()
  const { data: categories = [], isLoading, refetch } = useCategories()

  const incomeCategories = categories.filter(
    (category) => category.type === 'INCOME',
  )
  const expenseCategories = categories.filter(
    (category) => category.type === 'EXPENSE',
  )

  const sections = [
    { key: 'INCOME', title: 'Incomes', data: incomeCategories },
    { key: 'EXPENSE', title: 'Expenses', data: expenseCategories },
  ]

  return (
    <SectionList
      className="py-3 bg-card flex-1"
      refreshing={isLoading}
      onRefresh={refetch}
      sections={sections}
      keyExtractor={(item) => item.id}
      renderItem={({ item: category }) => <CategoryItem category={category} />}
      renderSectionHeader={({ section: { title } }) => (
        <Text className="text-muted-foreground mx-6">{title}</Text>
      )}
      renderSectionFooter={({ section }) => (
        <>
          {!section.data.length &&
            (isLoading ? (
              <>
                <Skeleton className="mx-6 mb-5 mt-3 h-4 rounded-full" />
                <Skeleton className="mx-6 mb-5 mt-3 h-4 rounded-full" />
                <Skeleton className="mx-6 mb-5 mt-3 h-4 rounded-full" />
              </>
            ) : (
              <Text className="font-sans text-muted-foreground text-center mt-6 mb-9">
                {t(i18n)`empty`}
              </Text>
            ))}
          <AddNewButton
            label={t(i18n)`New ${section.key.toLowerCase()}`}
            onPress={() =>
              router.push({
                pathname: '/categories/new-category',
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
