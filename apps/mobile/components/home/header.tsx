import { useUser } from "@clerk/clerk-expo";
import { t } from "@lingui/macro";
import { useLingui } from "@lingui/react";
import { ArrowDownUp, Bell } from "lucide-react-native";
import { Text, TouchableOpacity, View } from "react-native";
import { Avatar, AvatarFallback, AvatarImage } from "../Avatar";
import { IconButton } from "../IconButton";

export function HomeHeader() {
  const { user } = useUser()
  const { i18n } = useLingui()

  return (
    <View className="flex bg-card px-6 py-3 flex-row items-center justify-between">
      <View className="flex flex-row items-center gap-3">
        <Avatar>
          <AvatarImage
            source={{
              uri: user?.imageUrl,
            }}
          />
          <AvatarFallback>QK</AvatarFallback>
        </Avatar>
        <View>
          <Text className="font-medium text-muted-foreground text-sm font-sans">
            {user?.fullName ?? user?.primaryEmailAddress?.emailAddress}
          </Text>
          <TouchableOpacity activeOpacity={0.8} className="gap-2 items-center flex-row">
            <Text className="text-primary font-sans font-medium">
              {t(i18n)`All Accounts`}
            </Text>
            <ArrowDownUp className="w-4 h-4 text-muted-foreground" />
          </TouchableOpacity>
        </View>
      </View>
      <IconButton icon={Bell} variant="secondary" />
    </View>
  )
}