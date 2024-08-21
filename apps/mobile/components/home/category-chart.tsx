import { cn } from '@/lib/utils'
import type { TransactionPopulated } from '@6pm/validation'
import { t } from '@lingui/macro'
import { useLingui } from '@lingui/react'
import { useRef } from 'react'
import { FlatList, TouchableOpacity, View } from 'react-native'
import { Button } from '../ui/button'
import { Text } from '../ui/text'

type ChartCategory = {
  id: string
  name: string
  amountInVnd: number
}

type CategoryChartProps = {
  transactions: TransactionPopulated[]
  selected?: string
  onSelect?: (categoryId?: string) => void
}

export const UNCATEGORIZED_ID = 'UNCATEGORIZED'

export function CategoryChart({
  transactions,
  selected,
  onSelect,
}: CategoryChartProps) {
  const { i18n } = useLingui()
  const listRef = useRef<FlatList>(null)

  const categories = transactions.reduce(
    (acc, t) => {
      if (!t.category) {
        return acc.map((c) =>
          c.id === UNCATEGORIZED_ID
            ? { ...c, amountInVnd: c.amountInVnd + t.amountInVnd }
            : c,
        )
      }

      const foundCategory = acc.find((c) => c.id === t.category?.id)

      if (!foundCategory) {
        return acc.concat({
          id: t.category.id,
          name: t.category.name,
          amountInVnd: t.amountInVnd,
        })
      }

      return acc.map((c) =>
        c.id === foundCategory.id
          ? { ...c, amountInVnd: c.amountInVnd + t.amountInVnd }
          : c,
      )
    },
    [
      {
        id: UNCATEGORIZED_ID,
        name: t(i18n)`Uncategorized`,
        amountInVnd: 0,
      },
    ] as ChartCategory[],
  )

  const totalValue = categories.reduce((acc, c) => acc + c.amountInVnd, 0)

  const chartData = categories
    .map((c) => ({
      id: c.id,
      name: c.name,
      percentage: Number(((c.amountInVnd / totalValue) * 100).toFixed(1)),
    }))
    .sort((a, b) => b.percentage - a.percentage)

  return (
    <View className="w-full">
      <View className="flex-row gap-2">
        {chartData
          .filter((c) => c.percentage >= 5)
          .map((c, index) => {
            const opacity = 1 - index * 0.2 || 0.1
            return (
              <TouchableOpacity
                activeOpacity={0.8}
                key={c.id}
                onPress={() => {
                  onSelect?.(selected === c.id ? undefined : c.id)
                  listRef.current?.scrollToIndex({
                    index: chartData.findIndex((i) => i.id === c.id),
                    viewPosition: 0.5,
                    animated: true,
                  })
                }}
                className={cn(
                  'h-6 rounded-md bg-primary',
                  selected && selected !== c.id && '!opacity-10',
                  selected === c.id && '!opacity-100',
                )}
                style={{ opacity, flex: c.percentage }}
              />
            )
          })}
      </View>
      <FlatList
        ref={listRef}
        horizontal
        data={chartData.filter((c) => c.percentage > 0)}
        showsHorizontalScrollIndicator={false}
        contentContainerClassName="py-2"
        keyExtractor={(item) => item.id}
        ItemSeparatorComponent={() => <View className="w-1" />}
        renderItem={({ item, index }) => {
          const opacity = 1 - index * 0.2 || 0.1
          return (
            <Button
              variant={selected === item.id ? 'secondary' : 'ghost'}
              size="sm"
              className={cn(
                '!h-8 border border-primary-foreground',
                selected === item.id && 'border-border',
              )}
              onPress={() => {
                onSelect?.(selected === item.id ? undefined : item.id)
                listRef.current?.scrollToIndex({
                  index: index,
                  viewPosition: 0.5,
                  animated: true,
                })
              }}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              {opacity > 0 && (
                <View
                  className={cn('h-3 w-3 rounded bg-primary')}
                  style={{ opacity }}
                />
              )}
              <Text>{item.name}</Text>
              <Text className="font-normal text-muted-foreground">
                {item.percentage}%
              </Text>
            </Button>
          )
        }}
      />
    </View>
  )
}
