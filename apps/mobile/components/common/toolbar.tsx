import { t } from '@lingui/macro'
import { useLingui } from '@lingui/react'
import * as Haptics from 'expo-haptics'
import { Link } from 'expo-router'
import { PlusIcon, Sparkles } from 'lucide-react-native'
import { TouchableOpacity, View } from 'react-native'
import { Button } from '../ui/button'
import { Input } from '../ui/input'

export function Toolbar() {
  const { i18n } = useLingui()
  return (
    <View className="absolute right-6 bottom-4 left-6 flex-row items-center gap-3">
      <TouchableOpacity activeOpacity={0.8} className="flex-1">
        <Input
          placeholder={t(i18n)`Ask AI anything...`}
          className="flex-1 pl-10"
          // editable={false}
          pointerEvents="none"
        />
        <View className="absolute top-3 left-3">
          <Sparkles className="h-5 w-5 text-muted-foreground" />
        </View>
      </TouchableOpacity>
      <Link
        href="/transaction/new-record"
        asChild
        onPress={Haptics.selectionAsync}
      >
        <Button size="icon" className="h-11 w-11">
          <PlusIcon className="size-6 text-primary-foreground" />
        </Button>
      </Link>
    </View>
  )
}
