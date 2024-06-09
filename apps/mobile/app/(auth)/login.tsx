import { AuthEmail } from "@/components/auth/auth-email";
import { ScrollView, Text } from "react-native";

export default function LoginScreen() {
  return (
    <ScrollView className="bg-card p-6" contentContainerClassName="gap-4">
      <Text className="text-3xl font-semibold font-sans">Manage your expense seamlessly</Text>
      <Text className="text-muted-foreground font-sans">
        Let <Text className="text-primary">6pm</Text> a good time to spend
      </Text>
      <AuthEmail />
    </ScrollView>
  )
}
