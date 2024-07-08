import { cn } from '@/lib/utils'
import { PlusCircleIcon } from 'lucide-react-native'
import { Button } from '../ui/button'
import { Text } from '../ui/text'

type AddNewButtonProps = {
  label: string
  className?: string
  onPress?: () => void
}

export function AddNewButton({ label, className, onPress }: AddNewButtonProps) {
  return (
    <Button
      variant="outline"
      onPress={onPress}
      className={cn(
        'border-dashed items-center gap-4 mx-6 my-1.5 !h-11 !py-2',
        className,
      )}
    >
      <PlusCircleIcon className="w-5 h-5 text-muted-foreground" />
      <Text className="font-normal font-sans">{label}</Text>
    </Button>
  )
}
