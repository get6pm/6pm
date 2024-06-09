import { type VariantProps, cva } from 'class-variance-authority'
import { TouchableOpacity } from 'react-native'

import { forwardRef } from 'react'
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
        default: 'h-10 w-10',
        lg: 'h-12 w-12',
        sm: 'h-8 w-8',
        xl: 'h-14 w-14',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  },
)

const iconVariants = cva('text-center font-medium font-sans', {
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
      default: 'w-5 h-5',
      sm: 'w-5 h-5',
      lg: 'w-6 h-6',
      xl: 'w-6 h-6',
    },
  },
  defaultVariants: {
    variant: 'default',
    size: 'default',
  },
})

export interface IconButtonProps
  extends React.ComponentPropsWithoutRef<typeof TouchableOpacity>,
  VariantProps<typeof buttonVariants> {
  icon: React.ComponentType<SvgProps>
  iconClasses?: string
}

const IconButton = forwardRef(function ({
  icon: Icon,
  iconClasses,
  className,
  variant,
  size,
  disabled,
  ...props
}: IconButtonProps, ref: React.ForwardedRef<TouchableOpacity>) {
  return (
    <TouchableOpacity
      ref={ref}
      activeOpacity={0.8}
      className={cn(buttonVariants({ variant, size, className }), {
        'opacity-50': disabled,
      })}
      disabled={disabled}
      {...props}
    >
      <Icon
        className={cn(iconVariants({ variant, size, className: iconClasses }))}
      />
    </TouchableOpacity>
  )
})

export { IconButton, buttonVariants, iconVariants }
