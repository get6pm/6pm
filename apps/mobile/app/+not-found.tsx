import { Link, Stack } from 'expo-router'
import { Text, View } from 'react-native'

import { Button } from '@/components/Button'

export default function NotFoundScreen() {
  return (
    <>
      <Stack.Screen options={{ title: 'Oops!' }} />
      <View className="flex-1 items-center justify-center p-4 gap-4">
        <Text className='font-sans text-primary font-medium'>This screen doesn't exist.</Text>
        <Link href="/" asChild={true}>
          <Button label="Go to home screen!" />
        </Link>
      </View>
    </>
  )
}
