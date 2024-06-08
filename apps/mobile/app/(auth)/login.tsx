import { AuthEmail } from "@/components/auth/auth-email";
import { ScrollView, Text } from "react-native";

export default function LoginScreen() {
  return (
    <ScrollView className="bg-card p-4" contentContainerClassName="gap-4">
      <Text className="text-3xl font-semibold">Manage your expense seamlessly</Text>
      <Text className="text-muted-foreground">Let 6pm a good time to spend</Text>
      <AuthEmail />
    </ScrollView>
  )
}
