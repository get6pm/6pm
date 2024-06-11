import { t } from '@lingui/macro'
import { useLingui } from '@lingui/react'
import { Link } from 'expo-router'
import { PlusIcon, Sparkles } from 'lucide-react-native'
import { TouchableOpacity, View } from 'react-native'
import { Button } from '../ui/button'
import { Input } from '../ui/input'

export function Toolbar() {
  const { i18n } = useLingui()
  return (
    <View className="gap-3 items-center absolute flex-row bottom-4 left-6 right-6">
      <TouchableOpacity activeOpacity={0.8} className='flex-1'>
        <Input
          placeholder={t(i18n)`Ask AI anything...`}
          className="flex-1 pl-10"
          // editable={false}
          pointerEvents='none'
        />
        <View className="absolute left-3 top-1/2 transform -translate-y-1/2">
          <Sparkles className="w-5 h-5 text-muted-foreground" />
        </View>
      </TouchableOpacity>
      <Link href="/new-record" asChild>
        <Button size='icon'>
          <PlusIcon className='size-6 text-primary-foreground' />
        </Button>
      </Link>
    </View>
  )
}
