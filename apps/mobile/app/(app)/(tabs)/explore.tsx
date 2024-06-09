import { Avatar, AvatarFallback, AvatarImage } from '@/components/Avatar';
import { Button } from '@/components/Button';
import { useAuth } from '@clerk/clerk-expo';
import { ScrollView, Text, View } from 'react-native';
import { getHonoClient } from '@/lib/client';
import { useQuery } from '@tanstack/react-query';

export default function TabTwoScreen() {
  const { signOut } = useAuth();
  const { data } = useQuery({
    queryKey: ['me'],
    queryFn: async () => {
      const hc = await getHonoClient()
      const res = await hc.v1.auth.me.$get()
      if (res.ok) {
        return await res.json()
      } else {
        throw new Error(await res.text())
      }
    },
  })

  return (
    <ScrollView contentContainerClassName='flex-1 p-4'>
      <View className="flex justify-center flex-1 items-center flex-row gap-4">
        <Avatar className="h-14 w-14">
          <AvatarImage
            source={{
              uri: 'https://avatars.githubusercontent.com/u/16166195?s=96&v=4',
            }}
          />
          <AvatarFallback>CG</AvatarFallback>
        </Avatar>
        <Avatar className="h-14 w-14">
          <AvatarImage
            source={{
              uri: 'https://avatars.githubusercontent.com/u/9253690?s=96&v=4',
            }}
          />
          <AvatarFallback>SS</AvatarFallback>
        </Avatar>
      </View>
      <Text className="font-sans">{data?.email ? `Logged as ${data.email}` : 'loading...'}</Text>
      <Button label="Sign Out" onPress={() => signOut()} />
    </ScrollView>
  );
}
