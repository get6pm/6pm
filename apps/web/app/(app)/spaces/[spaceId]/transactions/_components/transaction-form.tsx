'use client'
import { getCurrencyInputProps } from '@/lib/get-currency-input-props'
import {
  TransactionType,
  type TransactionValues,
  zTransaction,
} from '@/schemas/transaction'
import type { Account, SpendingCategory } from '@6pm/db'
import { Button } from '@6pm/ui/components/button'
import { Calendar } from '@6pm/ui/components/calendar'
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
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@6pm/ui/components/popover'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@6pm/ui/components/select'
import { Textarea } from '@6pm/ui/components/textarea'
import { format } from '@6pm/ui/lib/date-fns'
import { cn } from '@6pm/ui/lib/utils'
import { capitalize } from 'lodash-es'
import { CalendarIcon } from 'lucide-react'
import { useTranslations } from 'next-intl'
import { type FC, type ReactNode, useEffect } from 'react'
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
      type: TransactionType.EXPENSE,
      isNegative: true,
      ...initialValues,
    },
  })
  return <Form {...form}>{children}</Form>
}

export type TransactionFormContentProps = {
  categories: SpendingCategory[]
  accounts: Account[]
  onSubmit: (values: TransactionValues) => void | Promise<void>
  children?: (props: { isSubmitting: boolean }) => ReactNode
  className?: string
}

export const TransactionFormContent: FC<TransactionFormContentProps> = ({
  categories,
  accounts,
  onSubmit,
  children,
  className,
}) => {
  const form = useFormContext<TransactionValues>()
  const { space } = useSpaceContext()
  const t = useTranslations()
  const type = form.watch('type')

  // Reset isNegative and category field when type changes
  // biome-ignore lint/correctness/useExhaustiveDependencies: <explanation>
  useEffect(() => {
    form.setValue('isNegative', true)
    form.setValue('categoryId', undefined)
  }, [type])

  console.log(form.formState.errors)

  const typeField = (
    <FormField
      control={form.control}
      name="type"
      render={({ field }) => (
        <FormItem className="col-span-1">
          <FormLabel withAsterisk>Transaction type</FormLabel>
          <Select onValueChange={field.onChange} value={field.value}>
            <FormControl>
              <SelectTrigger
                className="w-full"
                disabled={form.formState.isSubmitting}
              >
                <SelectValue placeholder="Select a transaction type" />
              </SelectTrigger>
            </FormControl>
            <SelectContent>
              {/* <SelectItem value="m@example.com">m@example.com</SelectItem>
              <SelectItem value="m@google.com">m@google.com</SelectItem>
              <SelectItem value="m@support.com">m@support.com</SelectItem> */}
              {Object.values(TransactionType).map((type) => (
                <SelectItem key={type} value={type}>
                  {capitalize(t(`transaction-types.${type}`))}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <FormMessage />
        </FormItem>
      )}
    />
  )

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

  const dateField = (
    <FormField
      control={form.control}
      name="date"
      render={({ field }) => (
        <FormItem className="col-span-1">
          <FormLabel>Date</FormLabel>
          <Popover>
            <PopoverTrigger asChild disabled={form.formState.isSubmitting}>
              <FormControl>
                <Button
                  variant={'outline'}
                  className={cn(
                    'w-full pl-3 text-left font-medium',
                    !field.value && 'text-muted-foreground',
                  )}
                >
                  {field.value ? (
                    format(field.value, 'PPPP')
                  ) : (
                    <span>Pick a date</span>
                  )}
                  <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                </Button>
              </FormControl>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar
                mode="single"
                selected={field.value}
                onSelect={field.onChange}
                disabled={(date) => date < new Date('1900-01-01')}
                initialFocus
              />
            </PopoverContent>
          </Popover>
          <FormMessage />
        </FormItem>
      )}
    />
  )

  const isNegativeField = (
    <FormField
      control={form.control}
      name="isNegative"
      render={({ field }) => (
        <FormItem className="col-span-1 mt-auto">
          <FormLabel />
          <FormControl>
            <Select
              disabled={
                form.formState.isSubmitting || type === TransactionType.INCOME
              }
              onValueChange={(value) => field.onChange(value === 'true')}
              value={field.value ? 'true' : 'false'}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select a value" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="true">
                  {(type === TransactionType.EXPENSE && 'Expense') ||
                    (type === TransactionType.TRANSFER && 'Incoming') ||
                    (type === TransactionType.INCOME && 'Income')}
                </SelectItem>
                <SelectItem value="false">
                  {(type === TransactionType.EXPENSE && 'Income') ||
                    (type === TransactionType.TRANSFER && 'Outgoing')}
                </SelectItem>
              </SelectContent>
            </Select>
          </FormControl>
          <FormMessage />
        </FormItem>
      )}
    />
  )

  const categoryField = (
    <FormField
      control={form.control}
      name="categoryId"
      render={({ field }) => (
        <FormItem className="col-span-1">
          <FormLabel>Category</FormLabel>
          <Select onValueChange={field.onChange} value={field.value}>
            <FormControl>
              <SelectTrigger
                className="w-full"
                disabled={
                  form.formState.isSubmitting ||
                  type !== TransactionType.EXPENSE
                }
              >
                <SelectValue placeholder="Select a category" />
              </SelectTrigger>
            </FormControl>
            <SelectContent>
              {categories.map((category) => (
                <SelectItem key={category.id} value={category.id}>
                  {category.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <FormMessage />
        </FormItem>
      )}
    />
  )

  const accountField = (
    <FormField
      control={form.control}
      name="accountId"
      render={({ field }) => (
        <FormItem className="col-span-1">
          <FormLabel withAsterisk>Account</FormLabel>
          <Select onValueChange={field.onChange} value={field.value}>
            <FormControl>
              <SelectTrigger
                className="w-full"
                disabled={form.formState.isSubmitting}
              >
                <SelectValue placeholder="Select an account" />
              </SelectTrigger>
            </FormControl>
            <SelectContent>
              {accounts.map((account) => (
                <SelectItem key={account.id} value={account.id}>
                  {account.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <FormMessage />
        </FormItem>
      )}
    />
  )

  const notesField = (
    <FormField
      control={form.control}
      name="notes"
      render={({ field }) => (
        <FormItem className="col-span-2">
          <FormLabel>Notes</FormLabel>
          <FormControl>
            <Textarea
              className="w-full"
              disabled={form.formState.isSubmitting}
              placeholder="Notes"
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
        {typeField}
        {isNegativeField}
        {nameField}
        {amountField}
        {dateField}
        <div className="col-span-1" />
        {categoryField}
        {type !== TransactionType.EXPENSE ? (
          accountField
        ) : (
          <div className="col-span-1" />
        )}
        {notesField}
      </div>
    </form>
  )
}
