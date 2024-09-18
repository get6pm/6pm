import { BottomSheetFlatList } from '@gorhom/bottom-sheet'
import { Button } from '../ui/button'
import GenericIcon from './generic-icon'

type IconGridSheetProps = {
  icons: string[]
  onSelect: (icon: string) => void
  value: string
}

export function IconGridSheet({ icons, onSelect, value }: IconGridSheetProps) {
  return (
    <BottomSheetFlatList
      data={icons}
      numColumns={6}
      keyExtractor={(i) => i}
      contentContainerClassName="pb-8 px-4 gap-2"
      columnWrapperClassName="gap-2"
      showsVerticalScrollIndicator={false}
      showsHorizontalScrollIndicator={false}
      keyboardShouldPersistTaps="handled"
      keyboardDismissMode="on-drag"
      renderItem={({ item }) => (
        <Button
          size="icon"
          className="flex h-16 flex-1 flex-grow"
          variant={value === item ? 'secondary' : 'ghost'}
          onPress={() => onSelect(item)}
        >
          {/* biome-ignore lint/suspicious/noExplicitAny: <explanation> */}
          <GenericIcon name={item as any} className="size-6 text-primary" />
        </Button>
      )}
    />
  )
}
