'use client'
import { getCurrencyInputProps } from '@/lib/get-currency-input-props'
import { type TransactionValues, zTransaction } from '@/schemas/transaction'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  useForm,
  useFormContext,
  zodResolver,
} from '@6pm/ui/components/form'
import { Input } from '@6pm/ui/components/input'
import { NumberInput } from '@6pm/ui/components/number-input'
import { cn } from '@6pm/ui/lib/utils'
import type { FC, ReactNode } from 'react'
import { useSpaceContext } from '../../_components/space-context'

export type TransactionFormProps = {
  initialValues?: Partial<TransactionValues>
  children: ReactNode
}

export const TransactionForm: FC<TransactionFormProps> = ({
  initialValues,
  children,
}) => {
  const form = useForm<TransactionValues>({
    resolver: zodResolver(zTransaction),
    defaultValues: {
      name: '',
      // amount: 0,
      date: new Date(),
      accountId: '',
      categoryId: '',
      notes: '',
      isExclusive: false,
      tagIds: [],
      ...initialValues,
    },
  })
  return <Form {...form}>{children}</Form>
}

export type TransactionFormContentProps = {
  onSubmit: (values: TransactionValues) => void | Promise<void>
  children?: (props: { isSubmitting: boolean }) => ReactNode
  className?: string
}

export const TransactionFormContent: FC<TransactionFormContentProps> = ({
  onSubmit,
  children,
  className,
}) => {
  const form = useFormContext<TransactionValues>()
  const { space } = useSpaceContext()

  const nameField = (
    <FormField
      control={form.control}
      name="name"
      render={({ field }) => (
        <FormItem className="col-span-1">
          <FormLabel withAsterisk>Transaction name</FormLabel>
          <FormControl>
            <Input
              autoFocus
              className="w-full"
              disabled={form.formState.isSubmitting}
              placeholder="Transaction name"
              {...field}
            />
          </FormControl>
          <FormMessage />
        </FormItem>
      )}
    />
  )

  const amountField = (
    <FormField
      control={form.control}
      name="amount"
      render={({ field }) => (
        <FormItem className="col-span-1">
          <FormLabel withAsterisk>Amount</FormLabel>
          <FormControl>
            <NumberInput
              disabled={form.formState.isSubmitting}
              placeholder="Amount"
              className="w-full"
              {...getCurrencyInputProps(space.baseCurrencyCode)}
              {...field}
            />
          </FormControl>
          <FormMessage />
        </FormItem>
      )}
    />
  )

  return (
    <form onSubmit={form.handleSubmit(onSubmit)}>
      {children && children({ isSubmitting: form.formState.isSubmitting })}
      <div className={cn('grid grid-cols-2 items-start gap-4', className)}>
        {nameField}
        {amountField}
      </div>
    </form>
  )
}
