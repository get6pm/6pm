import { sleep } from '@/lib/utils'
import type { Category } from '@6pm/validation'
import {
  BottomSheetBackdrop,
  BottomSheetModal,
  BottomSheetSectionList,
} from '@gorhom/bottom-sheet'
import { t } from '@lingui/macro'
import { useLingui } from '@lingui/react'
import * as Haptics from 'expo-haptics'
import { useCallback, useRef, useState } from 'react'
import { useController } from 'react-hook-form'
import { FlatList, Keyboard, View } from 'react-native'

import { useColorScheme } from '@/hooks/useColorScheme'
import { theme } from '@/lib/theme'
import { useCategoryList } from '@/stores/category/hooks'
import { Link, useFocusEffect } from 'expo-router'
import { PlusIcon } from 'lucide-react-native'
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
  const { categories = [], isLoading } = useCategoryList()
  const { colorScheme } = useColorScheme()
  const [shouldReOpen, setShouldReOpen] = useState(false)

  const sheetRef = useRef<BottomSheetModal>(null)
  const { i18n } = useLingui()
  const {
    field: { onChange, onBlur, value },
  } = useController({ name: 'categoryId' })

  useFocusEffect(
    useCallback(() => {
      if (shouldReOpen) {
        sheetRef.current?.present()
        setShouldReOpen(false)
      }
    }, [shouldReOpen]),
  )

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
        className="!px-3 max-w-[160px] border border-border"
        disabled={isLoading}
        onPress={() => {
          Haptics.selectionAsync()
          Keyboard.dismiss()
          sheetRef.current?.present()
        }}
      >
        <GenericIcon
          // biome-ignore lint/suspicious/noExplicitAny: <explanation>
          name={(selectedCategory?.icon as any) || 'Shapes'}
          className="h-5 w-5 text-primary"
        />
        <Text className="line-clamp-1 shrink">
          {selectedCategory?.name || t(i18n)`Uncategorized`}
        </Text>
      </Button>
      <BottomSheetModal
        ref={sheetRef}
        index={0}
        enableDynamicSizing
        enablePanDownToClose
        keyboardBehavior="extend"
        backgroundStyle={{ backgroundColor: theme[colorScheme].background }}
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
            <Text className="bg-card py-2 text-center font-medium text-base">
              {title}
            </Text>
          )}
          contentContainerStyle={{ paddingBottom: bottom + 16 }}
          renderItem={({ section, index }) =>
            index === 0 ? (
              <FlatList
                data={section.data}
                numColumns={4}
                columnWrapperClassName="flex-wrap"
                keyExtractor={(i) => i.id}
                showsVerticalScrollIndicator={false}
                showsHorizontalScrollIndicator={false}
                renderItem={({ item, index: idx }) => (
                  <>
                    <View className="w-[25%] items-center justify-center p-1.5">
                      <Button
                        size="icon"
                        className="flex h-20 w-full flex-1 flex-grow flex-col gap-2 px-2"
                        variant={value === item ? 'secondary' : 'ghost'}
                        onPress={async () => {
                          Haptics.selectionAsync()
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
                        <Text className="!text-sm line-clamp-1 text-center text-muted-foreground">
                          {item.name}
                        </Text>
                      </Button>
                    </View>

                    {idx === section.data.length - 1 && (
                      <View className="w-[25%] items-center justify-center p-1.5">
                        <Link href="/category/new-category" asChild>
                          <Button
                            size="icon"
                            variant="outline"
                            className="h-16 w-16 items-center justify-center border-dashed"
                            onPress={async () => {
                              Haptics.selectionAsync()
                              sheetRef.current?.close()
                              await sleep(500)
                              setShouldReOpen(true)
                            }}
                          >
                            <PlusIcon className="size-6 text-muted-foreground" />
                          </Button>
                        </Link>
                      </View>
                    )}
                  </>
                )}
              />
            ) : null
          }
        />
      </BottomSheetModal>
    </>
  )
}
