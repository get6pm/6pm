import { toast } from '@/components/common/toast'
import { Scanner } from '@/components/transaction/scanner'
import { TransactionForm } from '@/components/transaction/transaction-form'
import { Button } from '@/components/ui/button'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { useUserMetadata } from '@/hooks/use-user-metadata'
import { useCreateTransaction } from '@/stores/transaction/hooks'
import { useTransactionStore } from '@/stores/transaction/store'
import { useDefaultCurrency } from '@/stores/user-settings/hooks'
import { useWalletList } from '@/stores/wallet/hooks'
import {
  type TransactionFormValues,
  zTransactionFormValues,
  zUpdateTransaction,
} from '@6pm/validation'
import { zodResolver } from '@hookform/resolvers/zod'
import { t } from '@lingui/macro'
import { useLingui } from '@lingui/react'
import { createId } from '@paralleldrive/cuid2'
import { PortalHost, useModalPortalRoot } from '@rn-primitives/portal'
import * as Haptics from 'expo-haptics'
import { useLocalSearchParams, useNavigation, useRouter } from 'expo-router'
import { CameraIcon, KeyboardIcon, Trash2Icon } from 'lucide-react-native'
import { useEffect, useRef, useState } from 'react'
import { useForm } from 'react-hook-form'
import {
  ActivityIndicator,
  Alert,
  Dimensions,
  Keyboard,
  ScrollView,
  View,
} from 'react-native'

export default function NewRecordScreen() {
  const { i18n } = useLingui()
  const ref = useRef<ScrollView>(null)
  const router = useRouter()
  const { wallets } = useWalletList()
  const defaultCurrency = useDefaultCurrency()
  const defaultWallet = wallets?.[0]
  const { sideOffset, ...rootProps } = useModalPortalRoot()
  const [page, setPage] = useState<number>(0)
  const { defaultBudgetId } = useUserMetadata()
  const navigation = useNavigation()
  const [width, setWidth] = useState(Dimensions.get('window').width)
  const { removeDraftTransaction } = useTransactionStore()

  const params = useLocalSearchParams()
  const parsedParams = zUpdateTransaction.parse(params)
  const defaultValues = {
    date: new Date(),
    amount: 0,
    currency: defaultCurrency,
    note: '',
    walletAccountId: defaultWallet?.id,
    budgetId: defaultBudgetId as string,
    ...parsedParams,
  }

  const transactionForm = useForm<TransactionFormValues>({
    resolver: zodResolver(zTransactionFormValues),
    defaultValues,
  })

  const { mutateAsync } = useCreateTransaction()

  // biome-ignore lint/correctness/useExhaustiveDependencies: <explanation>
  useEffect(() => {
    navigation.setOptions({
      headerTitle: () => (
        <Tabs
          value={page.toString()}
          onValueChange={(value) => {
            setPage(Number(value))
            Keyboard.dismiss()
            ref.current?.scrollTo({
              y: 0,
              x: value === '0' ? 0 : width,
              animated: true,
            })
          }}
          className="w-[160px]"
        >
          <TabsList className="border border-border dark:border-primary/10">
            <TabsTrigger value="0">
              <KeyboardIcon className="!text-primary size-6" />
            </TabsTrigger>
            <TabsTrigger value="1">
              <CameraIcon className="!text-primary size-6" />
            </TabsTrigger>
          </TabsList>
        </Tabs>
      ),
      headerRight: () =>
        parsedParams?.id ? (
          <Button
            size="icon"
            variant="ghost"
            onPress={() => {
              removeDraftTransaction(parsedParams.id!)
              router.back()
            }}
          >
            <Trash2Icon className="size-6 text-destructive" />
          </Button>
        ) : null,
    })
  }, [page])

  const handleCreateTransaction = async (values: TransactionFormValues) => {
    try {
      if (parsedParams?.id) {
        removeDraftTransaction(parsedParams.id)
      }
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success)
      router.back()
      toast.success(t(i18n)`Transaction created`)

      await mutateAsync({
        id: parsedParams.id || createId(),
        data: {
          ...values,
          amount: values.categoryId ? values.amount : -Math.abs(values.amount),
        },
      })
    } catch (error) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error)
      if (error instanceof Error) {
        Alert.alert(error.message)
      }
    }
  }

  if (!defaultWallet) {
    return (
      <View className="flex-1 items-center justify-center bg-muted">
        <ActivityIndicator size="large" />
      </View>
    )
  }

  return (
    <View className="flex-1 bg-card" {...rootProps}>
      <ScrollView
        ref={ref}
        horizontal
        pagingEnabled
        bounces={false}
        scrollEventThrottle={16}
        onMomentumScrollEnd={({ nativeEvent }) => {
          const page = Math.round(nativeEvent.contentOffset.x / width)
          setPage(page)
          Keyboard.dismiss()
        }}
        showsHorizontalScrollIndicator={false}
        onLayout={(e) => setWidth(e.nativeEvent.layout.width)}
      >
        <View style={{ width }}>
          <TransactionForm
            sideOffset={sideOffset}
            form={transactionForm}
            onSubmit={handleCreateTransaction}
            onCancel={router.back}
            onOpenScanner={() => {
              ref.current?.scrollTo({
                y: 0,
                x: width,
                animated: true,
              })
            }}
          />
        </View>
        <View style={{ width }}>
          <Scanner
            onScanStart={() => {
              router.back()
              toast.success(t(i18n)`Transaction added to processing queue`)
            }}
            shouldRender={page === 1}
            onLimitExceeded={() => {
              router.push('/paywall')
            }}
          />
        </View>
      </ScrollView>
      <PortalHost name="transaction-form" />
    </View>
  )
}
