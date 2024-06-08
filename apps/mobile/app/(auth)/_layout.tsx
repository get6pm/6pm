import { Redirect, Stack } from 'expo-router';
import { useAuth } from '@clerk/clerk-expo';
import { SafeAreaView } from 'react-native';

export default function UnAuthenticatedLayout() {
  const { isSignedIn, userId } = useAuth();

  console.log("UnAuthenticatedLayout", isSignedIn, userId)

  if (isSignedIn) {
    return <Redirect href={"/"} />;
  }

  return (
    <SafeAreaView className="flex-1">
      <Stack screenOptions={{ headerShown: false }} />
    </SafeAreaView>
  );
};
