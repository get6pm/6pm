import { AnimatedRing } from '@/components/scanner/animated-ring'
// import { ScanningIndicator } from '@/components/scanner/scanning-indicator'
import { ScanningOverlay } from '@/components/scanner/scanning-overlay'
import { Button } from '@/components/ui/button'
import { Text } from '@/components/ui/text'
import { getAITransactionData } from '@/mutations/transaction'
import type { UpdateTransaction } from '@6pm/validation'
import { t } from '@lingui/macro'
import { useLingui } from '@lingui/react'
import { useMutation } from '@tanstack/react-query'
import { type CameraType, CameraView, useCameraPermissions } from 'expo-camera'
import * as Haptics from 'expo-haptics'
import { SaveFormat, manipulateAsync } from 'expo-image-manipulator'
import * as ImagePicker from 'expo-image-picker'
import {
  CameraIcon,
  ImagesIcon,
  LoaderIcon,
  SwitchCameraIcon,
} from 'lucide-react-native'
import { cssInterop } from 'nativewind'
import { useRef, useState } from 'react'
import { Alert } from 'react-native'
import { ImageBackground, View } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'

cssInterop(CameraView, {
  className: {
    target: 'style',
  },
})

type ScannerProps = {
  onScanStart?: () => void
  onScanResult: (result: UpdateTransaction) => void
}

export function Scanner({ onScanStart, onScanResult }: ScannerProps) {
  const camera = useRef<CameraView>(null)
  const [facing, setFacing] = useState<CameraType>('back')
  const [permission, requestPermission] = useCameraPermissions()
  const [imageUri, setImageUri] = useState<string | null>(null)
  const { i18n } = useLingui()
  const { bottom } = useSafeAreaInsets()

  const { mutateAsync } = useMutation({
    mutationFn: getAITransactionData,
    onMutate() {
      onScanStart?.()
    },
    onError(error) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error)
      Alert.alert(error.message ?? t(i18n)`Cannot extract transaction data`)
      setImageUri(null)
    },
    onSuccess(result) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success)
      onScanResult(result)
      setImageUri(null)
    },
  })

  function toggleFacing() {
    Haptics.selectionAsync()
    setFacing(facing === 'back' ? 'front' : 'back')
  }

  async function processImage(uri: string) {
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
    setImageUri(manipResult.uri)
    await mutateAsync(manipResult.uri)
  }

  async function takePicture() {
    Haptics.selectionAsync()
    const result = await camera.current?.takePictureAsync({
      scale: 0.5,
      quality: 0.5,
    })
    if (result?.uri) {
      return await processImage(result.uri)
    }
  }

  async function pickImage() {
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
    return await processImage(result.assets[0].uri)
  }

  if (!permission) {
    // Camera permissions are still loading.
    return (
      <View className="flex-1 items-center bg-muted justify-center">
        <LoaderIcon className="size-7 animate-spin text-primary" />
      </View>
    )
  }

  if (!permission.granted) {
    // Camera permissions are not granted.
    return (
      <View className="flex-1 items-center bg-muted gap-4 justify-center">
        <CameraIcon className="size-16 text-muted-foreground" />
        <Text>{t(i18n)`Camera permissions are not granted`}</Text>
        <Button variant="outline" onPress={requestPermission}>
          <Text>{t(i18n)`Grant camera permissions`}</Text>
        </Button>
      </View>
    )
  }

  if (imageUri) {
    return (
      <View className="flex-1 bg-primary relative">
        <ImageBackground
          source={{ uri: imageUri }}
          className="flex-1 items-center"
          style={{ paddingBottom: bottom }}
        >
          <ScanningOverlay />
          {/* <ScanningIndicator /> */}
          <View className="top-6 bg-background p-2 px-4 rounded-md">
            <Text>{t(i18n)`Processing transaction...`}</Text>
          </View>
          <Button
            variant="secondary"
            size="icon"
            className="w-auto !opacity-100 h-auto p-1 absolute bottom-8 rounded-full bg-primary-foreground"
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
        <View className="top-6 bg-background/50 p-2 px-4 rounded-md">
          <Text>{t(i18n)`Take a picture of your transaction`}</Text>
        </View>
        <View className="absolute bottom-8 left-6 right-6 flex-row items-center justify-between gap-4">
          <Button
            variant="secondary"
            size="icon"
            className="rounded-full w-12 h-12"
            onPress={pickImage}
          >
            <ImagesIcon className="size-6 text-primary" />
          </Button>
          <Button
            variant="secondary"
            size="icon"
            className="w-auto h-auto p-1 rounded-full bg-primary-foreground"
            onPress={takePicture}
          >
            <View className="w-16 h-16 bg-primary-foreground border-2 border-primary rounded-full" />
          </Button>
          <Button
            variant="secondary"
            size="icon"
            className="rounded-full w-12 h-12"
            onPress={toggleFacing}
          >
            <SwitchCameraIcon className="size-6 text-primary" />
          </Button>
        </View>
      </CameraView>
    </View>
  )
}
