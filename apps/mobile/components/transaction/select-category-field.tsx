import { sleep } from '@/lib/utils'
import { useCategories } from '@/queries/category'
import type { Category } from '@6pm/validation'
import {
  BottomSheetBackdrop,
  BottomSheetModal,
  BottomSheetSectionList,
} from '@gorhom/bottom-sheet'
import { t } from '@lingui/macro'
import { useLingui } from '@lingui/react'
import { useRef } from 'react'
import { useController } from 'react-hook-form'
import { FlatList, Keyboard, View } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { FullWindowOverlay } from 'react-native-screens'
import GenericIcon from '../common/generic-icon'
import { Button } from '../ui/button'
import { Text } from '../ui/text'

export function SelectCategoryField({
  onSelect,
}: {
  onSelect?: (category: Category) => void
}) {
  const { bottom } = useSafeAreaInsets()
  const { data: categories = [], isLoading } = useCategories()

  const sheetRef = useRef<BottomSheetModal>(null)
  const { i18n } = useLingui()
  const {
    field: { onChange, onBlur, value },
  } = useController({ name: 'categoryId' })

  const selectedCategory = categories?.find((category) => category.id === value)

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
    <>
      <Button
        variant="secondary"
        className="border border-border !px-3 max-w-[160px]"
        disabled={isLoading}
        onPress={() => {
          Keyboard.dismiss()
          sheetRef.current?.present()
        }}
      >
        <GenericIcon
          // biome-ignore lint/suspicious/noExplicitAny: <explanation>
          name={(selectedCategory?.icon as any) || 'Shapes'}
          className="w-5 h-5 text-primary"
        />
        <Text className="shrink line-clamp-1">
          {selectedCategory?.name || t(i18n)`Uncategorized`}
        </Text>
      </Button>
      <BottomSheetModal
        ref={sheetRef}
        index={0}
        enableDynamicSizing
        enablePanDownToClose
        keyboardBehavior="extend"
        backdropComponent={(props) => (
          <BottomSheetBackdrop
            {...props}
            appearsOnIndex={0}
            disappearsOnIndex={-1}
            enableTouchThrough
          />
        )}
        containerComponent={(props) => (
          <FullWindowOverlay>{props.children}</FullWindowOverlay>
        )}
      >
        <BottomSheetSectionList
          sections={sections}
          keyExtractor={(i) => i.id}
          showsVerticalScrollIndicator={false}
          showsHorizontalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          contentContainerClassName="px-2"
          keyboardDismissMode="on-drag"
          renderSectionHeader={({ section: { title } }) => (
            <Text className="text-base bg-card font-medium text-center py-2">
              {title}
            </Text>
          )}
          contentContainerStyle={{ paddingBottom: bottom + 16 }}
          renderItem={({ section, index }) =>
            index === 0 ? (
              <FlatList
                data={section.data}
                numColumns={4}
                keyExtractor={(i) => i.id}
                showsVerticalScrollIndicator={false}
                showsHorizontalScrollIndicator={false}
                renderItem={({ item }) => (
                  <View className="p-1.5 w-[25%]">
                    <Button
                      size="icon"
                      className="h-20 flex flex-1 w-full gap-2 px-2 flex-col flex-grow"
                      variant={value === item ? 'secondary' : 'ghost'}
                      onPress={async () => {
                        sheetRef.current?.close()
                        await sleep(500)
                        onChange(item.id)
                        onBlur()
                        onSelect?.(item)
                      }}
                    >
                      <GenericIcon
                        // biome-ignore lint/suspicious/noExplicitAny: <explanation>
                        name={item.icon as any}
                        className="size-8 text-foreground"
                      />
                      <Text className="text-muted-foreground line-clamp-1 text-center !text-sm">
                        {item.name}
                      </Text>
                    </Button>
                  </View>
                )}
              />
            ) : null
          }
        />
      </BottomSheetModal>
    </>
  )
}
