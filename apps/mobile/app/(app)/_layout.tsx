import { useAuth } from '@clerk/clerk-expo'
import { Redirect, SplashScreen, Stack } from 'expo-router'
import { useEffect } from 'react'

export default function AuthenticatedLayout() {
  const { isLoaded, isSignedIn } = useAuth()

  useEffect(() => {
    if (isLoaded) {
      setTimeout(() => SplashScreen.hideAsync(), 1000)
    }
  }, [isLoaded])

  if (!isSignedIn && isLoaded) {
    return <Redirect href={'/login'} />
  }

  return <Stack />
}
