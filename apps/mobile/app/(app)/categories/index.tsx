import { useState } from 'react'
import { RefreshControl } from 'react-native'
import { ScrollView, Text } from 'react-native'

export default function CategoriesScreen() {
  const [isLoading, setIsLoading] = useState(false)

  const refetch = () => {
    setIsLoading(true)
    setTimeout(() => setIsLoading(false), 2000)
  }

  return (
    <ScrollView
      refreshControl={
        <RefreshControl refreshing={isLoading} onRefresh={refetch} />
      }
      className="py-3 px-6 bg-card flex-1"
    >
      <Text className="text-muted-foreground">Expenses</Text>
    </ScrollView>
  )
}
