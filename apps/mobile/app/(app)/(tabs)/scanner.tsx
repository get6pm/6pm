import { Toolbar } from '@/components/common/toolbar'
import { Text, View } from 'react-native'

export default function ScannerScreen() {
  return (
    <View className="flex-1 bg-card">
      <Text className="font-sans">Scanner Screen</Text>
      <Toolbar />
    </View>
  )
}
