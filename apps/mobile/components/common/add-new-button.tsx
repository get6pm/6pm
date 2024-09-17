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
        '!h-11 !py-2 mx-6 my-1.5 items-center gap-4 border-dashed',
        className,
      )}
    >
      <PlusCircleIcon className="h-5 w-5 text-muted-foreground" />
      <Text>{label}</Text>
    </Button>
  )
}
