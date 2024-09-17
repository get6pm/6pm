import { toast } from '@/components/common/toast'
import { UserAvatar } from '@/components/common/user-avatar'
import { InputField } from '@/components/form-fields/input-field'
import { SubmitButton } from '@/components/form-fields/submit-button'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { Text } from '@/components/ui/text'
import { useUser } from '@clerk/clerk-expo'
import { zodResolver } from '@hookform/resolvers/zod'
import { t } from '@lingui/macro'
import { useLingui } from '@lingui/react'
import { useMutation } from '@tanstack/react-query'
import * as Haptics from 'expo-haptics'
import { SaveFormat, manipulateAsync } from 'expo-image-manipulator'
import * as ImagePicker from 'expo-image-picker'
import { useRouter } from 'expo-router'
import { Trash2Icon } from 'lucide-react-native'
import { Controller, FormProvider, useForm } from 'react-hook-form'
import { Alert, Pressable, ScrollView, View } from 'react-native'
import { z } from 'zod'

const zProfileForm = z.object({
  imageUrl: z.string().nullable(),
  fullName: z.string().min(1, 'Profile name is required'),
})
type ProfileFormValues = z.infer<typeof zProfileForm>

export default function ProfileScreen() {
  const { i18n } = useLingui()
  const { user } = useUser()
  const router = useRouter()
  const { mutateAsync: mutateUpdateProfile } = useMutation({
    mutationFn: async (values: Partial<ProfileFormValues>) => {
      await Promise.all([
        values.imageUrl !== undefined &&
          user?.setProfileImage({
            file: values.imageUrl,
          }),
        user?.update({
          firstName: values?.fullName?.split(' ')[0],
          lastName: values?.fullName?.split(' ')[1],
        }),
      ])
    },
    onSuccess() {
      toast.success(t(i18n)`Profile updated successfully`)
      router.back()
    },
    onError(error) {
      toast.error(error?.message ?? t(i18n)`Unknown error`)
    },
  })

  const { mutateAsync: mutateDeleteAccount, isPending: isDeleting } =
    useMutation({
      mutationFn: user?.delete,
      onSuccess() {
        toast.success(t(i18n)`Account deleted successfully`)
      },
      onError(error) {
        toast.error(error?.message ?? t(i18n)`Unknown error`)
      },
    })

  const profileForm = useForm<ProfileFormValues>({
    resolver: zodResolver(zProfileForm),
    defaultValues: {
      fullName: user?.fullName ?? '',
      imageUrl: user?.imageUrl ?? null,
    },
  })

  async function handlePickImage() {
    Haptics.selectionAsync()
    const result = await ImagePicker.launchImageLibraryAsync({
      allowsMultipleSelection: false,
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: false,
      quality: 0.5,
    })
    if (result.canceled) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error)
      return
    }
    const manipResult = await manipulateAsync(
      result.assets[0].uri,
      [
        {
          resize: { width: 512 },
        },
      ],
      {
        compress: 0.5,
        format: SaveFormat.WEBP,
        base64: true,
      },
    )
    const base64 = manipResult.base64
    const imageUrl = base64 ? `data:image/webp;base64,${base64}` : null
    profileForm.setValue('imageUrl', imageUrl, { shouldDirty: true })
  }

  async function onSubmit(data: ProfileFormValues) {
    if (data.imageUrl === user?.imageUrl) {
      return await mutateUpdateProfile({
        fullName: data.fullName,
      })
    }
    return await mutateUpdateProfile(data)
  }

  function handleDeleteAccount() {
    Alert.alert(
      '',
      t(
        i18n,
      )`Are you sure you want to delete your account? This action cannot be undone.`,
      [
        {
          text: t(i18n)`Cancel`,
          style: 'cancel',
        },
        {
          text: t(i18n)`Delete`,
          style: 'destructive',
          onPress: async () => {
            await mutateDeleteAccount()
          },
        },
      ],
    )
  }

  return (
    <ScrollView className="bg-card" contentContainerClassName="px-6 py-3">
      <FormProvider {...profileForm}>
        <View className="gap-4">
          <Pressable onPress={handlePickImage}>
            <Controller
              name="imageUrl"
              control={profileForm.control}
              render={({ field: { value } }) => (
                <UserAvatar
                  user={{
                    ...user!,
                    imageUrl: value!,
                  }}
                  className="h-20 w-20"
                />
              )}
            />
          </Pressable>
          <View>
            <Text className="font-medium text-base text-primary">
              {t(i18n)`Avatar`}
            </Text>
            <View className="flex-row items-center gap-2">
              <Button variant="secondary" size="sm" onPress={handlePickImage}>
                <Text>{t(i18n)`Upload new photo`}</Text>
              </Button>
              <Button
                variant="ghost"
                size="icon"
                disabled={!user?.imageUrl}
                onPress={() =>
                  profileForm.setValue('imageUrl', null, { shouldDirty: true })
                }
              >
                <Trash2Icon className="h-5 w-5 text-primary" />
              </Button>
            </View>
          </View>
          <InputField
            name="fullName"
            label={t(i18n)`Display name`}
            placeholder={t(i18n)`Your display name`}
            autoCapitalize="words"
            disabled={profileForm.formState.isLoading}
          />
          <SubmitButton
            className="self-start"
            onPress={profileForm.handleSubmit(onSubmit)}
            disabled={
              profileForm.formState.isLoading || !profileForm.formState.isDirty
            }
          >
            <Text>{t(i18n)`Save changes`}</Text>
          </SubmitButton>
        </View>
      </FormProvider>
      <Separator className="mt-20 mb-4" />
      <View className="gap-3">
        <Text className="font-medium text-base text-primary">
          {t(i18n)`Danger zone`}
        </Text>
        <Button
          onPress={handleDeleteAccount}
          disabled={isDeleting}
          variant="destructive-outline"
          size="sm"
          className="self-start"
        >
          <Text>{t(i18n)`Delete 6pm account`}</Text>
        </Button>
        <Text className="mb-4 text-muted-foreground text-sm">
          {t(i18n)`All your data will be deleted`}
        </Text>
      </View>
    </ScrollView>
  )
}
