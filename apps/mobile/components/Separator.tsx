import { type VariantProps, cva } from 'class-variance-authority'
import { View } from 'react-native'

import { cn } from '../lib/utils'

const separatorVariants = cva(
  'bg-border shrink-0',
  {
    variants: {
      variant: {
        horizontal: 'h-[1] w-full',
        vertical: 'w-[1] h-full'
      },
    },
    defaultVariants: {
      variant: 'horizontal',
    },
  },
)

interface SeparatorProps
  extends React.ComponentPropsWithoutRef<typeof View>,
  VariantProps<typeof separatorVariants> {
}
function Separator({
  className,
  variant,
  ...props
}: SeparatorProps) {
  return (
    <View
      className={cn(separatorVariants({ variant, className }))}
      {...props}
    />
  )
}

export { Separator, separatorVariants }
