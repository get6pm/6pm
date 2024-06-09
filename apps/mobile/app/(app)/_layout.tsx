import { Redirect, Stack } from 'expo-router';
import { useAuth } from '@clerk/clerk-expo';
import { Text } from 'react-native';

export default function AuthenticatedLayout() {
  const { isLoaded, isSignedIn } = useAuth();

  if (!isLoaded) {
    return <Text>Loading...</Text>;
  }

  if (!isSignedIn) {
    return <Redirect href={"/login"} />;
  }

  return <Stack />;
};
