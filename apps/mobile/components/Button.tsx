import { type VariantProps, cva } from 'class-variance-authority'
import { Text, TouchableOpacity } from 'react-native'

import type { SvgProps } from 'react-native-svg'
import { cn } from '../lib/utils'

const buttonVariants = cva(
  'flex flex-row items-center gap-2 justify-center rounded-md',
  {
    variants: {
      variant: {
        default: 'bg-primary',
        secondary: 'bg-secondary',
        outline: 'border-border border',
        destructive: 'bg-destructive',
        ghost: 'bg-transparent',
        link: 'text-primary underline-offset-4',
      },
      size: {
        default: 'h-12 px-4',
        sm: 'h-8 px-2',
        lg: 'h-14 px-8',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  },
)

const buttonTextVariants = cva('text-center font-medium font-sans', {
  variants: {
    variant: {
      default: 'text-primary-foreground',
      secondary: 'text-secondary-foreground',
      outline: 'text-primary',
      destructive: 'text-destructive-foreground',
      ghost: 'text-primary',
      link: 'text-primary-foreground underline',
    },
    size: {
      default: 'text-base',
      sm: 'text-sm',
      lg: 'text-xl',
    },
  },
  defaultVariants: {
    variant: 'default',
    size: 'default',
  },
})

export interface ButtonProps
  extends React.ComponentPropsWithoutRef<typeof TouchableOpacity>,
  VariantProps<typeof buttonVariants> {
  label: string
  labelClasses?: string
  leftIcon?: React.ComponentType<SvgProps>
  rightIcon?: React.ComponentType<SvgProps>
}
function Button({
  label,
  labelClasses,
  className,
  variant,
  size,
  leftIcon: LeftIcon,
  rightIcon: RightIcon,
  disabled,
  ...props
}: ButtonProps) {
  return (
    <TouchableOpacity
      activeOpacity={0.8}
      className={cn(
        buttonVariants({ variant, size, className }),
        { 'opacity-50': disabled },
      )}
      disabled={disabled}
      {...props}
    >
      {LeftIcon && (
        <LeftIcon
          className={cn(
            'w-5 h-5',
            buttonTextVariants({ variant, size, className: labelClasses }),
          )}
        />
      )}
      <Text
        className={cn(
          buttonTextVariants({ variant, size, className: labelClasses }),
        )}
      >
        {label}
      </Text>
      {RightIcon && (
        <RightIcon
          className={cn(
            'w-5 h-5',
            buttonTextVariants({ variant, size, className: labelClasses }),
          )}
        />
      )}
    </TouchableOpacity>
  )
}

export { Button, buttonVariants, buttonTextVariants }
