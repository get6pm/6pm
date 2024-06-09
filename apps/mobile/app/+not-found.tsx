import { Link, Stack } from 'expo-router'
import { StyleSheet, Text, View } from 'react-native'

import { Button } from '@/components/Button'

export default function NotFoundScreen() {
  return (
    <>
      <Stack.Screen options={{ title: 'Oops!' }} />
      <View className="flex-1 items-center justify-center p-4">
        <Text>This screen doesn't exist.</Text>
        <Link href="/" style={styles.link} asChild={true}>
          <Button label="Go to home screen!" />
        </Link>
      </View>
    </>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  link: {
    marginTop: 15,
    paddingVertical: 15,
  },
})
