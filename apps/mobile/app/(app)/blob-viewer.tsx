import { useLocalSearchParams } from 'expo-router'
import { Image, View } from 'react-native'

export default function BlobViewerScreen() {
  const { blobObjectUrl } = useLocalSearchParams()
  if (!blobObjectUrl) {
    return null
  }
  return (
    <View className="flex-1 bg-background">
      <Image
        source={{ uri: blobObjectUrl as string }}
        className="h-full w-full"
        resizeMode="contain"
      />
    </View>
  )
}
