'use client'
import config from '@/constants/config'
import { getCurrencyInputProps } from '@/lib/get-currency-input-props'
import {
  type AccountType,
  type AccountValues,
  zAccount,
} from '@/schemas/account'
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
import { AccountCardPreview } from './account-card-preview'

export type AccountFormProps = {
  accountType: AccountType
  initialValues?: Partial<AccountValues>
  children: ReactNode
}

export const AccountForm: FC<AccountFormProps> = ({
  accountType,
  initialValues,
  children,
}) => {
  const form = useForm<AccountValues>({
    defaultValues: {
      name: '',
      institutionName: accountType === 'cash_manual' ? 'Cash' : '',
      lastDigits: '',
      accountType,
      ...initialValues,
    },
    resolver: zodResolver(zAccount),
  })
  return <Form {...form}>{children}</Form>
}

export type AccountFormContentProps = {
  onSubmit: (values: AccountValues) => void | Promise<void>
  children?: ReactNode
  className?: string
}

export const AccountFormContent: FC<AccountFormContentProps> = ({
  onSubmit,
  children,
  className,
}) => {
  const { space } = useSpaceContext()
  const form = useFormContext<AccountValues>()
  const { accountType, name, color, institutionName, lastDigits } = form.watch()

  const institutionNameField = (
    <FormField
      control={form.control}
      name="institutionName"
      render={({ field }) => (
        <FormItem>
          <FormLabel>Institution name</FormLabel>
          <FormControl>
            <Input placeholder="VCB, MB, ..." {...field} />
          </FormControl>
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
        <FormItem>
          <FormLabel withAsterisk>Account name</FormLabel>
          <FormControl>
            <Input placeholder="Account name" {...field} />
          </FormControl>
          <FormMessage />
        </FormItem>
      )}
    />
  )

  const lastDigitsField = (
    <FormField
      control={form.control}
      name="lastDigits"
      render={({ field }) => (
        <FormItem>
          <FormLabel>Last digits</FormLabel>
          <FormControl>
            <Input placeholder="1234" {...field} />
          </FormControl>
          <FormMessage />
        </FormItem>
      )}
    />
  )

  const balanceField = (
    <FormField
      control={form.control}
      name="balance"
      render={({ field }) => (
        <FormItem>
          <FormLabel>Balance</FormLabel>
          <FormControl>
            <NumberInput
              placeholder="Balance"
              {...getCurrencyInputProps(space.baseCurrencyCode)}
              {...field}
            />
          </FormControl>
          <FormMessage />
        </FormItem>
      )}
    />
  )

  const creditLimitField = (
    <FormField
      control={form.control}
      name="creditLimit"
      render={({ field }) => (
        <FormItem>
          <FormLabel>Credit limit</FormLabel>
          <FormControl>
            <NumberInput
              placeholder="Credit limit"
              {...getCurrencyInputProps(space.baseCurrencyCode)}
              {...field}
            />
          </FormControl>
          <FormMessage />
        </FormItem>
      )}
    />
  )

  const cardPreviewEl = (
    <div className="mt-[18px] flex flex-col items-center gap-2">
      <AccountCardPreview
        accountName={name}
        institutionName={institutionName}
        lastDigits={lastDigits}
        color={color}
        className="shrink-0"
        scale={0.98}
      />
      <div className="mt-auto flex flex-row gap-2">
        {Object.entries(config.accountColors).map(([key, value]) => (
          <button
            key={key}
            type="button"
            className={cn('size-6 rounded-full')}
            style={{ backgroundColor: value }}
            onClick={() => form.setValue('color', key)}
          />
        ))}
      </div>
    </div>
  )

  if (accountType === 'cash_manual') {
    return (
      <form
        onSubmit={form.handleSubmit(onSubmit)}
        className={cn('space-y-4', className)}
      >
        <div className="flex gap-4">
          <div className="flex-1 space-y-4">
            {nameField}
            {balanceField}
          </div>
          {cardPreviewEl}
        </div>
        {children}
      </form>
    )
  }

  if (accountType === 'credit_manual') {
    return (
      <form
        onSubmit={form.handleSubmit(onSubmit)}
        className={cn('space-y-4', className)}
      >
        {institutionNameField}
        {nameField}
        {lastDigitsField}
        <div className="flex gap-4">
          <div className="flex-1 space-y-4">
            {balanceField}
            {creditLimitField}
          </div>
          {cardPreviewEl}
        </div>
        {children}
      </form>
    )
  }

  return (
    <form
      onSubmit={form.handleSubmit(onSubmit)}
      className={cn('space-y-4', className)}
    >
      {institutionNameField}
      {nameField}
      <div className="flex gap-4">
        <div className="flex-1 space-y-4">
          {lastDigitsField}
          {balanceField}
        </div>
        {cardPreviewEl}
      </div>
      {children}
    </form>
  )
}
