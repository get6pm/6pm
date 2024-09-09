import { AnimatedRing } from '@/components/scanner/animated-ring'
// import { ScanningIndicator } from '@/components/scanner/scanning-indicator'
import { ScanningOverlay } from '@/components/scanner/scanning-overlay'
import { Button } from '@/components/ui/button'
import { Text } from '@/components/ui/text'
import { useUserEntitlements } from '@/hooks/use-purchases'
import { ENTILEMENT_LIMIT } from '@/lib/constaints'
import { cn } from '@/lib/utils'
import { getAITransactionData } from '@/mutations/transaction'
import { useTransactionStore } from '@/stores/transaction/store'
import { dayjsExtended } from '@6pm/utilities'
import type { UpdateTransaction } from '@6pm/validation'
import { t } from '@lingui/macro'
import { useLingui } from '@lingui/react'
import { createId } from '@paralleldrive/cuid2'
import { useMutation } from '@tanstack/react-query'
import { type CameraType, CameraView, useCameraPermissions } from 'expo-camera'
import * as Haptics from 'expo-haptics'
import { SaveFormat, manipulateAsync } from 'expo-image-manipulator'
import * as ImagePicker from 'expo-image-picker'
import {
  ChevronsRightIcon,
  ImagesIcon,
  ScanTextIcon,
  SwitchCameraIcon,
} from 'lucide-react-native'
import { cssInterop } from 'nativewind'
import { useRef, useState } from 'react'
import { ActivityIndicator, Linking } from 'react-native'
import { ImageBackground, View } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { toast } from '../common/toast'

cssInterop(CameraView, {
  className: {
    target: 'style',
  },
})

type ScannerProps = {
  onScanStart?: () => void
  onScanResult?: (result: UpdateTransaction) => void
  shouldRender?: boolean
  onLimitExceeded?: () => void
}

export function Scanner({
  onScanStart,
  onScanResult,
  shouldRender,
  onLimitExceeded,
}: ScannerProps) {
  const camera = useRef<CameraView>(null)
  const [facing, setFacing] = useState<CameraType>('back')
  const [permission, requestPermission] = useCameraPermissions()
  const [imageUri, setImageUri] = useState<string | null>(null)
  const { i18n } = useLingui()
  const { bottom } = useSafeAreaInsets()
  const { addDraftTransaction, updateDraftTransaction, transactions } =
    useTransactionStore()
  const { entilement } = useUserEntitlements()

  const todayTransactions = transactions.filter((t) =>
    dayjsExtended(t.createdAt).isSame(dayjsExtended(), 'day'),
  )

  const { mutateAsync } = useMutation({
    mutationKey: ['ai-transaction'],
    mutationFn: getAITransactionData,
    onError(error) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error)
      toast.error(error.message ?? t(i18n)`Cannot extract transaction`)
      setImageUri(null)
    },
    onSuccess(result) {
      if (!result.amount) {
        throw new Error(t(i18n)`Cannot extract transaction`)
      }
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success)
      onScanResult?.(result)
      updateDraftTransaction({
        ...result,
        id: result.id!,
      })
    },
  })

  function toggleFacing() {
    Haptics.selectionAsync()
    setFacing(facing === 'back' ? 'front' : 'back')
  }

  const transactionQuota =
    ENTILEMENT_LIMIT[entilement]?.['ai-transactions'] - todayTransactions.length

  async function processImages(uris: string[]) {
    if (transactionQuota - uris.length <= 0) {
      onLimitExceeded?.()
      return
    }

    onScanStart?.()

    await Promise.all(
      uris.map(async (uri) => {
        const id = createId()
        const manipResult = await manipulateAsync(
          uri,
          [
            {
              resize: { width: 1024 },
            },
          ],
          {
            compress: 0.5,
            format: SaveFormat.WEBP,
          },
        )
        addDraftTransaction({
          id,
          imageUri: manipResult.uri,
        })
        return await mutateAsync({
          id,
          fileUri: manipResult.uri,
        })
      }),
    )
  }

  async function takePicture() {
    Haptics.selectionAsync()
    const result = await camera.current?.takePictureAsync({
      scale: 0.5,
      quality: 0.5,
    })
    if (result?.uri) {
      return await processImages([result.uri])
    }
  }

  async function pickImage() {
    Haptics.selectionAsync()
    const result = await ImagePicker.launchImageLibraryAsync({
      allowsMultipleSelection: true,
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: false,
      quality: 0.5,
    })
    if (result.canceled) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error)
      return
    }
    return await processImages(result.assets.map((a) => a.uri))
  }

  if (!permission) {
    // Camera permissions are still loading.
    return (
      <View className="flex-1 items-center justify-center bg-muted">
        <ActivityIndicator size="large" />
      </View>
    )
  }

  if (!shouldRender) {
    return (
      <View className="flex-1 justify-center gap-4 bg-muted p-4">
        <ChevronsRightIcon className="size-10 text-muted-foreground" />
      </View>
    )
  }

  if (!permission.granted) {
    // Camera permissions are not granted.
    return (
      <View className="flex-1 items-center justify-center gap-6 bg-muted">
        <ScanTextIcon className="size-20 text-muted-foreground" />
        <Text className="mx-6 text-center">{t(
          i18n,
        )`6pm needs camera permissions to scan your transactions`}</Text>
        {permission.canAskAgain ? (
          <Button onPress={requestPermission}>
            <Text>{t(i18n)`Continue`}</Text>
          </Button>
        ) : (
          <Button onPress={() => Linking.openSettings()}>
            <Text>{t(i18n)`Open settings`}</Text>
          </Button>
        )}
      </View>
    )
  }

  if (imageUri) {
    return (
      <View className="relative flex-1 bg-primary">
        <ImageBackground
          source={{ uri: imageUri }}
          className="flex-1 items-center"
          style={{ paddingBottom: bottom }}
        >
          <ScanningOverlay />
          {/* <ScanningIndicator /> */}
          <View className="top-6 rounded-md bg-background p-2 px-4">
            <Text>{t(i18n)`Processing transaction...`}</Text>
          </View>
          <Button
            variant="secondary"
            size="icon"
            className="!opacity-100 absolute bottom-8 h-auto w-auto rounded-full bg-primary-foreground p-1"
            disabled
          >
            <AnimatedRing />
          </Button>
        </ImageBackground>
      </View>
    )
  }

  return (
    <View className="flex-1 bg-card">
      <CameraView
        ref={camera}
        className="flex-1 items-center"
        facing={facing}
        style={{ paddingBottom: bottom }}
      >
        <View
          className={cn(
            'top-6 rounded-md p-2 px-4',
            transactionQuota <= 0
              ? 'bg-amount-negative/20'
              : 'bg-background/50',
          )}
        >
          {transactionQuota <= 0 ? (
            <Text className="text-amount-negative">{t(
              i18n,
            )`You have reached the daily AI transaction limit`}</Text>
          ) : (
            <Text>{t(i18n)`Take a picture of your transaction`}</Text>
          )}
        </View>
        <View className="absolute right-6 bottom-8 left-6 z-10 flex-row items-center justify-between gap-4">
          <Button
            variant="secondary"
            size="icon"
            className="h-12 w-12 rounded-full"
            onPress={pickImage}
          >
            <ImagesIcon className="size-6 text-primary" />
          </Button>
          <Button
            variant="secondary"
            size="icon"
            className="h-auto w-auto rounded-full bg-primary-foreground p-1"
            onPress={takePicture}
          >
            <View className="h-16 w-16 rounded-full border-2 border-primary bg-primary-foreground" />
          </Button>
          <Button
            variant="secondary"
            size="icon"
            className="h-12 w-12 rounded-full"
            onPress={toggleFacing}
          >
            <SwitchCameraIcon className="size-6 text-primary" />
          </Button>
        </View>
      </CameraView>
    </View>
  )
}
