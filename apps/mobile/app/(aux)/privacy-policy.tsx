import { Separator } from '@/components/ui/separator'
import { Text } from '@/components/ui/text'
import * as Linking from 'expo-linking'
import { ScrollView, View } from 'react-native'

export default function PrivacyScreen() {
  return (
    <ScrollView
      className="bg-background"
      contentContainerClassName="px-6 py-3 gap-2"
    >
      <Text>
        Hey there! Thanks for using 6pm. Here's the lowdown on what data we
        collect, how we use it, and how we keep it safe. We aim to be as
        transparent as possible, so let's dive in!
      </Text>

      <Text className="mt-2 font-semiBold text-xl">What Info We Collect</Text>
      <Text>To get you up and running, we collect some basic information:</Text>
      <View className="gap-2 px-2">
        <Text>✳︎ Email address</Text>
        <Text>✳︎ Profile picture</Text>
      </View>

      <Text className="mt-2 font-semiBold text-xl">How We Use Your Info</Text>
      <Text>
        We use the collected info to make sure everything runs smoothly. Here's
        how:
      </Text>
      <View className="gap-2 px-2">
        <Text>
          ✳︎ Your email and avatar help us authenticate and identify you.
        </Text>
        <Text>
          ✳︎ We share your user identity with Sentry for crash reporting and with
          Posthog for product analytics. This helps us make the app better for
          you and everyone else.
        </Text>
      </View>

      <Text className="mt-2 font-semiBold text-xl">
        No Sharing of Transaction Records
      </Text>
      <Text>
        Rest assured, your transaction records stay with us. We don't share them
        with any third-party services.
      </Text>

      <Text className="mt-2 font-semiBold text-xl">
        Future Plans: End-to-End Encryption
      </Text>
      <Text>
        We're all about keeping your data secure. We're planning to implement
        end-to-end encryption soon to make sure your information is even safer.
      </Text>

      <Text className="mt-2 font-semiBold text-xl">Data Security</Text>
      <Text>
        We take data security seriously and use various measures to protect your
        info. However, keep in mind that no method of transmission over the
        Internet or electronic storage is 100% secure. But we're doing our best!
      </Text>

      <Text className="mt-2 font-semiBold text-xl">Contact Us</Text>
      <Text>
        Got any questions or concerns? Feel free to reach out to us at:
      </Text>
      <Text>
        Email:{' '}
        <Text
          className="text-blue-600"
          onPress={() => Linking.openURL('mailto:support@get6pm.com')}
        >
          support@get6pm.com
        </Text>
      </Text>
      <Separator className="mx-auto my-3 w-[70%]" />
      <Text className="text-center text-muted-foreground">
        Last updated: 7/8/2024
      </Text>
    </ScrollView>
  )
}
