import { sleep } from '@/lib/utils'
import type { Category } from '@6pm/validation'
import {
  type BottomSheetModal,
  BottomSheetSectionList,
} from '@gorhom/bottom-sheet'
import { t } from '@lingui/macro'
import { useLingui } from '@lingui/react'
import * as Haptics from 'expo-haptics'
import { useCallback, useRef, useState } from 'react'
import { useController } from 'react-hook-form'
import { FlatList, Keyboard, View } from 'react-native'
import TextTicker from 'react-native-text-ticker'

import { useCategoryList } from '@/stores/category/hooks'
import { Link, useFocusEffect } from 'expo-router'
import { PlusIcon } from 'lucide-react-native'
import { cssInterop } from 'nativewind'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { BottomSheet } from '../common/bottom-sheet'
import GenericIcon from '../common/generic-icon'
import { Badge } from '../ui/badge'
import { Button } from '../ui/button'
import { Text } from '../ui/text'

cssInterop(TextTicker, {
  className: {
    target: 'style',
  },
})

export function SelectCategoryField({
  onSelect,
}: {
  onSelect?: (category: Category) => void
}) {
  const { bottom } = useSafeAreaInsets()
  const { categories = [], isLoading } = useCategoryList()
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
        className="!px-3 max-w-[140px] border border-border"
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
      <BottomSheet ref={sheetRef} index={0} enableDynamicSizing>
        <BottomSheetSectionList
          sections={sections}
          keyExtractor={(i) => i.id}
          showsVerticalScrollIndicator={false}
          showsHorizontalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          contentContainerClassName="px-2"
          keyboardDismissMode="on-drag"
          renderSectionHeader={({ section: { title } }) => (
            <Badge className="mx-auto my-2 px-8" variant="secondary">
              <Text className="text-base uppercase">{title}</Text>
            </Badge>
          )}
          contentContainerStyle={{ paddingBottom: bottom + 16 }}
          renderItem={({ section, index }) =>
            index === 0 ? (
              <FlatList
                data={section.data}
                numColumns={3}
                columnWrapperClassName="flex-wrap"
                keyExtractor={(i) => i.id}
                showsVerticalScrollIndicator={false}
                showsHorizontalScrollIndicator={false}
                extraData={[value]}
                renderItem={({ item, index: idx }) => (
                  <>
                    <View className="w-[33%] items-center justify-center p-2">
                      <Button
                        size="icon"
                        className="flex h-20 w-full flex-1 flex-grow flex-col px-2 pt-1.5"
                        variant={value === item.id ? 'secondary' : 'ghost'}
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
                        <TextTicker
                          marqueeDelay={500}
                          duration={200 * item.name.length}
                          bouncePadding={{ left: 5, right: 5 }}
                          bounce
                          loop
                          animationType="bounce"
                          className="!text-base line-clamp-1 text-center text-muted-foreground"
                        >
                          {item.name}
                        </TextTicker>
                      </Button>
                    </View>

                    {idx === section.data.length - 1 && (
                      <View className="w-[33%] items-center justify-center p-1.5">
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
      </BottomSheet>
    </>
  )
}
