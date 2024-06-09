import { Toolbar } from '@/components/common/toolbar'
import { Text, View } from 'react-native'

export default function BudgetsScreen() {
  return (
    <View className="flex-1 bg-card">
      <Text className="font-sans">Budgets Screen</Text>
      <Toolbar />
    </View>
  )
}
