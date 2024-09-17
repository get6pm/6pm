import { useRouter } from 'expo-router'
import { ArrowLeftIcon } from 'lucide-react-native'
import { Button } from '../ui/button'

export function BackButton() {
  const router = useRouter()
  if (!router.canGoBack) {
    return null
  }
  return (
    <Button size="icon" variant="ghost" onPress={router.back}>
      <ArrowLeftIcon className="h-6 w-6 text-foreground" />
    </Button>
  )
}
