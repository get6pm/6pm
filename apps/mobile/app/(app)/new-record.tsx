import { NumericPad } from '@/components/numeric-pad'
import { TextTicker } from '@/components/text-ticker'
import { useState } from 'react'
import { View } from 'react-native'

export default function NewRecordScreen() {
  const [value, setValue] = useState<number>(0)
  return (
    <View className="flex-1 justify-between bg-muted">
      <View className="flex-1 items-center justify-center">
        <TextTicker
          value={value}
          className="font-semibold text-6xl leading-tight text-center"
          suffix="VND"
          suffixClassName="font-semibold ml-2 text-muted-foreground overflow-visible"
        />
      </View>
      <NumericPad value={value} onValueChange={setValue} />
    </View>
  )
}
