import { Avatar, AvatarFallback, AvatarImage } from '@/components/Avatar';
import { View } from 'react-native';

export default function TabTwoScreen() {
  return (
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
  );
}
