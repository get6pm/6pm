import { Toolbar } from '@/components/common/toolbar'
import { HomeHeader } from '@/components/home/header'
import { ScrollView, Text, View } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'

export default function HomeScreen() {
  const { top } = useSafeAreaInsets()
  return (
    <View className="flex-1 bg-card" style={{ paddingTop: top }}>
      <HomeHeader />
      <ScrollView>
        <Text className="font-sans">Home Screen</Text>
      </ScrollView>
      <Toolbar />
    </View>
  )
}
