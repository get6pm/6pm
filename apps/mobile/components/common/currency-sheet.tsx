import { currencies } from "@6pm/currency";
import { BottomSheetFlatList, BottomSheetTextInput } from "@gorhom/bottom-sheet";
import { t } from "@lingui/macro";
import { useLingui } from "@lingui/react";
import { SearchIcon } from "lucide-react-native";
import { useState } from "react";
import { View } from "react-native";
import { Text } from "../ui/text";
import { MenuItem } from "./menu-item";

type CurrencySheetListProps = {
  onSelect: (currency: typeof currencies[number]) => void;
  value: string;
}

export function CurrencySheetList({ onSelect, value }: CurrencySheetListProps) {
  const { i18n } = useLingui()
  const [searchValue, setSearchValue] = useState('')

  const filteredCurrencies = currencies.filter((currency) => {
    const search = searchValue.toLowerCase()
    return currency.name.toLowerCase().includes(search) || currency.code.toLowerCase().includes(search)
  })

  return (
    <BottomSheetFlatList
      data={filteredCurrencies}
      keyExtractor={(i) => i.code}
      contentContainerClassName="pb-8"
      stickyHeaderIndices={[0]}
      keyboardShouldPersistTaps="handled"
      keyboardDismissMode="on-drag"
      ListHeaderComponent={
        <View className="px-4 bg-card">
          <SearchIcon className="w-6 h-6 text-muted-foreground absolute left-7 z-10 top-2.5" />
          <BottomSheetTextInput
            placeholder={t(i18n)`Search currency...`}
            placeholderClassName="text-muted-foreground font-sans"
            className='mb-3 pl-11 web:flex h-11 web:w-full rounded-md border border-input bg-background px-3 web:py-2 text-sm lg:text-sm native:text-base native:leading-[1.25] text-foreground placeholder:text-muted-foreground web:ring-offset-background file:border-0 file:bg-transparent file:font-medium web:focus-visible:outline-none web:focus-visible:ring-2 font-sans web:focus-visible:ring-ring web:focus-visible:ring-offset-2'
            value={searchValue}
            onChangeText={setSearchValue}
          />
        </View>
      }
      renderItem={({ item }) => (
        <MenuItem
          label={item.name}
          onPress={() => onSelect(item)}
          className={item.code === value ? 'bg-muted' : ''}
          rightSection={
            <Text>
              {item.code}
            </Text>
          }
        />
      )}
    />
  )
}
