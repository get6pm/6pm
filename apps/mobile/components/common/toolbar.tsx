import { t } from '@lingui/macro'
import { useLingui } from '@lingui/react'
import { Link } from 'expo-router'
import { PlusIcon, Sparkles } from 'lucide-react-native'
import { View } from 'react-native'
import { IconButton } from '../IconButton'
import { Input } from '../Input'

export function Toolbar() {
  const { i18n } = useLingui()
  return (
    <View className="gap-3 items-center absolute flex-row bottom-4 left-6 right-6">
      <Input
        placeholder={t(i18n)`Ask AI anything...`}
        leftSection={<Sparkles className="w-5 h-5 text-muted-foreground" />}
        className="flex-1"
      />
      <Link href="/new-record" asChild>
        <IconButton icon={PlusIcon} className="w-10 h-10" iconClasses='size-6' />
      </Link>
    </View>
  )
}
